import { Request, Response, NextFunction } from 'express';
import offerService from '../services/offer.service';
import ApiError from '../utils/ApiError';

export const createOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, amount } = req.body;
    if (!productId || !amount) {
      throw ApiError.badRequest('productId and amount are required');
    }

    const offer = await offerService.createOffer(
      req.user!._id.toString(),
      productId,
      amount
    );

    res.status(201).json({
      success: true,
      message: 'Offer sent successfully',
      data: { offer }
    });
  } catch (error) {
    next(error);
  }
};

export const respondToOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { offerId } = req.params;
    const { action } = req.body; // 'accept' or 'decline'

    if (!offerId || !action) {
      throw ApiError.badRequest('offerId and action are required');
    }

    const offer = await offerService.respondToOffer(
      req.user!._id.toString(),
      offerId,
      action
    );

    res.status(200).json({
      success: true,
      message: `Offer ${action}ed successfully`,
      data: { offer }
    });
  } catch (error) {
    next(error);
  }
};
