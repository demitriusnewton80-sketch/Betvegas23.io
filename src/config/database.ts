
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('⚠️  DATABASE_URL not set. Database features will be limited.');
}

// Use connection pooling for better performance
const poolUrl = databaseUrl ? databaseUrl.replace('.us-east-2', '-pooler.us-east-2') : '';

export const pool = new Pool({
  connectionString: poolUrl || databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database test query successful');
    return true;
  } catch (error) {
    console.error('❌ Database test query failed:', error);
    return false;
  }
}

export async function initializeDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bets (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id),
        game_id VARCHAR(255) NOT NULL,
        team VARCHAR(255) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        odds DECIMAL(10, 2) NOT NULL,
        potential_win DECIMAL(12, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        settled_at TIMESTAMP,
        cash_out_amount DECIMAL(12, 2),
        INDEX idx_user_bets (user_id),
        INDEX idx_game_bets (game_id)
      )
    `);

    // Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        related_bet_id VARCHAR(255),
        INDEX idx_user_transactions (user_id)
      )
    `);

    // Web3 Wallets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS web3_wallets (
        address VARCHAR(255) PRIMARY KEY,
        chain_id INTEGER NOT NULL,
        balance VARCHAR(255) DEFAULT '0',
        nonce INTEGER DEFAULT 0,
        connected_at BIGINT NOT NULL,
        last_activity BIGINT NOT NULL,
        network VARCHAR(100),
        user_id VARCHAR(255) REFERENCES users(id)
      )
    `);

    // Web3 Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS web3_transactions (
        id VARCHAR(255) PRIMARY KEY,
        from_address VARCHAR(255) NOT NULL,
        to_address VARCHAR(255) NOT NULL,
        amount VARCHAR(255) NOT NULL,
        currency VARCHAR(50) NOT NULL,
        hash VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        timestamp BIGINT NOT NULL,
        gas_price VARCHAR(255),
        gas_limit VARCHAR(255),
        nonce INTEGER,
        block_number INTEGER,
        confirmations INTEGER DEFAULT 0,
        INDEX idx_from_address (from_address),
        INDEX idx_to_address (to_address)
      )
    `);

    // Products table (E-commerce)
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        stock INTEGER DEFAULT 0,
        supplier VARCHAR(255),
        specifications JSONB,
        aws_integration JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id),
        total_amount DECIMAL(12, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50) NOT NULL,
        shipping_address JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        INDEX idx_user_orders (user_id)
      )
    `);

    // Order Items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(255) REFERENCES orders(id),
        product_id VARCHAR(255) REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(12, 2) NOT NULL
      )
    `);

    // Streaming Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS streaming_sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        game_id VARCHAR(255) NOT NULL,
        stream_url TEXT,
        status VARCHAR(50) DEFAULT 'active',
        viewers INTEGER DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        fcc_entity VARCHAR(50) DEFAULT '20130314143016'
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}
