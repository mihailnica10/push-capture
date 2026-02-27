# Push Capture

A traffic capture platform that converts captured HTTP traffic into web push notification subscriptions.

## Architecture

This is a monorepo using Turborepo with the following packages:

### Backend (`@push-capture/backend`)
- **Framework**: Hono (ultra-fast web framework)
- **Runtime**: Node.js / Bun
- **Database**: PostgreSQL 16 with Drizzle ORM
- **Port**: 3001
- **Features**:
  - Subscription management API
  - Traffic capture endpoints
  - Web push notification delivery
  - VAPID key management (stored in database)

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
- Docker and Docker Compose (for PostgreSQL)
- npm

### Quick Start

```bash
# Start PostgreSQL
docker compose up -d

# Install dependencies
npm install

# Run database migrations
cd packages/backend
npm run db:migrate

# Seed initial VAPID config
npm run db:seed

# Start backend
npm run dev
```

### Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Update the VAPID config in the database or via `packages/backend/.env`:
```
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your-email@example.com
```

### Database Management

```bash
# Generate migrations from schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio

# Seed database
npm run db:seed
```

### Development

Start each service individually:

```bash
# Backend (port 3001)
cd packages/backend && npm run dev

# Admin Dashboard (port 5173)
cd packages/admin-dashboard && npm run dev

# Subscriber Landing (port 5174)
cd packages/subscriber-landing && npm run dev
```

## Database Schema

### `subscriptions` - Web push subscriptions
| Column | Type |
|--------|------|
| id | text (PK) |
| endpoint | text (unique) |
| p256dh | text |
| auth | text |
| userAgent | text |
| metadata | jsonb |
| status | enum (active, inactive, failed) |
| createdAt | timestamp |
| updatedAt | timestamp |

### `traffic_events` - Captured HTTP traffic
| Column | Type |
|--------|------|
| id | text (PK) |
| url | text |
| method | text |
| headers | jsonb |
| body | jsonb |
| source | text |
| metadata | jsonb |
| createdAt | timestamp |

### `vapid_config` - VAPID keys (singleton)
| Column | Type |
|--------|------|
| id | text (PK) |
| publicKey | text |
| privateKey | text |
| subject | text |
| createdAt | timestamp |
| updatedAt | timestamp |

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
- `GET /api/traffic` - List captured traffic (with pagination)
- `GET /api/traffic/stats/summary` - Get traffic statistics
- `GET /api/traffic/:id` - Get traffic event by ID

### Push Notifications
- `GET /api/push/vapid-key` - Get VAPID public key
- `POST /api/push/send/:subscriptionId` - Send to single subscription
- `POST /api/push/broadcast` - Broadcast to all subscriptions
- `POST /api/push/trigger/:trafficId` - Trigger notification from traffic event

## License

MIT
