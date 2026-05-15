import mongoose from 'mongoose';
import { EventEmitter } from 'events';
import Conversation, { IConversationDocument } from '../models/Conversation';
import Message, { IMessageDocument } from '../models/Message';
import User from '../models/User';
import ApiError from '../utils/ApiError';
import aiService from './ai.service';
import { emailService } from './email.service';

interface PaginatedMessages {
  messages: IMessageDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ChatService extends EventEmitter {
  /**
   * Get or create a conversation between two users, optionally about a product
   */
  async getOrCreateConversation(
    userId: string,
    otherUserId: string,
    productId?: string
  ): Promise<IConversationDocument> {
    if (userId === otherUserId) {
      throw ApiError.badRequest('Cannot start a conversation with yourself');
    }

    // Verify other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      throw ApiError.notFound('User not found');
    }

    // Sort participant IDs for consistent lookup
    const participants = [userId, otherUserId].sort();

    // Build query
    const query: Record<string, any> = {
      participants: { $all: participants, $size: 2 },
    };

    // If a product is specified, find conversation about that specific product
    if (productId) {
      query.product = productId;
    } else {
      // Find general conversation (no product)
      query.product = null;
    }

    let conversation = await Conversation.findOne(query);

    if (!conversation) {
      conversation = await Conversation.create({
        participants,
        product: productId || null,
      });

      // If product, create a system message
      if (productId) {
        const systemMsg = await Message.create({
          conversation: conversation._id,
          sender: userId,
          content: 'Conversation started about a listing',
          type: 'system',
          readBy: [userId],
        });
        conversation.lastMessage = systemMsg._id;
        await conversation.save();
      }
    }

    // Populate and return
    return conversation.populate([
      { path: 'participants', select: 'name avatar isVerified' },
      { path: 'product', select: 'title price images status' },
      {
        path: 'lastMessage',
        select: 'content sender type createdAt',
      },
    ]);
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<any[]> {
    const conversations = await Conversation.find({
      participants: userId,
    })
      .sort({ updatedAt: -1 })
      .populate('participants', 'name avatar isVerified')
      .populate('product', 'title price images status')
      .populate({
        path: 'lastMessage',
        select: 'content sender type createdAt',
      })
      .lean();

    // Add unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: userId },
          readBy: { $ne: userId },
        });
        return { ...conv, unreadCount };
      })
    );

    return conversationsWithUnread;
  }

  /**
   * Get messages for a conversation (paginated, newest last)
   */
  async getMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedMessages> {
    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw ApiError.notFound('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId
    );
    if (!isParticipant) {
      throw ApiError.forbidden('You are not a participant in this conversation');
    }

    const skip = (page - 1) * limit;
    const total = await Message.countDocuments({ conversation: conversationId });

    // Get messages (oldest first for chat display, but skip from end for pagination)
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name avatar')
      .lean();

    // Reverse so messages are oldest-first in the page
    messages.reverse();

    return {
      messages: messages as unknown as IMessageDocument[],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: 'text' | 'image' | 'system' = 'text',
    extra?: {
      offer?: { amount: number; status: 'pending' | 'accepted' | 'rejected' | 'countered' };
      quickReplyLabel?: string;
      attachments?: { url: string; mimeType?: string; name?: string }[];
    }
  ): Promise<IMessageDocument> {
    // Verify conversation and participation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw ApiError.notFound('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === senderId
    );
    if (!isParticipant) {
      throw ApiError.forbidden('You are not a participant in this conversation');
    }

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content: content.trim(),
      type,
      offer: extra?.offer,
      quickReplyLabel: extra?.quickReplyLabel,
      attachments: extra?.attachments || [],
      readBy: [senderId], // Sender has read their own message
    });

    // Update conversation's lastMessage and bump updatedAt
    conversation.lastMessage = message._id;
    await conversation.save();

    // Populate and return
    const populatedMessage = await message.populate('sender', 'name avatar');

    // Emit event for real-time handlers
    this.emit('message', populatedMessage);

    // Trigger AI response if the recipient is the AI Support user
    this.handleAiResponse(conversationId, senderId, content.trim()).catch(err => {
      console.error('Failed to trigger AI response:', err);
    });

    return populatedMessage;
  }

  /**
   * Handle AI response logic
   */
  private async handleAiResponse(conversationId: string, senderId: string, userContent: string) {
    const AI_SUPPORT_EMAIL = 'support@quadsmarket.tech'; // We'll use this as the AI account

    const conversation = await Conversation.findById(conversationId).populate('participants');
    if (!conversation) return;

    const aiUser = await User.findOne({ email: AI_SUPPORT_EMAIL });
    if (!aiUser) return;

    const isAiParticipant = conversation.participants.some((p: any) => p._id.toString() === aiUser._id.toString());
    if (!isAiParticipant) return;

    // Don't respond to self
    if (senderId === aiUser._id.toString()) return;

    // Get chat history for context (last 10 messages)
    const historyRes = await this.getMessages(conversationId, aiUser._id.toString(), 1, 10);
    const history = historyRes.messages.map(m => ({
      role: (m.sender as any)._id.toString() === aiUser._id.toString() ? 'assistant' : 'user' as 'assistant' | 'user',
      content: m.content
    }));

    // Generate AI response
    const aiResponse = await aiService.generateResponse(userContent, history, {
      product: conversation.product,
      participants: conversation.participants
    });

    // Send AI response
    await this.sendMessage(conversationId, aiUser._id.toString(), aiResponse, 'text');

    // Handle Escalation
    if (aiResponse.includes('ESCALATING TO HUMAN SUPPORT')) {
      this.notifyAdminsOfEscalation(conversationId, userContent, aiResponse).catch(err => {
        console.error('Failed to notify admins of escalation:', err);
      });
    }
  }

  /**
   * Notify admins when AI escalates a conversation
   */
  private async notifyAdminsOfEscalation(conversationId: string, lastUserMsg: string, aiResp: string) {
    const ADMIN_EMAIL = process.env.SMTP_FROM || 'admin@quadsmarket.tech';
    
    await emailService.sendEmail({
      to: ADMIN_EMAIL,
      subject: `🚨 Chat Escalation - Conversation ${conversationId}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 4px solid #000; background: #fff5f5;">
          <h2 style="text-transform: uppercase; font-weight: 900;">AI Support Escalation</h2>
          <p>A conversation has been escalated to human support.</p>
          <hr style="border: 2px solid #000;" />
          <p><strong>Conversation ID:</strong> <code style="background: #eee; padding: 2px 4px;">${conversationId}</code></p>
          <p><strong>Last User Message:</strong><br /><em>${lastUserMsg}</em></p>
          <p><strong>AI Response:</strong><br /><em>${aiResp}</em></p>
          <div style="margin-top: 20px;">
            <a href="${process.env.CLIENT_URL}/messages/${conversationId}" 
               style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; font-weight: bold; text-transform: uppercase;">
               Open Conversation
            </a>
          </div>
        </div>
      `
    });
  }

  /**
   * Mark all messages in a conversation as read by a user
   */
  async markAsRead(
    conversationId: string,
    userId: string
  ): Promise<number> {
    // Verify participation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw ApiError.notFound('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId
    );
    if (!isParticipant) {
      throw ApiError.forbidden('You are not a participant in this conversation');
    }

    // Mark all unread messages as read
    const result = await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      },
      { $addToSet: { readBy: userId } }
    );

    return result.modifiedCount;
  }

  /**
   * Get total unread message count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    // Get all conversation IDs for this user
    const conversations = await Conversation.find({
      participants: userId,
    }).select('_id');

    const conversationIds = conversations.map((c) => c._id);

    // Count unread messages across all conversations
    return Message.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: userId },
      readBy: { $ne: userId },
    });
  }

  /**
   * Delete a conversation (soft: just remove user from participants perspective)
   * For now we'll keep it simple — actually delete if both parties want to
   */
  async deleteConversation(
    conversationId: string,
    userId: string
  ): Promise<void> {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw ApiError.notFound('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId
    );
    if (!isParticipant) {
      throw ApiError.forbidden('You are not a participant in this conversation');
    }

    // Delete all messages
    await Message.deleteMany({ conversation: conversationId });

    // Delete conversation
    await Conversation.findByIdAndDelete(conversationId);
  }
}

export default new ChatService();
