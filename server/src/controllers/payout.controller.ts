import { Request, Response, NextFunction } from 'express';
import payoutService from '../services/payout.service';

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