import Product from '../models/Product';
import Order from '../models/Order';
import Dispute from '../models/Dispute';
import User from '../models/User';
import notificationService from './notification.service';
import { emailService } from './email.service';

// ─── helpers ──────────────────────────────────────────────────────────────────

function log(task: string, msg: string) {
  console.log(`[Scheduler:${task}] ${msg}`);
}

function ago(ms: number): Date {
  return new Date(Date.now() - ms);
}

const MINUTE = 60 * 1000;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;

// ─── tasks ────────────────────────────────────────────────────────────────────

/**
 * Flash sale expiry — every 5 minutes
 * Clears flashSalePrice/flashSaleEndsAt when the window has passed.
 * Notifies users who saved the product so they know the deal is over.
 */
async function expireFlashSales(): Promise<void> {
  const expired = await Product.find({
    flashSaleEndsAt: { $lte: new Date() },
    flashSalePrice:  { $exists: true, $ne: null },
    status: 'active',
  }).select('_id title flashSalePrice price seller');

  if (!expired.length) return;

  for (const product of expired) {
    await Product.updateOne(
      { _id: product._id },
      { $unset: { flashSalePrice: '', flashSaleEndsAt: '' } }
    );

    // Notify everyone who saved this product
    const buyers = await User.find({
      'savedItems.productId': product._id.toString(),
    }).select('_id');

    for (const buyer of buyers) {
      notificationService.create(
        buyer._id.toString(),
        'price_increase',
        'Flash Sale Ended',
        `The flash sale on "${product.title}" has ended. Regular price restored.`,
        `/products/${product._id}`,
        { productId: product._id.toString(), productTitle: product.title }
      ).catch(() => {});
    }
  }

  log('flashSales', `Expired ${expired.length} flash sale(s)`);
}

/**
 * Stale order cancellation — every hour
 * Cancels orders stuck in 'pending' (unpaid) for >24h.
 * Releases reserved products back to active.
 */
async function cancelStaleOrders(): Promise<void> {
  const stale = await Order.find({
    status: 'pending',
    createdAt: { $lte: ago(24 * HOUR) },
  }).populate('buyer', 'name email').populate('seller', 'name email');

  if (!stale.length) return;

  for (const order of stale) {
    order.status     = 'cancelled';
    order.cancelReason = 'Automatically cancelled — payment not received within 24 hours.';
    await order.save();

    // Release each product back to active
    const productIds = order.items.map((i: any) => i.product?.toString?.() || i.product);
    await Product.updateMany(
      { _id: { $in: productIds }, status: 'reserved' },
      { $set: { status: 'active' } }
    );

    const buyerId  = (order.buyer as any)?._id?.toString?.() || order.buyer?.toString();
    const sellerId = (order.seller as any)?._id?.toString?.() || order.seller?.toString();

    if (buyerId) {
      notificationService.create(
        buyerId,
        'order_cancelled',
        'Order Expired',
        `Your order #${order.orderNumber?.slice(-6).toUpperCase()} was cancelled — payment was not completed within 24 hours.`,
        `/orders/${order._id}`,
        { orderId: order._id.toString() }
      ).catch(() => {});
    }
    if (sellerId) {
      notificationService.create(
        sellerId,
        'order_cancelled',
        'Unpaid Order Cancelled',
        `Order #${order.orderNumber?.slice(-6).toUpperCase()} was auto-cancelled after 24h with no payment.`,
        `/orders/${order._id}`,
        { orderId: order._id.toString() }
      ).catch(() => {});
    }
  }

  log('staleOrders', `Cancelled ${stale.length} unpaid order(s)`);
}

/**
 * Dispute auto-escalation — every hour
 * Flags disputes open >72h with no status change to admin queue.
 */
