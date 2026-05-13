import { Request, Response, NextFunction } from 'express';
import chatService from '../services/chat.service';

/**
 * @route   POST /api/conversations
 * @desc    Get or create a conversation with another user (optionally about a product)
 * @access  Private
 */
export const getOrCreateConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { otherUserId, productId } = req.body;
    const conversation = await chatService.getOrCreateConversation(
      req.user!._id.toString(),
      otherUserId,
      productId
    );

    res.status(200).json({
      success: true,
      data: { conversation },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/conversations
 * @desc    Get all conversations for the current user
 * @access  Private
 */
export const getUserConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const conversations = await chatService.getUserConversations(
      req.user!._id.toString()
    );

    res.status(200).json({
      success: true,
      data: { conversations },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/conversations/:id/messages
 * @desc    Get messages for a conversation (paginated)
 * @access  Private (participant only)
 */
export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await chatService.getMessages(
      id,
      req.user!._id.toString(),
      page,
      limit
    );

    res.status(200).json({
      success: true,
      data: {
        messages: result.messages,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/conversations/:id/messages
 * @desc    Send a message in a conversation
 * @access  Private (participant only)
 */
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, type, offer, quickReplyLabel, attachments } = req.body;

    const message = await chatService.sendMessage(
      id,
      req.user!._id.toString(),
      content,
      type,
      { offer, quickReplyLabel, attachments }
    );

    res.status(201).json({
      success: true,
      data: { message },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/conversations/:id/read
 * @desc    Mark all messages in a conversation as read
 * @access  Private (participant only)
 */
export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const count = await chatService.markAsRead(
      id,
      req.user!._id.toString()
    );

    res.status(200).json({
      success: true,
      data: { markedRead: count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/conversations/unread-count
 * @desc    Get total unread message count for the current user
 * @access  Private
 */
export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const count = await chatService.getUnreadCount(
      req.user!._id.toString()
    );

    res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/conversations/:id
 * @desc    Delete a conversation and its messages
 * @access  Private (participant only)
 */
export const deleteConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await chatService.deleteConversation(
      id,
      req.user!._id.toString()
    );

    res.status(200).json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    next(error);
  }
};
/**
 * @route   PATCH /api/conversations/:id/messages/:msgId/offer
 * @desc    Accept, reject, or counter a price offer in a message
 * @access  Private (the OTHER participant — not the sender)
 */
export const respondToOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: conversationId, msgId } = req.params;
    const { status, counterAmount } = req.body as {
      status: 'accepted' | 'rejected' | 'countered';
      counterAmount?: number;
    };

    if (!['accepted', 'rejected', 'countered'].includes(status)) {
      res.status(400).json({ success: false, message: 'status must be accepted | rejected | countered' });
      return;
    }
    if (status === 'countered' && (!counterAmount || counterAmount <= 0)) {
      res.status(400).json({ success: false, message: 'counterAmount is required when countering' });
      return;
    }

    const Message = (await import('../models/Message')).default;
    const Conversation = (await import('../models/Conversation')).default;

    const conv = await Conversation.findById(conversationId);
    if (!conv) { res.status(404).json({ success: false, message: 'Conversation not found' }); return; }

    const userId = req.user!._id.toString();
    const isParticipant = conv.participants.some((p) => p.toString() === userId);
    if (!isParticipant) { res.status(403).json({ success: false, message: 'Forbidden' }); return; }

    const msg = await Message.findById(msgId);
    if (!msg || msg.conversation.toString() !== conversationId) {
      res.status(404).json({ success: false, message: 'Message not found' }); return;
    }
    if (!msg.offer) {
      res.status(400).json({ success: false, message: 'This message does not contain an offer' }); return;
    }
    // Only the RECIPIENT (not sender) may respond
    if (msg.sender.toString() === userId) {
      res.status(403).json({ success: false, message: 'You cannot respond to your own offer' }); return;
    }
    if (msg.offer.status !== 'pending') {
      res.status(400).json({ success: false, message: `Offer already ${msg.offer.status}` }); return;
    }

    msg.offer.status = status;
    await msg.save();

    // If countered — create a new offer message from the responder
    let counterMessage = null;
    if (status === 'countered' && counterAmount) {
      counterMessage = await chatService.sendMessage(
        conversationId,
        `Counter-offer: GHS ${Number(counterAmount).toFixed(2)}`,
        req.user!._id.toString(),
        'text',
        { offer: { amount: counterAmount, status: 'pending' } }
      );
    }

    res.status(200).json({
      success: true,
      message: `Offer ${status}`,
      data: { message: msg, counterMessage },
    });
  } catch (error) {
    next(error);
  }
};
