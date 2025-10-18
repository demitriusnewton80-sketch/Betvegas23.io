
import { EventEmitter } from 'events';
import crypto from 'crypto';
import { Product, Order, OrderItem, Cart, CartItem } from '../models/Product.js';
import { accountService } from './AccountService.js';

interface AWSConnection {
  accountId: string;
  region: string;
  resources: {
    arn: string;
    type: string;
    status: 'active' | 'inactive';
  }[];
}

class ECommerceService extends EventEmitter {
  private products: Map<string, Product> = new Map();
  private orders: Map<string, Order> = new Map();
  private carts: Map<string, Cart> = new Map();
  private awsConnections: Map<string, AWSConnection> = new Map();

  constructor() {
    super();
    this.initializeSampleProducts();
  }

  private initializeSampleProducts(): void {
    // Sports bot infrastructure
    this.addProduct({
      id: 'prod-bot-001',
      name: 'Premium Sports Betting Bot API',
      description: 'Advanced sports betting automation with ML predictions',
      category: 'sports-bot',
      price: 499.99,
      stock: 50,
      supplier: 'Young Meat LLC',
      specifications: {
        apiCalls: '100000/month',
        sports: 'NFL, NBA, MLB, NHL, Boxing',
        accuracy: '78%'
      },
      awsIntegration: {
        arn: 'arn:aws:lambda:us-east-1:123456789012:function:sports-bot-api',
        resourceType: 'lambda'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.addProduct({
      id: 'prod-data-001',
      name: 'Live Sports Data Feed - Enterprise',
      description: 'Real-time sports data with QuickNode integration',
      category: 'data-feed',
      price: 299.99,
      stock: 100,
      supplier: 'Young Meat LLC',
      specifications: {
        updateFrequency: 'Real-time',
        coverage: 'All major leagues',
        latency: '<100ms'
      },
      awsIntegration: {
        arn: 'arn:aws:kinesis:us-east-1:123456789012:stream/sports-data',
        resourceType: 'kinesis'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.addProduct({
      id: 'prod-infra-001',
      name: 'AWS EC2 Sports Betting Infrastructure',
      description: 'Pre-configured EC2 instances for betting platforms',
      category: 'infrastructure',
      price: 899.99,
      stock: 20,
      supplier: 'Young Meat LLC',
      specifications: {
        instanceType: 't3.xlarge',
        storage: '500GB SSD',
        bandwidth: 'Unlimited'
      },
      awsIntegration: {
        arn: 'arn:aws:ec2:us-east-1:123456789012:instance/i-1234567890abcdef0',
        resourceType: 'ec2'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.addProduct({
      id: 'prod-api-001',
      name: 'Amazon Prime Stream API Access',
      description: 'API access for Amazon Prime sports streaming integration',
      category: 'api-access',
      price: 1499.99,
      stock: 10,
      supplier: 'Young Meat LLC',
      specifications: {
        streams: 'Unlimited',
        quality: 'Up to 4K',
        partnership: 'Official Amazon Partner'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.addProduct({
      id: 'prod-soft-001',
      name: 'Sportsbook Management Software',
      description: 'Complete platform for running a sportsbook',
      category: 'software',
      price: 2999.99,
      stock: 15,
      supplier: 'Young Meat LLC',
      specifications: {
        features: 'User management, odds engine, payment processing',
        support: '24/7 dedicated support',
        customization: 'Full white-label options'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  private addProduct(product: Product): void {
    this.products.set(product.id, product);
  }

  // Product Management
  getAllProducts(): Product[] {
    return Array.from(this.products.values());
  }

  getProductsByCategory(category: Product['category']): Product[] {
    return Array.from(this.products.values()).filter(p => p.category === category);
  }

  getProduct(productId: string): Product | null {
    return this.products.get(productId) || null;
  }

  // Cart Management
  addToCart(userId: string, productId: string, quantity: number): { success: boolean; cart?: Cart; error?: string } {
    const product = this.products.get(productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    if (product.stock < quantity) {
      return { success: false, error: 'Insufficient stock' };
    }

    let cart = this.carts.get(userId);
    if (!cart) {
      cart = {
        userId,
        items: [],
        updatedAt: new Date().toISOString()
      };
    }

    const existingItem = cart.items.find(item => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    cart.updatedAt = new Date().toISOString();
    this.carts.set(userId, cart);

    return { success: true, cart };
  }

  getCart(userId: string): Cart | null {
    return this.carts.get(userId) || null;
  }

  removeFromCart(userId: string, productId: string): { success: boolean; error?: string } {
    const cart = this.carts.get(userId);
    if (!cart) {
      return { success: false, error: 'Cart not found' };
    }

    cart.items = cart.items.filter(item => item.productId !== productId);
    cart.updatedAt = new Date().toISOString();
    this.carts.set(userId, cart);

    return { success: true };
  }

  // Order Management
  createOrder(userId: string, shippingAddress?: Order['shippingAddress']): { success: boolean; order?: Order; error?: string } {
    const cart = this.carts.get(userId);
    if (!cart || cart.items.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    const account = accountService.getAccountByUsername(userId) || accountService.getAccount(userId);
    if (!account) {
      return { success: false, error: 'User not found' };
    }

    // Calculate total
    let totalAmount = 0;
    const orderItems: OrderItem[] = [];

    for (const cartItem of cart.items) {
      const product = this.products.get(cartItem.productId);
      if (!product) {
        return { success: false, error: `Product ${cartItem.productId} not found` };
      }

      if (product.stock < cartItem.quantity) {
        return { success: false, error: `Insufficient stock for ${product.name}` };
      }

      const itemTotal = product.price * cartItem.quantity;
      totalAmount += itemTotal;
      orderItems.push({
        productId: product.id,
        quantity: cartItem.quantity,
        price: product.price
      });
    }

    // Check balance
    if (account.walletBalance < totalAmount) {
      return { success: false, error: 'Insufficient funds' };
    }

    // Deduct from wallet
    const balanceUpdate = accountService.updateBalance(account.id, totalAmount, 'subtract');
    if (!balanceUpdate.success) {
      return { success: false, error: balanceUpdate.error };
    }

    // Create order
    const orderId = `ORDER-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const order: Order = {
      id: orderId,
      userId,
      products: orderItems,
      totalAmount,
      status: 'processing',
      paymentMethod: 'wallet',
      shippingAddress,
      createdAt: new Date().toISOString()
    };

    this.orders.set(orderId, order);

    // Update stock
    for (const item of orderItems) {
      const product = this.products.get(item.productId)!;
      product.stock -= item.quantity;
      product.updatedAt = new Date().toISOString();
    }

    // Clear cart
    this.carts.delete(userId);

    this.emit('orderCreated', order);
    return { success: true, order };
  }

  getOrder(orderId: string): Order | null {
    return this.orders.get(orderId) || null;
  }

  getUserOrders(userId: string): Order[] {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }

  // AWS Integration
  connectAWS(userId: string, accountId: string, region: string, resources: AWSConnection['resources']): { success: boolean; error?: string } {
    this.awsConnections.set(userId, {
      accountId,
      region,
      resources
    });

    this.emit('awsConnected', { userId, accountId });
    return { success: true };
  }

  getAWSConnection(userId: string): AWSConnection | null {
    return this.awsConnections.get(userId) || null;
  }

  // AWS Resource provisioning for purchased products
  provisionAWSResource(orderId: string): { success: boolean; resources?: any[]; error?: string } {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const provisionedResources = [];

    for (const item of order.products) {
      const product = this.products.get(item.productId);
      if (product?.awsIntegration) {
        provisionedResources.push({
          productId: product.id,
          productName: product.name,
          arn: product.awsIntegration.arn,
          resourceType: product.awsIntegration.resourceType,
          status: 'provisioned'
        });
      }
    }

    return { success: true, resources: provisionedResources };
  }
}

export const ecommerceService = new ECommerceService();