async function escalateStaleDisputes(): Promise<void> {
  const stale = await Dispute.find({
    status: 'open',
    updatedAt: { $lte: ago(72 * HOUR) },
    escalated: { $ne: true },
  }).populate('raisedBy', 'name email').populate('against', 'name email');

  if (!stale.length) return;

  for (const dispute of stale) {
    await Dispute.updateOne({ _id: dispute._id }, {
      $set: { status: 'under_review', escalated: true },
    });

    // Notify the seller (against party) if they haven't responded
    const againstId = (dispute.against as any)?._id?.toString?.() || dispute.against?.toString();
    if (againstId) {
      notificationService.create(
        againstId,
        'system',
        'Dispute Escalated',
        `A dispute on your order has been open for over 72 hours and has been escalated for admin review.`,
        `/disputes/${dispute._id}`,
        { disputeId: dispute._id.toString() }
      ).catch(() => {});
    }
  }

  log('disputes', `Escalated ${stale.length} stale dispute(s)`);
}

/**
 * Reserved product release — every hour
 * Products stuck in 'reserved' for >48h with no active paying order
 * get set back to 'active'.
 */
async function releaseReservedProducts(): Promise<void> {
  const stuckProducts = await Product.find({
    status: 'reserved',
    updatedAt: { $lte: ago(48 * HOUR) },
  }).select('_id title seller');

  if (!stuckProducts.length) return;

  for (const product of stuckProducts) {
    // Only release if there's no live order holding this product
    const liveOrder = await Order.findOne({
      'items.product': product._id,
      status: { $in: ['paid', 'confirmed', 'ready'] },
    });

    if (liveOrder) continue;

    await Product.updateOne({ _id: product._id }, { $set: { status: 'active' } });

    const sellerId = (product.seller as any)?._id?.toString?.() || product.seller?.toString();
    if (sellerId) {
      notificationService.create(
        sellerId,
        'system',
        'Listing Re-activated',
        `"${product.title}" was automatically set back to active after being reserved for 48+ hours with no completed order.`,
        `/products/${product._id}`,
        { productId: product._id.toString() }
      ).catch(() => {});
    }
  }

  log('reservedRelease', `Released ${stuckProducts.length} stuck reserved product(s)`);
}

/**
 * Low stock / sold-out check — every hour
 * Products with stock: 0 get marked 'sold' and seller is notified.
 */
async function markSoldOutProducts(): Promise<void> {
  const soldOut = await Product.find({
    stock: 0,
    status: 'active',
  }).populate('seller', '_id name');

  if (!soldOut.length) return;

  for (const product of soldOut) {
    await Product.updateOne({ _id: product._id }, { $set: { status: 'sold' } });

    const sellerId = (product.seller as any)?._id?.toString?.() || product.seller?.toString();
    if (sellerId) {
      notificationService.create(
        sellerId,
        'product_sold',
        'Listing Sold Out',
        `"${product.title}" is out of stock and has been marked as sold.`,
        `/listings/${product._id}/edit`,
        { productId: product._id.toString(), productTitle: product.title }
      ).catch(() => {});
    }
  }

  log('soldOut', `Marked ${soldOut.length} product(s) as sold`);
}

/**
 * Price drop alerts — every 30 minutes
 * Finds products whose price dropped since last check and notifies savers.
 * Uses a watermark stored on the product (lastAlertedPrice).
 */
