import Offer, { IOfferDocument } from '../models/Offer';
import Product from '../models/Product';
import notificationService from './notification.service';
import ApiError from '../utils/ApiError';

class OfferService {
  /**
   * Create a new offer
   */
  async createOffer(
    buyerId: string,
    productId: string,
    amount: number
  ): Promise<IOfferDocument> {
    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');
    
    if (product.seller.toString() === buyerId) {
      throw ApiError.badRequest('You cannot make an offer on your own product');
    }

    if (amount >= product.price) {
      throw ApiError.badRequest('Offer must be lower than the current price. Use "Buy Now" instead.');
    }

    // Check for existing pending offer
    const existing = await Offer.findOne({ 
      product: productId, 
      buyer: buyerId, 
      status: 'pending' 
    });
    if (existing) {
      existing.amount = amount;
      await existing.save();
      return existing;
    }

    const offer = await Offer.create({
      product: productId,
      buyer: buyerId,
      seller: product.seller,
      amount,
      status: 'pending'
    });

    // Notify seller
    await notificationService.create(
      product.seller.toString(),
      'new_offer',
      'New Offer Received',
      `Someone offered GHS ${amount} for ${product.title}.`,
      `/dashboard/offers/${offer._id}`,
      { offerId: offer._id.toString(), productId }
    );

    return offer;
  }

  /**
   * Respond to an offer (accept/decline)
   */
  async respondToOffer(
    sellerId: string,
    offerId: string,
    action: 'accept' | 'decline'
  ): Promise<IOfferDocument> {
    const offer = await Offer.findById(offerId).populate('product');
    if (!offer) throw ApiError.notFound('Offer not found');

    if (offer.seller.toString() !== sellerId) {
      throw ApiError.forbidden('You do not have access to this offer');
    }

    if (offer.status !== 'pending') {
      throw ApiError.badRequest('Offer is no longer pending');
    }

    offer.status = action === 'accept' ? 'accepted' : 'declined';
    await offer.save();

    // Notify buyer
    const productTitle = (offer.product as any).title;
    await notificationService.create(
      offer.buyer.toString(),
      action === 'accept' ? 'offer_accepted' : 'offer_declined',
      action === 'accept' ? 'Offer Accepted! 🎉' : 'Offer Declined',
      action === 'accept' 
        ? `Your offer of GHS ${offer.amount} for ${productTitle} was accepted! You can now checkout.`
        : `Your offer for ${productTitle} was declined.`,
      action === 'accept' ? `/checkout/${offer.product._id}?offerPrice=${offer.amount}` : `/products/${offer.product._id}`,
      { offerId: offer._id.toString(), action }
    );

    return offer;
  }
}

export default new OfferService();
