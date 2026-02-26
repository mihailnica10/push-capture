# Push Capture

A traffic capture platform that converts captured HTTP traffic into web push notification subscriptions.

## Architecture

This is a monorepo using Turborepo with the following packages:

### Backend (`@push-capture/backend`)
- **Framework**: Hono (ultra-fast web framework)
- **Runtime**: Node.js / Bun
- **Port**: 3001
- **Features**:
  - Subscription management API
  - Traffic capture endpoints
  - Web push notification delivery
  - VAPID key management

### Admin Dashboard (`@push-capture/admin-dashboard`)
- **Framework**: React + Vite
- **Port**: 5173
- **Features**:
  - View and manage subscriptions
  - Browse captured traffic events
  - Send individual or broadcast push notifications
  - Traffic analytics dashboard

### Subscriber Landing (`@push-capture/subscriber-landing`)
- **Framework**: React + Vite
- **Port**: 5174
- **Features**:
  - Push notification subscription UI
  - Service worker for receiving notifications
  - PWA support

## Getting Started

### Prerequisites
- Node.js >= 20
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp packages/backend/.env.example packages/backend/.env
```

### Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Add the generated keys to `packages/backend/.env`:
```
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your-email@example.com
```

### Development

```bash
# Start all services (requires turbo)
pnpm dev

# Or start individually:
# Backend
cd packages/backend && pnpm dev

# Admin Dashboard
cd packages/admin-dashboard && pnpm dev

# Subscriber Landing
cd packages/subscriber-landing && pnpm dev
```

## API Endpoints

### Health
- `GET /health` - Health check
- `GET /` - API info

### Subscriptions
- `GET /api/subscriptions` - List all subscriptions
- `GET /api/subscriptions/:id` - Get subscription by ID
- `POST /api/subscriptions` - Create new subscription
- `DELETE /api/subscriptions/:id` - Delete subscription
- `PATCH /api/subscriptions/:id/status` - Update subscription status

### Traffic
- `POST /api/traffic/capture` - Capture traffic event
- `GET /api/traffic` - List captured traffic
- `GET /api/traffic/stats/summary` - Get traffic statistics
- `GET /api/traffic/:id` - Get traffic event by ID

### Push Notifications
- `GET /api/push/vapid-key` - Get VAPID public key
- `POST /api/push/send/:subscriptionId` - Send to single subscription
- `POST /api/push/broadcast` - Broadcast to all subscriptions
- `POST /api/push/trigger/:trafficId` - Trigger notification from traffic event

## License

MIT
