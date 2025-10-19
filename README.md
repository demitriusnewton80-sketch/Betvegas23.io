
# Young Meeat LLC - Sports Betting API

Headless sports betting API with AWS, GitHub, and FCC streaming integration.

## API Endpoints

### Health & Documentation
- `GET /health` - Health check for AWS monitoring
- `GET /api` - Complete API documentation

### Sportsbook
- `GET /sportsbook/games` - Get all available games
- `POST /sportsbook/bet` - Place a bet
- `GET /sportsbook/user/:userId/wallet` - Get user wallet balance
- `POST /sportsbook/user/:userId/deposit` - Deposit funds
- `GET /sportsbook/user/:userId/bets` - Get user's bets
- `POST /sportsbook/cashout/:betId` - Cash out a bet

### Live Streaming
- `GET /streaming/stream/:gameId` - SSE live game stream
- `POST /streaming/stream/:gameId/start` - Start game stream
- `POST /streaming/stream/:gameId/stop` - Stop game stream
- `GET /streaming/stream/:gameId/sharing` - Get sharing status
- `GET /streaming/partners` - List external sportsbook partners
- `POST /streaming/partners` - Add external sportsbook partner

### Authentication (FCC SSO)
- `GET /auth/login` - Initiate FCC SSO login
- `GET /auth/callback` - SSO callback handler
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout
- `GET /auth/status` - SSO status

### PlayStation Network Integration
- `GET /playstation-network-sso.html` - PlayStation 5 users landing page
- `GET /sso-plugin/login/playstation-network` - PSN SSO login
- `GET /sportsbook/games?source=psn` - Gaming content betting
- `GET /ps5-betting.html` - PS5 sports betting interface

### Transformer Bridge (Core to Web3 Delivery)
- `GET /transformer/status` - Get transformer bridge status
- `POST /transformer/activate` - Activate transformer bridge
- `POST /transformer/deactivate` - Deactivate transformer bridge
- `POST /transformer/transform` - Transform and deliver data to Web3
- `POST /transformer/transform/batch` - Batch transform data
- `GET /transformer/rules` - Get transformation rules
- `GET /transformer/data` - Get transformed data history
- `GET /transformer/data/:id` - Get specific transformed data

### Web3 Bridge (Blockchain Integration)
- `GET /web3/status` - Get Web3 bridge status
- `POST /web3/wallet/connect` - Connect crypto wallet
- `GET /web3/wallet/:address/balance` - Get wallet balance
- `GET /web3/wallet/:address` - Get wallet info
- `POST /web3/wallet/:address/disconnect` - Disconnect wallet
- `GET /web3/wallets` - Get all connected wallets
- `POST /web3/transaction/create` - Create blockchain transaction
- `POST /web3/transaction/:txId/send` - Send transaction
- `GET /web3/transaction/:txId` - Get transaction details
- `GET /web3/transactions` - Get all transactions
- `GET /web3/transaction/:hash/verify` - Verify transaction
- `GET /web3/chain/config` - Get blockchain configuration
- `GET /web3-bridge.html` - Web3 bridge dashboard

### PS5 Sports Betting (Madden, NBA 2K, UFC, Undisputed, 5v5)
- `GET /ps5/games` - Get all PS5 games
- `GET /ps5/games?type=madden` - Filter by game type
- `GET /ps5/games/:gameId` - Get specific game
- `POST /ps5/enroll` - Enroll user in PS5 betting
- `POST /ps5/bet` - Place bet on PS5 game
- `GET /ps5/user/:userId` - Get user info and enrollment points
- `GET /ps5/user/psn/:psnId` - Get user by PSN ID
- `GET /ps5/user/:userId/bets` - Get user's bets
- `POST /ps5/user/:userId/deposit` - Deposit funds
- `GET /ps5/user/:userId/points` - Get enrollment points
- `GET /ps5/plugin/status` - Get public plugin approval status
- `POST /ps5/plugin/verify` - Verify plugin connection
- `GET /ps5-enrollment-plugin.html` - Public plugin enrollment page

### SSO Plugin System
- `GET /sso-plugin/plugins` - Get all SSO plugins
- `GET /sso-plugin/plugins/enabled` - Get enabled plugins
- `GET /sso-plugin/plugins/:pluginId` - Get plugin details (SSO protected)
- `GET /sso-plugin/login/:pluginId` - Login with specific plugin
- `GET /sso-plugin/callback` - SSO plugin callback handler
- `POST /sso-plugin/plugins/:pluginId/toggle` - Enable/disable plugin (SSO protected)
- `PUT /sso-plugin/plugins/:pluginId/config` - Update plugin config (SSO protected)
- `GET /sso-plugin/stats` - Get plugin statistics (SSO protected)
- `GET /sso-plugin/session` - Get current plugin session (SSO protected)

### Spotify Integration (SSO Protected)
- `POST /spotify/connect` - Connect Spotify account
- `GET /spotify/status` - Check Spotify connection status
- `POST /spotify/upload` - Upload Spotify content to server
- `GET /spotify/uploads` - Get user's uploads
- `GET /spotify/uploads/:uploadId` - Get specific upload
- `DELETE /spotify/uploads/:uploadId` - Delete upload
- `GET /spotify/fetch/:type/:spotifyId` - Fetch data from Spotify

### Content Control (SSO Protected)
- `POST /content/create` - Create new content item
- `GET /content/:contentId` - Get content by ID
- `PUT /content/:contentId` - Update content
- `DELETE /content/:contentId` - Delete content
- `GET /content/my/list` - List user's accessible content
- `POST /content/:contentId/share` - Share content with user
- `POST /content/:contentId/access/grant` - Grant access permissions
- `POST /content/:contentId/access/revoke` - Revoke access permissions
- `GET /content/system/stats` - Get content statistics
- `GET /content/:contentId/audit` - Get content audit log

### Webhooks
- `POST /webhooks/receive/:sportsbookId` - Receive external updates
- `POST /webhooks/test/:sportsbookId` - Test webhook connection

### SAM.gov Integration
- `GET /sam/entity/young-meeat-llc` - Get Young Meeat LLC entity data
- `GET /sam/entity/search?name=` - Search entity by name
- `GET /sam/entity/uei/:uei` - Get entity by UEI
- `GET /sam/validate/:entityName` - Validate SAM registration
- `GET /sam/sso/login` - Initiate SAM.gov SSO login
- `GET /sam/sso/callback` - SAM.gov SSO callback
- `GET /sam/config` - Get SAM.gov configuration (SSO protected)
- `POST /sam/config/api-key` - Update API key (SSO protected)
- `GET /sam/cache` - Get cached entities (SSO protected)
- `GET /sam/profile-link` - Get direct SAM.gov profile link

## Deployment on Replit

1. Set environment variables in Replit Secrets
2. Click "Run" to start the API server
3. Access at your Replit URL (e.g., `https://your-repl.replit.app`)

## Connecting External Devices

Use the API endpoints with your API key:

```bash
curl -H "X-API-Key: your_api_key" https://your-repl.replit.app/api
```

## AWS Integration

- Health checks available at `/health`
- Designed for AWS ECS/Lambda deployment
- S3 integration ready for data storage

## GitHub Integration

- Connected to https://github.com/betvages23/betvages23.in
- Automated deployments via GitHub Actions
- Version control and CI/CD pipeline

## FCC Compliance

- FCC-compliant SSO authentication
- Streaming services meet FCC requirements
- Full audit trail for regulatory compliance
