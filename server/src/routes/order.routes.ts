import { Router } from 'express';
import {
  createOrder,
  getOrderById,
  getMyPurchases,
  getMySales,
  updateOrderStatus,
  cancelOrder,
  getSellerStats,
  getAbandonedCheckouts,
  createCoupon,
  getSellerCoupons,
  createBundle,
  getSellerBundles,
  runAutomationSweep,
  verifyHandoff,
  validateCoupon,
  getPublicSellerCoupons,
} from '../controllers/order.controller';
import { authenticate, ensureProfileComplete } from '../middleware/auth';
import { isSeller, isAdmin } from '../middleware/roleCheck';

const router = Router();

// Public growth toolkit access
router.get('/public/seller/:sellerId/coupons', getPublicSellerCoupons);

// All order routes require authentication
router.use(authenticate);

// GET /api/orders/my/purchases — buyer's order history
router.get('/my/purchases', getMyPurchases);

// GET /api/orders/my/sales — seller's incoming orders
router.get('/my/sales', getMySales);

// GET /api/orders/seller/stats — seller order stats
router.get('/seller/stats', isSeller, getSellerStats);

// GET /api/orders/automation/abandoned — abandoned checkouts feed (admin)
router.get('/automation/abandoned', isAdmin, getAbandonedCheckouts);
router.post('/automation/run-sweep', isAdmin, runAutomationSweep);

// Seller growth toolkit: coupons
router.post('/seller/coupons', isSeller, createCoupon);
router.get('/seller/coupons', isSeller, getSellerCoupons);
router.get('/validate-coupon', ensureProfileComplete(), validateCoupon);

// Seller growth toolkit: bundles
router.post('/seller/bundles', isSeller, createBundle);
router.get('/seller/bundles', isSeller, getSellerBundles);


// POST /api/orders — create a new order
router.post('/', ensureProfileComplete(), createOrder);

// GET /api/orders/:id — get order by ID
router.get('/:id', getOrderById);

// PATCH /api/orders/:id/status — update order status (seller)
router.patch('/:id/status', updateOrderStatus);

// POST /api/orders/:id/cancel — cancel an order
router.post('/:id/cancel', cancelOrder);

// POST /api/orders/:id/verify-handoff — verify pickup handoff
router.post('/:id/verify-handoff', verifyHandoff);

// PATCH /api/orders/:id/eta — seller sets estimated ready time
router.patch('/:id/eta', async (req, res, next) => {
  try {
    const Order = (await import('../models/Order')).default;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.estimatedReadyAt = req.body.estimatedReadyAt ? new Date(req.body.estimatedReadyAt) : undefined;
    await order.save();
    // Emit real-time
    try {
      const { app } = require('../app');
      const io = app.get('io');
      if (io) io.to(`order:${order._id}`).emit('order:etaUpdated', { orderId: order._id.toString(), estimatedReadyAt: order.estimatedReadyAt });
    } catch {}
    res.status(200).json({ success: true, data: { order } });
  } catch (error) { next(error); }
});

// GET /api/orders/:id/receipt — HTML receipt for print/PDF
router.get('/:id/receipt', async (req, res, next) => {
  try {
    const Order = (await import('../models/Order')).default;
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email phone')
      .populate('seller', 'name')
      .populate('items.product', 'title price');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const buyer = order.buyer as any;
    const seller = order.seller as any;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt #${order.orderNumber}</title>
<style>body{font-family:sans-serif;max-width:600px;margin:40px auto;padding:20px;color:#111}
h1{font-size:22px;text-transform:uppercase;letter-spacing:1px;border-bottom:3px solid #111;padding-bottom:12px}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}
.label{font-size:11px;text-transform:uppercase;letter-spacing:1px;opacity:.5;font-weight:900}
.value{font-size:13px;font-weight:700}
.total{font-size:20px;font-weight:900;margin-top:16px;padding-top:16px;border-top:3px solid #111}
.items{margin:20px 0}
.item{display:flex;justify-content:space-between;padding:6px 0}
.footer{margin-top:32px;font-size:10px;opacity:.5;text-align:center;border-top:1px solid #eee;padding-top:16px}
</style></head><body>
<h1>QUADS Receipt</h1>
<div class="row"><span class="label">Order</span><span class="value">#${order.orderNumber?.toUpperCase()}</span></div>
<div class="row"><span class="label">Date</span><span class="value">${new Date(order.createdAt).toLocaleDateString('en-GB', { day:'numeric',month:'short',year:'numeric' })}</span></div>
<div class="row"><span class="label">Buyer</span><span class="value">${buyer?.name || 'N/A'}</span></div>
<div class="row"><span class="label">Seller</span><span class="value">${seller?.name || 'N/A'}</span></div>
<div class="row"><span class="label">Status</span><span class="value">${order.status.toUpperCase()}</span></div>
<div class="items"><p class="label">Items</p>
${order.items.map((i: any) => `<div class="item"><span>${i.title} x${i.quantity}</span><span>GHS ${(i.price * i.quantity).toFixed(2)}</span></div>`).join('')}
</div>
<div class="total">Total: GHS ${order.totalAmount.toFixed(2)}</div>
<div class="footer">QUADS Marketplace — University of Mines & Technology, Tarkwa<br>quadsmarket.tech</div>
</body></html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) { next(error); }
});

export default router;
