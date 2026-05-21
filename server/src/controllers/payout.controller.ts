import { Request, Response, NextFunction } from 'express';
import payoutService from '../services/payout.service';
import Payout from '../models/Payout';
import RetryJob from '../models/RetryJob';

export const getPayouts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await payoutService.getPayouts({
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      status: req.query.status as string,
      sellerId: req.query.sellerId as string,
    });

    res.status(200).json({
      success: true,
      data: { payouts: result.payouts },
      pagination: {
        total: result.total,
        page: result.page,
        pages: result.pages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPayoutStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await payoutService.getPayoutStats();
    res.status(200).json({ success: true, data: { stats } });
  } catch (error) {
    next(error);
  }
};

export const processPayout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payout = await payoutService.processPayout(
      req.params.id,
      req.user!._id.toString()
    );
    res.status(200).json({
      success: true,
      message: 'Payout processed successfully',
      data: { payout },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayoutStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payout = await payoutService.verifyPayoutStatus(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Payout status verified',
      data: { payout },
    });
  } catch (error) {
    next(error);
  }
};

export const getSellerPayouts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await payoutService.getSellerPayouts(
      req.user!._id.toString(),
      {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      }
    );
    res.status(200).json({
      success: true,
      data: { payouts: result.payouts },
      pagination: {
        total: result.total,
        page: result.page,
        pages: result.pages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const retryPayout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payoutId = req.params.id;
    const userId = req.user!._id.toString();

    const payout = await Payout.findById(payoutId);
    if (!payout) {
      res.status(404).json({ success: false, message: 'Payout not found.' });
      return;
    }

    // Allow both seller (owner) and admins to retry
    const isSeller = payout.seller.toString() === userId;
    const isAdmin = req.user!.roles.includes('admin');
    if (!isSeller && !isAdmin) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    if (payout.status !== 'failed') {
      res.status(400).json({ success: false, message: 'Only failed payouts can be retried.' });
      return;
    }

    // Set payout status back to pending to allow processing
    payout.status = 'pending';
    payout.failureReason = undefined;
    await payout.save();

    // Create RetryJob record
    const job = await RetryJob.create({
      type: 'payment',
      payload: { payoutId, triggeredBy: userId },
      status: 'processing',
      attempts: 1,
      maxAttempts: 3,
      runAt: new Date(),
    });

    try {
      // Process payout using the original processor (or adminUserId / current user ID)
      const processedBy = payout.processedBy ? payout.processedBy.toString() : userId;
      const updatedPayout = await payoutService.processPayout(payoutId, processedBy);

      job.status = 'completed';
      await job.save();

      res.status(200).json({
        success: true,
        message: 'Payout retried and completed successfully',
        data: { payout: updatedPayout },
      });
    } catch (err: any) {
      job.status = 'failed';
      job.lastError = err.message || String(err);
      await job.save();

      res.status(500).json({
        success: false,
        message: `Payout retry failed: ${err.message}`,
        data: { payout },
      });
    }
  } catch (error) {
    next(error);
  }
};