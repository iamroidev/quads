import { Request, Response, NextFunction } from 'express';
import autoPayoutService from '../services/autoPayout.service';

export const runAutoPayouts = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await autoPayoutService.processAllPendingPayouts();
    res.status(200).json({
      success: true,
      message: `Processed ${result.processed} payouts`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyAutoPayouts = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await autoPayoutService.verifyProcessingPayouts();
    res.status(200).json({
      success: true,
      message: `Verified ${result.verified} payouts`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};