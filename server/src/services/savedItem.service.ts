import mongoose from 'mongoose';
import User from '../models/User';
import Product from '../models/Product';
import ApiError from '../utils/ApiError';

class SavedItemService {
  /**
   * Toggle save/unsave a product
   */
  async toggleSavedItem(
    userId: string,
    productId: string
  ): Promise<{ saved: boolean; savedItems: { productId: string; savedAt: Date; priceWhenSaved: number }[] }> {
    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const objectId = new mongoose.Types.ObjectId(productId);
    const index = user.savedItems.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (index > -1) {
      // Already saved — remove
      user.savedItems.splice(index, 1);
      await user.save();
      return { 
        saved: false, 
        savedItems: user.savedItems.map(item => ({
          productId: item.productId.toString(),
          savedAt: item.savedAt,
          priceWhenSaved: item.priceWhenSaved
        })) 
      };
    } else {
      // Not saved — add
      user.savedItems.push({
        productId: objectId,
        savedAt: new Date(),
        priceWhenSaved: product.price
      });
      await user.save();
      return { 
        saved: true, 
        savedItems: user.savedItems.map(item => ({
          productId: item.productId.toString(),
          savedAt: item.savedAt,
          priceWhenSaved: item.priceWhenSaved
        })) 
      };
    }
  }

  /**
   * Get user's saved items (paginated, populated)
   */
  async getSavedItems(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ products: any[]; pagination: any }> {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const total = user.savedItems.length;
    const skip = (page - 1) * limit;

    // Get paginated slice of saved items (newest first — last added first)
    const paginatedSavedItems = [...user.savedItems].reverse().slice(skip, skip + limit);
    const paginatedIds = paginatedSavedItems.map(item => item.productId);

    const products = await Product.find({ _id: { $in: paginatedIds } })
      .populate('category', 'name slug')
      .populate('seller', 'name avatar isVerified location');

    // Maintain the reverse order and attach saved metadata
    const idOrder = paginatedIds.map((id) => id.toString());
    products.sort(
      (a, b) => idOrder.indexOf(a._id.toString()) - idOrder.indexOf(b._id.toString())
    );

    // Attach saved metadata to each product
    const productsWithMetadata = products.map(product => {
      const savedItem = user.savedItems.find(item => 
        item.productId.toString() === product._id.toString()
      );
      return {
        ...product.toObject(),
        savedAt: savedItem?.savedAt,
        priceWhenSaved: savedItem?.priceWhenSaved
      };
    });

    return {
      products: productsWithMetadata,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Check if a product is saved by the user
   */
  async isSaved(userId: string, productId: string): Promise<boolean> {
    const user = await User.findById(userId).select('savedItems');
    if (!user) return false;
    return user.savedItems.some((item) => item.productId.toString() === productId);
  }

  /**
   * Get saved item IDs for a user (for quick client-side checks)
   */
  async getSavedItemIds(userId: string): Promise<string[]> {
    const user = await User.findById(userId).select('savedItems');
    if (!user) return [];
    return user.savedItems.map((item) => item.productId.toString());
  }

  /**
   * Get saved items with price change information
   */
  async getSavedItemsWithPriceChanges(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ 
    products: any[]; 
    pagination: any; 
    priceChanges: { productId: string; currentPrice: number; priceWhenSaved: number; changePercent: number }[] 
  }> {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const total = user.savedItems.length;
    const skip = (page - 1) * limit;

    // Get paginated slice of saved items (newest first — last added first)
    const paginatedSavedItems = [...user.savedItems].reverse().slice(skip, skip + limit);
    const paginatedIds = paginatedSavedItems.map(item => item.productId);

    const products = await Product.find({ _id: { $in: paginatedIds } })
      .populate('category', 'name slug')
      .populate('seller', 'name avatar isVerified location');

    // Maintain the reverse order
    const idOrder = paginatedIds.map((id) => id.toString());
    products.sort(
      (a, b) => idOrder.indexOf(a._id.toString()) - idOrder.indexOf(b._id.toString())
    );

    // Calculate price changes
    const priceChanges: {
      productId: string;
      currentPrice: number;
      priceWhenSaved: number;
      changePercent: number;
    }[] = [];
    const productsWithMetadata = products.map(product => {
      const savedItem = user.savedItems.find(item => 
        item.productId.toString() === product._id.toString()
      );
      
      let changePercent = 0;
      if (savedItem && savedItem.priceWhenSaved > 0) {
        changePercent = ((product.price - savedItem.priceWhenSaved) / savedItem.priceWhenSaved) * 100;
        
        // Track significant price changes (>5%)
        if (Math.abs(changePercent) > 5) {
          priceChanges.push({
            productId: product._id.toString(),
            currentPrice: product.price,
            priceWhenSaved: savedItem.priceWhenSaved,
            changePercent: parseFloat(changePercent.toFixed(2))
          });
        }
      }
      
      return {
        ...product.toObject(),
        savedAt: savedItem?.savedAt,
        priceWhenSaved: savedItem?.priceWhenSaved
      };
    });

    return {
      products: productsWithMetadata,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      priceChanges
    };
  }
}

export default new SavedItemService();
