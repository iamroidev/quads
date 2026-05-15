import mongoose from 'mongoose';
import Order, { IOrderDocument } from '../models/Order';
import Product from '../models/Product';
import Coupon from '../models/Coupon';
import Bundle from '../models/Bundle';
import ApiError from '../utils/ApiError';
import notificationService from './notification.service';

interface OrderItemInput {
  productId: string;
  quantity: number;
}

interface CreateOrderInput {
  items: OrderItemInput[];
  deliveryMethod: 'pickup' | 'delivery';
  couponCode?: string;
  pickupLocation?: string;
  deliveryAddress?: string;
  note?: string;
}

interface PaginatedOrders {
  orders: IOrderDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class OrderService {
  /**
   * Create new orders from cart items (splits by seller)
   */
  async createOrders(buyerId: string, input: CreateOrderInput): Promise<IOrderDocument[]> {
    const { items, deliveryMethod, couponCode, pickupLocation, deliveryAddress, note } = input;

    if (!items || items.length === 0) {
      throw ApiError.badRequest('Cart is empty');
    }

    // 1. Fetch all products and group by seller
    const productIds = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).populate('seller', '_id name');
    
    const sellerGroups: Record<string, { product: any, quantity: number }[]> = {};
    
    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.productId);
      if (!product) throw ApiError.notFound(`Product ${item.productId} not found`);
      if (product.status !== 'active') throw ApiError.badRequest(`Product ${product.title} is no longer available`);
      
      const sId = product.seller._id.toString();
      if (sId === buyerId) throw ApiError.badRequest('You cannot buy your own products');
      
