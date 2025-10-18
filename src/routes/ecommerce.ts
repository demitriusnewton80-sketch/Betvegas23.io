
import express, { Request, Response } from 'express';
import { ecommerceService } from '../services/ECommerceService.js';
import { ssoService } from '../services/SSOService.js';

const router = express.Router();

// Middleware to verify SSO authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');

  if (!sessionId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = ssoService.validateSession(sessionId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  (req as any).user = user;
  next();
};

// Get all products
router.get('/products', (req: Request, res: Response) => {
  const { category } = req.query;
  
  const products = category 
    ? ecommerceService.getProductsByCategory(category as any)
    : ecommerceService.getAllProducts();
  
  res.json({
    products,
    count: products.length,
    categories: ['sports-bot', 'infrastructure', 'api-access', 'data-feed', 'hardware', 'software']
  });
});

// Get single product
router.get('/products/:productId', (req: Request, res: Response) => {
  const product = ecommerceService.getProduct(req.params.productId);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  res.json(product);
});

// Add to cart (requires SSO authentication)
router.post('/cart/add', requireAuth, (req: Request, res: Response) => {
  const { productId, quantity = 1 } = req.body;
  const userId = (req as any).user.id;
  
  const result = ecommerceService.addToCart(userId, productId, quantity);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  res.json({
    message: 'Product added to cart',
    cart: result.cart
  });
});

// Get cart
router.get('/cart', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const cart = ecommerceService.getCart(userId);
  
  if (!cart) {
    return res.json({ items: [], updatedAt: new Date().toISOString() });
  }
  
  // Enrich cart with product details
  const enrichedItems = cart.items.map(item => {
    const product = ecommerceService.getProduct(item.productId);
    return {
      ...item,
      product
    };
  });
  
  res.json({
    userId: cart.userId,
    items: enrichedItems,
    updatedAt: cart.updatedAt
  });
});

// Remove from cart
router.delete('/cart/:productId', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { productId } = req.params;
  
  const result = ecommerceService.removeFromCart(userId, productId);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  res.json({ message: 'Product removed from cart' });
});

// Create order
router.post('/orders', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { shippingAddress } = req.body;
  
  const result = ecommerceService.createOrder(userId, shippingAddress);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  res.json({
    message: 'Order created successfully',
    order: result.order
  });
});

// Get user orders
router.get('/orders', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const orders = ecommerceService.getUserOrders(userId);
  
  res.json({
    orders,
    count: orders.length
  });
});

// Get single order
router.get('/orders/:orderId', requireAuth, (req: Request, res: Response) => {
  const order = ecommerceService.getOrder(req.params.orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  const userId = (req as any).user.id;
  if (order.userId !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.json(order);
});

// Connect AWS account
router.post('/aws/connect', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { accountId, region, resources } = req.body;
  
  if (!accountId || !region) {
    return res.status(400).json({ error: 'accountId and region are required' });
  }
  
  const result = ecommerceService.connectAWS(userId, accountId, region, resources || []);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  res.json({
    message: 'AWS account connected successfully',
    accountId,
    region
  });
});

// Get AWS connection status
router.get('/aws/status', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const connection = ecommerceService.getAWSConnection(userId);
  
  if (!connection) {
    return res.json({ connected: false });
  }
  
  res.json({
    connected: true,
    ...connection
  });
});

// Provision AWS resources for order
router.post('/orders/:orderId/provision', requireAuth, (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = ecommerceService.getOrder(orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  const userId = (req as any).user.id;
  if (order.userId !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const result = ecommerceService.provisionAWSResource(orderId);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  res.json({
    message: 'AWS resources provisioned',
    resources: result.resources
  });
});

export default router;
