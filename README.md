# Shadow Bean Co

Artisan coffee ordering platform — custom taste profiles, online ordering, and admin management.

## Live Sites

| Site | URL | Description |
|------|-----|-------------|
| Customer | [shadowbeanco.net](https://shadowbeanco.net) | Customer-facing storefront |
| Admin | [admin-shadowbeanco.com](https://admin-shadowbeanco.com) | Back-office dashboard |
| API | [api.shadowbeanco.net](https://api.shadowbeanco.net) | REST API |
| Media CDN | [media.shadowbeanco.net](https://media.shadowbeanco.net) | Images & assets |

## Architecture

```
Users ─→ shadowbeanco.net (Amplify) ─→ customer-web (React/Vite)
Users ─→ admin-shadowbeanco.com (Amplify) ─→ admin-panel (React/Vite)
Apps  ─→ api.shadowbeanco.net (API Gateway) ─→ Lambda (Node.js 22) ─→ Aurora PostgreSQL
Media ─→ media.shadowbeanco.net (CloudFront) ─→ S3 (private, OAC)
Auth  ─→ AWS Cognito (Google OAuth + email/password)
Pay   ─→ Razorpay
Ship  ─→ Shiprocket
```

## Repository Structure

```
shadow-bean-co/
├── customer-web/          # Customer storefront (React 19, Tailwind v4, Framer Motion)
│   └── README.md
├── admin-panel/           # Admin dashboard (React 19, Lucide icons)
│   └── README.md
├── lambda/
│   ├── api/               # Main API Lambda (Node.js 22, RDS Data API, S3 SDK)
│   │   ├── index.js
│   │   └── package.json
│   └── cognito-presignup/ # Auto-confirm trigger
│       └── index.js
├── database/
│   └── rds_schema.sql     # PostgreSQL schema (12 tables)
├── terraform/             # Infrastructure as Code
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── api-gateway.tf
└── README.md              # This file
```

## AWS Infrastructure

| Resource | Details |
|----------|---------|
| Region | ap-south-1 (Mumbai) |
| Lambda (API) | `shadowbeanco-api` — Node.js 22, 512MB |
| Lambda (PreSignUp) | `shadowbeanco-cognito-presignup` — Node.js 22, 128MB |
| Database | Aurora PostgreSQL Serverless v2 (via Data API) |
| Auth | Cognito User Pool `ap-south-1_jZV6770zJ` |
| Storage | S3 `shadowbeanco-media` + CloudFront OAC |
| DNS | Route 53 (2 hosted zones) |
| Hosting | Amplify (2 apps, auto-deploy from `main`) |
| API Gateway | Custom domain `api.shadowbeanco.net` |
| Certs | ACM (ap-south-1 for API, us-east-1 for CloudFront) |
| IaC | Terraform |

## Database Schema (12 tables)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (linked via `cognito_sub`) |
| `admin_users` | Admin access control |
| `products` | Coffee products with JSONB sizes |
| `taste_profiles` | Custom coffee taste configurations |
| `addresses` | Saved shipping addresses |
| `orders` | Orders (pending → confirmed/cancelled → shipped → delivered) |
| `order_items` | Line items per order |
| `reviews` | Customer reviews (1-5 stars) |
| `pricing` | Size-based pricing tiers + discounts |
| `terms_and_conditions` | Versioned T&C content |
| `app_assets` | Media asset registry (key → CDN URL) |
| `notifications` | User notifications (order updates) |

## API Endpoints (Lambda)

### Public
- `GET /products` — List active products
- `GET /products/:id` — Single product
- `GET /reviews` — Recent reviews
- `GET /pricing/active` — Current pricing tier
- `GET /terms/active` — Current T&C
- `GET /assets` — All media assets
- `GET /assets/:key` — Asset by key

### Authenticated (Cognito JWT)
- `POST /profiles/ensure` — Create/upsert profile
- `GET/PUT /profiles/:id` — Read/update profile
- `GET/POST /taste-profiles` — List/create taste profiles
- `PUT/DELETE /taste-profiles/:id` — Update/delete taste profile
- `GET/POST /addresses` — List/create addresses
- `PUT/DELETE /addresses/:id` — Update/delete address
- `GET/POST /orders` — List/create orders
- `GET /orders/:id` — Single order
- `POST /reviews` — Create review

### Admin
- `GET /admin/auth/check` — Verify admin access
- `GET /admin/orders` — All orders (with customer info JOIN)
- `PUT /admin/orders/:id/status` — Update order status
- `GET /admin/users` — All users
- `GET /admin/stats` — Dashboard stats
- `POST /admin/media/upload-url` — Pre-signed S3 upload URL
- `DELETE /admin/media/:key` — Delete S3 object

## Authentication

Both apps use manual PKCE OAuth for Google sign-in (bypasses Amplify v6's unreliable `signInWithRedirect`):

1. Generate `code_verifier` + SHA-256 `code_challenge`
2. Redirect to Cognito `/oauth2/authorize?identity_provider=Google`
3. Exchange authorization code at `/oauth2/token`
4. Store tokens in Amplify's localStorage format

Customer-web has 3-tier token resilience: Amplify session → local auth cache → manual Cognito refresh.

Cognito PreSignUp Lambda auto-confirms all users (no email verification step).

## Development

```bash
# Customer web
cd customer-web && npm install && npm run dev

# Admin panel
cd admin-panel && npm install && npm run dev

# Deploy Lambda
cd lambda/api
npm install && npx bestzip api.zip index.js package.json node_modules/
aws lambda update-function-code --function-name shadowbeanco-api --zip-file fileb://api.zip

# Terraform
cd terraform
terraform plan && terraform apply
```

## Deployment

Both frontends auto-deploy to AWS Amplify on push to `main`.
Lambda updates require manual zip + deploy via AWS CLI.
Infrastructure changes via Terraform.

---
**Region**: ap-south-1 (Mumbai) | **Domain**: shadowbeanco.net