      if (!sellerGroups[sId]) sellerGroups[sId] = [];
      sellerGroups[sId].push({ product, quantity: item.quantity });
    }

    const createdOrders: IOrderDocument[] = [];

    // 2. Create an order for each seller group
    for (const [sellerId, groupItems] of Object.entries(sellerGroups)) {
      let orderSubtotal = 0;
      const orderItems = [];

      for (const groupItem of groupItems) {
        const { product, quantity } = groupItem;
        const effectivePrice = product.flashSalePrice && product.flashSaleEndsAt && new Date(product.flashSaleEndsAt) > new Date()
          ? product.flashSalePrice
          : product.price;
        
        orderSubtotal += effectivePrice * quantity;
        orderItems.push({
          product: product._id,
          title: product.title,
          price: effectivePrice,
          image: product.images?.[0]?.url,
          quantity
        });

        // Reserve stock
        product.status = 'reserved';
        if (product.stock > 0) {
          product.stock = Math.max(0, product.stock - quantity);
        }
        await product.save();
      }

      const deliveryFee = deliveryMethod === 'delivery' ? 5.00 : 0;
      const totalAmount = orderSubtotal + deliveryFee;

      const order = await Order.create({
        buyer: buyerId,
        seller: sellerId,
        items: orderItems,
        totalAmount,
        deliveryMethod,
        pickupLocation: deliveryMethod === 'pickup' ? pickupLocation : undefined,
        deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : undefined,
        deliveryFee,
        note,
        status: 'pending',
      });

      createdOrders.push(await order.populate([
        { path: 'buyer', select: 'name avatar phone email' },
        { path: 'seller', select: 'name avatar phone isVerified' },
        { path: 'items.product', select: 'title price images status seller' },
      ]));
    }

    return createdOrders;
  }

  // Keep old createOrder for backward compatibility or direct single buys
  async createOrder(buyerId: string, input: any): Promise<IOrderDocument> {
    const orders = await this.createOrders(buyerId, {
      items: [{ productId: input.productId, quantity: input.quantity || 1 }],
      ...input
    });
    return orders[0];
  }

  /**
   * Get a single order by ID (verifies access)
   */
  async getOrderById(orderId: string, userId: string, isAdmin: boolean = false): Promise<IOrderDocument> {
    const order = await Order.findById(orderId)
      .populate('buyer', 'name avatar phone email')
      .populate('seller', 'name storeName brandName avatar phone isVerified')
      .populate('items.product', 'title price images status seller')
      .populate('payment');

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // Verify access
    if (
      !isAdmin &&
      order.buyer._id?.toString() !== userId &&
      order.seller._id?.toString() !== userId
    ) {
      throw ApiError.forbidden('You do not have access to this order');
    }

    return order;
  }

  /**
   * Get orders for a buyer (paginated)
   */
  async getBuyerOrders(
    buyerId: string,
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedOrders> {
    const query: Record<string, any> = { buyer: buyerId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('buyer', 'name avatar phone email')
      .populate('seller', 'name storeName brandName avatar phone isVerified')
      .populate('items.product', 'title price images status seller')
      .populate('payment');

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get orders for a seller (paginated)
   */
  async getSellerOrders(
    sellerId: string,
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedOrders> {
    const query: Record<string, any> = { seller: sellerId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('buyer', 'name avatar phone email')
      .populate('seller', 'name storeName brandName avatar phone isVerified')
      .populate('items.product', 'title price images status seller')
      .populate('payment');

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update order status (seller actions: confirm, ready, complete)
   */
  async updateOrderStatus(
    orderId: string,
    userId: string,
    newStatus: string,
    isAdmin: boolean = false
  ): Promise<IOrderDocument> {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    // Only seller or admin can update status
    if (!isAdmin && order.seller.toString() !== userId) {
      throw ApiError.forbidden('Only the seller can update order status');
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      paid: ['confirmed', 'cancelled'],
      confirmed: ['ready', 'cancelled'],
      ready: ['completed'],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(newStatus)) {
      throw ApiError.badRequest(
        `Cannot transition from "${order.status}" to "${newStatus}"`
      );
    }

    order.status = newStatus;

    if (newStatus === 'completed') {
      order.completedAt = new Date();
      // Mark product as sold
      await Product.findByIdAndUpdate(order.items[0].product, { status: 'sold' });
    }

    if (newStatus === 'cancelled') {
      order.cancelledBy = new mongoose.Types.ObjectId(userId);
      // Restore product to active
      await Product.findByIdAndUpdate(order.items[0].product, { status: 'active' });
    }

    await order.save();

    return order.populate([
      { path: 'buyer', select: 'name avatar phone email' },
      { path: 'seller', select: 'name avatar phone isVerified' },
      { path: 'items.product', select: 'title price images status seller' },
      { path: 'payment' },
    ]);
  }

  /**
   * Cancel an order (buyer can cancel if still pending/paid)
   */
  async cancelOrder(
    orderId: string,
    userId: string,
    reason?: string
  ): Promise<IOrderDocument> {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    const isBuyer = order.buyer.toString() === userId;
    const isSeller = order.seller.toString() === userId;

    if (!isBuyer && !isSeller) {
      throw ApiError.forbidden('You do not have access to this order');
    }

    // Buyer can cancel pending or paid orders
    // Seller can cancel paid or confirmed orders
    const buyerCancellable = ['pending', 'paid'];
    const sellerCancellable = ['paid', 'confirmed'];

    if (isBuyer && !buyerCancellable.includes(order.status)) {
      throw ApiError.badRequest('This order can no longer be cancelled');
    }
    if (isSeller && !sellerCancellable.includes(order.status)) {
      throw ApiError.badRequest('This order can no longer be cancelled');
    }

    order.status = 'cancelled';
    order.cancelReason = reason || 'No reason provided';
    order.cancelledBy = new mongoose.Types.ObjectId(userId);

    // Restore product to active
    await Product.findByIdAndUpdate(order.items[0].product, { status: 'active' });

    await order.save();

    return order.populate([
      { path: 'buyer', select: 'name avatar phone email' },
      { path: 'seller', select: 'name avatar phone isVerified' },
      { path: 'items.product', select: 'title price images status seller' },
      { path: 'payment' },
    ]);
  }

  /**
   * Get order stats for a seller
   */
  async getSellerStats(sellerId: string): Promise<Record<string, number>> {
    const stats = await Order.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
    ]);

    const result: Record<string, number> = {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      completedOrders: 0,
    };

    stats.forEach((s) => {
      result.totalOrders += s.count;
      if (s._id === 'completed') {
        result.completedOrders = s.count;
        result.totalRevenue = s.total;
      }
      if (['pending', 'paid', 'confirmed', 'ready'].includes(s._id)) {
        result.pendingOrders += s.count;
      }
    });

    return result;
  }

  async getAbandonedCheckouts(limit: number = 20): Promise<IOrderDocument[]> {
    const threshold = new Date(Date.now() - 60 * 60 * 1000);
    return Order.find({
      status: 'pending',
      createdAt: { $lte: threshold },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .populate('buyer', 'name email')
      .populate('seller', 'name')
      .populate('items.product', 'title');
  }

  async runAutomationSweep(): Promise<{
    abandonedCheckoutCount: number;
    inventoryLowAlertCount: number;
  }> {
    const abandoned = await this.getAbandonedCheckouts(50);

    for (const order of abandoned) {
      const buyer = order.buyer as any;
      if (buyer?._id) {
        await notificationService.create(
          buyer._id.toString(),
          'system',
          'Checkout Reminder',
          `You still have a pending checkout (#${order.orderNumber}). Complete payment before it expires.`,
          `/orders/${order._id}`,
          { orderId: order._id.toString(), automation: 'abandoned_checkout' }
        );
      }
    }

    const lowStockProducts = await Product.find({
      status: { $in: ['active', 'reserved'] },
      stock: { $lte: 2 },
    }).select('title stock seller');

    for (const item of lowStockProducts) {
      await notificationService.create(
        item.seller.toString(),
        'system',
        'Inventory Low',
        `${item.title} is running low (${item.stock} left). Restock or update listing status.`,
        '/my-listings',
        { productId: item._id.toString(), stock: item.stock, automation: 'inventory_low' }
      );
    }

    return {
      abandonedCheckoutCount: abandoned.length,
      inventoryLowAlertCount: lowStockProducts.length,
    };
  }

  async createCoupon(
    sellerId: string,
    input: {
      code: string;
      type: 'percentage' | 'fixed';
      value: number;
      minOrderAmount?: number;
      usageLimit?: number;
      startsAt?: string;
      expiresAt?: string;
    }
  ) {
    return Coupon.create({
      seller: sellerId,
      code: input.code.toUpperCase(),
      type: input.type,
      value: input.value,
      minOrderAmount: input.minOrderAmount || 0,
      usageLimit: input.usageLimit || 100,
      startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      isActive: true,
    });
  }

  async getSellerCoupons(sellerId: string) {
    return Coupon.find({ seller: sellerId }).sort({ createdAt: -1 });
  }

  async createBundle(
    sellerId: string,
    input: {
      name: string;
      productIds: string[];
      discountPercent: number;
    }
  ) {
    const products = await Product.find({ _id: { $in: input.productIds }, seller: sellerId }).select('_id');
    if (products.length < 2) {
      throw ApiError.badRequest('Bundle requires at least 2 of your own products');
    }
    return Bundle.create({
      seller: sellerId,
      name: input.name,
      productIds: products.map((p) => p._id),
      discountPercent: input.discountPercent,
      isActive: true,
    });
  }

  async getSellerBundles(sellerId: string) {
    return Bundle.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .populate('productIds', 'title price images status');
  }
}

export default new OrderService();
