
# Young Meat LLC - Sports Betting API

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

### Webhooks
- `POST /webhooks/receive/:sportsbookId` - Receive external updates
- `POST /webhooks/test/:sportsbookId` - Test webhook connection

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