async function sendPriceDropAlerts(): Promise<void> {
  // Seed lastAlertedPrice for products that don't have it yet
  await Product.updateMany(
    { status: 'active', lastAlertedPrice: { $exists: false } },
    [{ $set: { lastAlertedPrice: '$price' } }]
  );

  const dropped = await Product.find({
    status: 'active',
    $expr: {
      $and: [
        { $gt: ['$lastAlertedPrice', 0] },
        { $lt: ['$price', '$lastAlertedPrice'] },
      ],
    },
  }).select('_id title price lastAlertedPrice');

  if (!dropped.length) return;

  let totalNotified = 0;

  for (const product of dropped) {
    const savings        = (product as any).lastAlertedPrice - product.price;
    const savingsPct     = Math.round((savings / (product as any).lastAlertedPrice) * 100);
    if (savingsPct < 5) continue; // only alert for >5% drops

    const savers = await User.find({
      'savedItems.productId': product._id.toString(),
      'notificationPrefs.priceAlerts': { $ne: false },
    }).select('_id name email');

    for (const user of savers) {
      notificationService.create(
        user._id.toString(),
        'price_drop',
        'Price Drop Alert',
        `"${product.title}" dropped ${savingsPct}% — now GHS ${product.price.toFixed(2)}.`,
        `/products/${product._id}`,
        { productId: product._id.toString(), productTitle: product.title }
      ).catch(() => {});

      emailService.sendPriceDropAlert(
        user.email,
        user.name,
        product.title,
        product.price,
        (product as any).lastAlertedPrice,
        product._id.toString()
      ).catch(() => {});

      totalNotified++;
    }

    // Update watermark so we don't alert again until price drops further
    await Product.updateOne({ _id: product._id }, { $set: { lastAlertedPrice: product.price } });
  }

  if (totalNotified > 0) log('priceDrops', `Sent ${totalNotified} price drop alert(s)`);
}

/**
 * Inactive listing cleanup — weekly
 * Emails sellers who have listings stuck in 'draft' for >30 days.
 */
async function notifyInactiveDraftListings(): Promise<void> {
  const cutoff = ago(30 * DAY);

  const drafts = await Product.find({
    status: 'draft',
    updatedAt: { $lte: cutoff },
  }).populate('seller', '_id name email');

  if (!drafts.length) return;

  // Group by seller to send one email per seller
  const bySeller = new Map<string, { seller: any; products: any[] }>();
  for (const product of drafts) {
    const s = product.seller as any;
    if (!s?._id) continue;
    const sid = s._id.toString();
    if (!bySeller.has(sid)) bySeller.set(sid, { seller: s, products: [] });
    bySeller.get(sid)!.products.push(product);
  }

  for (const { seller, products } of bySeller.values()) {
    notificationService.create(
      seller._id.toString(),
      'system',
      'Inactive Listings',
      `You have ${products.length} draft listing${products.length > 1 ? 's' : ''} that ${products.length > 1 ? 'have' : 'has'} been inactive for over 30 days. Publish or remove them to keep your store clean.`,
      '/listings',
      {}
    ).catch(() => {});
  }

  log('draftCleanup', `Notified ${bySeller.size} seller(s) about inactive draft listings`);
}

// ─── scheduler ────────────────────────────────────────────────────────────────

type TaskHandle = {
  name: string;
  interval: number;
  fn: () => Promise<void>;
  handle?: NodeJS.Timeout;
};

const tasks: TaskHandle[] = [
  { name: 'flashSales',       interval: 5  * MINUTE, fn: expireFlashSales        },
  { name: 'staleOrders',      interval: 1  * HOUR,   fn: cancelStaleOrders       },
  { name: 'disputes',         interval: 1  * HOUR,   fn: escalateStaleDisputes   },
  { name: 'reservedRelease',  interval: 1  * HOUR,   fn: releaseReservedProducts },
  { name: 'soldOut',          interval: 1  * HOUR,   fn: markSoldOutProducts     },
  { name: 'priceDrops',       interval: 30 * MINUTE, fn: sendPriceDropAlerts     },
  { name: 'draftCleanup',     interval: 7  * DAY,    fn: notifyInactiveDraftListings },
];

let running = false;

export function startTaskScheduler(): void {
  if (running) return;
  running = true;

  log('init', `Starting ${tasks.length} scheduled tasks`);

  for (const task of tasks) {
    // Run immediately on startup, then on interval
    task.fn().catch(err => console.error(`[Scheduler:${task.name}] Error on init run:`, err));
    task.handle = setInterval(() => {
      task.fn().catch(err => console.error(`[Scheduler:${task.name}] Error:`, err));
    }, task.interval);
  }
}

export function stopTaskScheduler(): void {
  for (const task of tasks) {
    if (task.handle) clearInterval(task.handle);
  }
  running = false;
  log('init', 'All scheduled tasks stopped');
}
