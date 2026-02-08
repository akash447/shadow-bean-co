# Shadow Bean Co - Complete Technical Documentation
**Last Updated: 2026-02-08**
**For: Antigravity IDE Context Sync**

---

## 1. PROJECT OVERVIEW

Shadow Bean Co is a specialty coffee e-commerce platform from India. The entire infrastructure runs on AWS (ap-south-1, Mumbai). Previously used Supabase, Firebase, Vercel, and Hostinger - all have been fully migrated and removed.

**GitHub**: https://github.com/akash447/shadow-bean-co.git (branch: `main`)

---

## 2. LIVE INFRASTRUCTURE

| Resource | Identifier | URL/Endpoint |
|----------|-----------|-------------|
| **Customer Website** | Amplify d2tg6prh50w16m | https://shadowbeanco.net |
| **Admin Panel** | Amplify dz6fvucmxdid9 | https://admin-shadowbeanco.com |
| **API Gateway** | lcsu89utmg | https://api.shadowbeanco.net |
| **Lambda Function** | shadowbeanco-api | nodejs20.x, 512MB |
| **Aurora PostgreSQL** | shadowbeanco-db cluster | shadowbeanco-db.cluster-czu488yay7o2.ap-south-1.rds.amazonaws.com |
| **S3 Media Bucket** | shadowbeanco-media | 37 files |
| **CloudFront CDN** | E35Z5V9TCCYTOJ | https://media.shadowbeanco.net |
| **Cognito User Pool** | ap-south-1_jZV6770zJ | Client: 42vpa5vousikig0c4ohq2vmkge |
| **Cognito Identity Pool** | ap-south-1:5dd67b93-9e3c-4de3-a74f-2df439437bbd | |
| **Cognito Domain** | shadowbeanco | https://shadowbeanco.auth.ap-south-1.amazoncognito.com |
| **Route 53 Zone** | Z03939021VCQN8F0DLT1P | shadowbeanco.net (registrar zone) |
| **Secrets Manager** | shadowbeanco/db-credentials | DB password |
| **ACM Certs** | 3 certificates | ap-south-1 (API) + 2x us-east-1 (CloudFront) |

**AWS Account**: 173256371846, User: Akash-Admin, Region: ap-south-1

---

## 3. ARCHITECTURE DIAGRAM

```
                        shadowbeanco.net
                              |
                    [AWS Amplify Hosting]
                              |
                    customer-web (React/Vite)
                              |
         +--------------------+--------------------+
         |                    |                    |
   [Cognito Auth]    [API Gateway]        [CloudFront CDN]
   Google OAuth      api.shadowbeanco.net  media.shadowbeanco.net
   Email/Password           |                    |
         |            [Lambda Function]     [S3 Bucket]
         |            shadowbeanco-api    shadowbeanco-media
         |                    |              (OAC, private)
         |          [Aurora PostgreSQL]
         |          Serverless v2 (Data API)
         |                    |
         +--------------------+
                              |
                    admin-shadowbeanco.com
                              |
                    [AWS Amplify Hosting]
                              |
                    admin-panel (React/Vite)
```

**Payment**: Razorpay (unchanged)
**Shipping**: Shiprocket (unchanged)

---

## 4. PROJECT STRUCTURE

```
Shadow Bean Co/
├── customer-web/          # Customer website (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/    # Header, SEO, CDNImage
│   │   ├── contexts/      # AuthContext (Cognito), AssetContext (CDN)
│   │   ├── pages/         # HomePage, ShopPage, CartPage, CheckoutPage, etc.
│   │   ├── services/      # api.ts (Lambda API client), amplify-auth.ts
│   │   ├── stores/        # cartStore (Zustand)
│   │   └── main.tsx       # Amplify v6 Gen2 config + React entry
│   ├── amplify.yml        # Amplify build spec
│   └── package.json
│
├── admin-panel/           # Admin dashboard (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/    # Login, Sidebar, BottomNav
│   │   ├── lib/           # admin-api.ts (API client + Cognito auth)
│   │   ├── pages/         # Dashboard, Orders, Products, Media, etc.
│   │   └── main.tsx       # Amplify v6 Gen2 config
│   ├── amplify.yml        # Amplify build spec
│   └── package.json
│
├── mobile-app/            # React Native / Expo (native mobile)
│   ├── src/
│   │   ├── services/      # cognito-auth.ts (Cognito auth)
│   │   └── components/    # CDNImage
│   └── package.json
│
├── web-app/               # Expo Web (React Native Web)
│   ├── src/
│   │   ├── services/      # cognito-auth.ts (Cognito auth)
│   │   └── components/    # CDNImage
│   └── package.json
│
├── lambda/api/            # Serverless API
│   ├── index.js           # All routes (public + auth + admin)
│   └── package.json       # aws-sdk, aws-jwt-verify, s3-request-presigner
│
├── terraform/             # Infrastructure as Code
│   ├── main.tf            # Core AWS resources
│   ├── api-gateway.tf     # API Gateway + Lambda integration
│   ├── variables.tf       # Variable definitions
│   ├── outputs.tf         # Output values
│   └── terraform.tfvars   # (gitignored) Secrets
│
├── database/
│   └── rds_schema.sql     # PostgreSQL schema (12 tables)
│
├── scripts/
│   ├── migrate-supabase-to-rds.js  # One-time migration (completed)
│   └── run-schema.js               # Schema executor
│
└── .gitignore
```

---

## 5. DATABASE SCHEMA (Aurora PostgreSQL)

12 tables in `shadowbeanco` database:

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `profiles` | User profiles | id, cognito_sub, email, full_name, phone, avatar_url |
| `products` | Coffee products | id, name, description, base_price, sizes, image_url, is_active |
| `taste_profiles` | User's coffee preferences | id, user_id, name, bitterness, acidity, body, flavour, roast_level, grind_type |
| `orders` | Customer orders | id, user_id, status, total_amount, razorpay_payment_id, shipping_address |
| `order_items` | Items in each order | id, order_id, taste_profile_id, taste_profile_name, quantity, unit_price |
| `addresses` | Saved shipping addresses | id, user_id, label, full_name, phone, address_line, city, state, pincode |
| `reviews` | Product reviews | id, user_id, rating, comment, is_approved |
| `pricing` | Price configurations | id, name, base_price, size_100g/250g/500g/1kg, discount_pct, is_active |
| `terms_and_conditions` | T&C versions | id, content, version, is_active |
| `app_assets` | CDN media assets | id, key, url, title, type, category |
| `admin_users` | Admin access list | id, user_id, email, role, is_active |
| `shipping_config` | Shipping settings | id, provider, config, is_active |

---

## 6. API ENDPOINTS (Lambda)

Base URL: `https://api.shadowbeanco.net`

### Public Routes (no auth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/products` | List active products |
| GET | `/products/:id` | Get single product |
| GET | `/reviews` | List approved reviews |
| GET | `/pricing/active` | Get active pricing |
| GET | `/terms/active` | Get active T&C |
| GET | `/assets` | List all CDN assets |
| GET | `/assets/:key` | Get single asset by key |

### Authenticated Routes (Cognito JWT required)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/profiles/ensure` | Create/get user profile |
| GET | `/profiles/:id` | Get profile by ID or cognito_sub |
| PUT | `/profiles/:id` | Update profile |
| GET | `/taste-profiles` | List user's taste profiles |
| POST | `/taste-profiles` | Create taste profile |
| GET | `/addresses` | List user's addresses |
| POST | `/addresses` | Create address |
| GET | `/orders` | List user's orders |
| POST | `/orders` | Place new order |
| POST | `/reviews` | Submit review |

### Admin Routes (JWT + admin_users table / master email)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/auth/check` | Check if current user is admin |
| GET | `/admin/dashboard/stats` | Dashboard statistics |
| GET | `/admin/orders` | All orders |
| PUT | `/admin/orders/:id/status` | Update order status |
| PUT | `/admin/orders/:id/cancel` | Cancel order |
| GET | `/admin/profiles` | All user profiles |
| GET/POST | `/admin/products` | List/create products |
| PUT/DELETE | `/admin/products/:id` | Update/delete product |
| GET/DELETE | `/admin/reviews/:id` | List/delete reviews |
| GET/POST | `/admin/pricing` | List/create pricing |
| PUT | `/admin/pricing/:id` | Update pricing |
| GET/POST | `/admin/terms` | Get/create T&C |
| GET/POST | `/admin/assets` | List/create assets |
| POST | `/admin/assets/upload` | Get pre-signed S3 upload URL |
| PUT | `/admin/assets/:key` | Update asset metadata |
| DELETE | `/admin/assets/:key` | Delete asset from S3 + DB |
| GET/POST/PUT/DELETE | `/admin/access` | Manage admin users |

---

## 7. AUTHENTICATION SYSTEM

### Cognito Configuration
- **User Pool**: ap-south-1_jZV6770zJ
- **App Client**: 42vpa5vousikig0c4ohq2vmkge
- **Identity Pool**: ap-south-1:5dd67b93-9e3c-4de3-a74f-2df439437bbd
- **Hosted UI Domain**: shadowbeanco.auth.ap-south-1.amazoncognito.com
- **Auth Flows**: USER_SRP_AUTH, USER_PASSWORD_AUTH, REFRESH_TOKEN
- **OAuth**: Authorization Code Grant, scopes: openid, email, profile
- **Social Providers**: Google (client ID: 842429166439-dkamkgs6qf9ednimepuc0j2uuhbuj9rc)
- **Google Redirect URI**: https://shadowbeanco.auth.ap-south-1.amazoncognito.com/oauth2/idpresponse

### Callback URLs (registered in Cognito)
- https://shadowbeanco.net
- https://admin-shadowbeanco.com
- http://localhost:5173
- http://localhost:8081

### Admin Access Control
Admin access is NOT based on Cognito groups. Instead:
1. Master admin email is hardcoded in Lambda: `akasingh.singh6@gmail.com`
2. Additional admins are stored in `admin_users` table
3. Lambda endpoint `POST /admin/auth/check` verifies admin status
4. Admin credentials: akasingh.singh6@gmail.com / ShadowBean@2026

### Auth Flow (Amplify v6 Gen2 Format)
```typescript
// Both apps configure Amplify in main.tsx:
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'ap-south-1_jZV6770zJ',
      userPoolClientId: '42vpa5vousikig0c4ohq2vmkge',
      identityPoolId: 'ap-south-1:5dd67b93-9e3c-4de3-a74f-2df439437bbd',
      loginWith: {
        email: true,
        oauth: {
          domain: 'shadowbeanco.auth.ap-south-1.amazoncognito.com',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: ['https://shadowbeanco.net', 'http://localhost:5173'],
          redirectSignOut: ['https://shadowbeanco.net', 'http://localhost:5173'],
          responseType: 'code',
          providers: ['Google'],
        },
      },
    },
  },
});
```

### Known Auth Issues / Patterns
- Amplify v6 throws `UserAlreadyAuthenticatedException` if `signIn()` is called with existing session
- Fix: catch this error, call `signOut()`, then retry `signIn()`
- Google OAuth requires Hub listener for `signedIn`/`signInWithRedirect` events
- Admin App.tsx has Hub listener to detect OAuth callback after redirect
- Customer AuthContext.tsx has Hub listener for all auth events

---

## 8. MEDIA / CDN SYSTEM

### Asset Management
- **S3 Bucket**: shadowbeanco-media (private, no public access)
- **CloudFront Distribution**: E35Z5V9TCCYTOJ with OAC (Origin Access Control)
- **CDN URL**: https://media.shadowbeanco.net
- **Assets in DB**: 26 records in `app_assets` table, each with unique `key`

### Asset Context (customer-web)
```typescript
// customer-web/src/contexts/AssetContext.tsx
// Fetches all assets from GET /assets on load
// Provides useAsset(key) hook that returns CDN URL
const logoUrl = useAsset('logo_main');  // → https://media.shadowbeanco.net/logo.png
```

### Key Asset Keys
| Key | URL | Description |
|-----|-----|-------------|
| logo_main | logo.png | Full brand logo |
| logo_bird | logo_bird.png | Bird icon logo |
| home_hero | home_hero.png | Homepage hero image |
| about_hero | about_hero.jpg | About page hero |
| product_bag | product_bag.png | Product image |
| coffee_farmer | coffee_farmer.jpg | Farmer photo |
| brewing_guide | how_to_brew.mp4 | Brewing video |
| icon_* | icon_*.png | Various icons |

### Admin Media Management
- Upload: `POST /admin/assets/upload` returns pre-signed S3 URL
- Client uploads directly to S3 via pre-signed URL
- Then creates DB record via `POST /admin/assets`
- Replace/delete also supported via admin API

---

## 9. AMPLIFY HOSTING & CI/CD

### Build Spec (CRITICAL - Monorepo Pattern)
Both apps are in a monorepo. CWD persists between preBuild/build/postBuild phases.
`baseDirectory` in artifacts is ALWAYS relative to **repo root**, not CWD.

**customer-web amplify.yml** (branch-level AND app-level):
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd customer-web && npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: customer-web/dist
    files:
      - '**/*'
  cache:
    paths:
      - customer-web/node_modules/**/*
```

**admin-panel amplify.yml**:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd admin-panel && npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: admin-panel/dist
    files:
      - '**/*'
  cache:
    paths:
      - admin-panel/node_modules/**/*
```

### Domain Configuration
- **shadowbeanco.net** → Amplify app d2tg6prh50w16m, main branch
- **admin-shadowbeanco.com** → Amplify app dz6fvucmxdid9, main branch
- Both auto-deploy on push to `main` branch

---

## 10. CORS CONFIGURATION

### API Gateway (lcsu89utmg) CORS
```json
{
  "AllowCredentials": true,
  "AllowHeaders": ["authorization", "content-type"],
  "AllowMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "AllowOrigins": [
    "https://shadowbeanco.net",
    "https://www.shadowbeanco.net",
    "https://admin-shadowbeanco.com",
    "https://www.admin-shadowbeanco.com",
    "http://localhost:5173",
    "http://localhost:8081"
  ],
  "MaxAge": 3600
}
```

### Lambda CORS (in index.js)
Same origins list as API Gateway. Set per-request based on `Origin` header.

---

## 11. SECURITY

- **S3**: Private bucket + CloudFront OAC (no Principal: * policies)
- **DB Credentials**: AWS Secrets Manager (`shadowbeanco/db-credentials`)
- **JWT Verification**: Lambda verifies Cognito ID tokens using `aws-jwt-verify`
- **Admin Auth**: Email-based check (master admin + admin_users table), NOT Cognito groups
- **CORS**: Locked to specific origins
- **Terraform State**: .tfstate files gitignored, secrets in terraform.tfvars (gitignored)
- **No hardcoded secrets in code** (environment variables + Secrets Manager)

---

## 12. KEY DEPENDENCIES

### customer-web
- react, react-dom, react-router-dom (HashRouter)
- aws-amplify (v6 - Cognito auth)
- axios (API calls)
- zustand (cart state)
- vite + typescript

### admin-panel
- react, react-dom, react-router-dom (BrowserRouter)
- aws-amplify (v6 - Cognito auth)
- axios (API calls)
- lucide-react (icons)
- vite + typescript

### Lambda
- @aws-sdk/client-rds-data (Aurora Data API)
- @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner (S3 operations)
- aws-jwt-verify (Cognito token verification)

### mobile-app / web-app
- expo, react-native
- aws-amplify (Cognito auth)
- axios (API calls)
- zustand (state management)

---

## 13. COMMON OPERATIONS

### Deploy Lambda Update
```bash
cd "C:/Users/akasi/Desktop/Shadow Bean Co/lambda/api"
npx bestzip api.zip index.js package.json node_modules/
aws lambda update-function-code --function-name shadowbeanco-api --zip-file fileb://api.zip --region ap-south-1
```

### Run Terraform
```bash
cd "C:/Users/akasi/Desktop/Shadow Bean Co/terraform"
terraform plan
terraform apply
```

### Dev Servers
```bash
cd customer-web && npm run dev    # http://localhost:5173
cd admin-panel && npm run dev     # http://localhost:5173
cd mobile-app && npx expo start   # http://localhost:8081
```

### Upload Media to S3
```bash
aws s3 cp ./file.png s3://shadowbeanco-media/file.png
```

### Check Amplify Build Status
```bash
aws amplify list-jobs --app-id d2tg6prh50w16m --branch-name main --region ap-south-1 --max-items 1
aws amplify list-jobs --app-id dz6fvucmxdid9 --branch-name main --region ap-south-1 --max-items 1
```

---

## 14. KNOWN ISSUES / IN-PROGRESS

1. **Google OAuth**: Cognito backend fully configured (OAuth flows, scopes, callback URLs, Google IdP). Front-end `signInWithRedirect` triggers correctly. Hub listeners in both apps detect `signInWithRedirect` events. Test in incognito. Ensure Google Cloud Console has redirect URI: `https://shadowbeanco.auth.ap-south-1.amazoncognito.com/oauth2/idpresponse`.

2. **Two Cognito Users for Same Email**: User `akasingh.singh6@gmail.com` has both a password-based account (CONFIRMED) and a Google OAuth account (`google_117476669980515650149`, EXTERNAL_PROVIDER). These are separate Cognito users. Both should work for admin access since Lambda checks email, not username.

3. **Profile Persistence**: `ensureProfile()` is now called after every successful auth (login, Google OAuth, session restore). Profiles are upserted to PostgreSQL `profiles` table via `POST /profiles/ensure`. Fallback to Cognito-only profile if API is unreachable.

4. **Email Verification**: Registration now shows verification code input after signup. Login page also handles UNCONFIRMED users by showing the code entry form. Cognito sends codes via `COGNITO_DEFAULT` email (50/day limit, check spam).

5. **Mobile App**: Auth migrated to Cognito (`cognito-auth.ts`) but the app hasn't been rebuilt/tested with the new dependencies since Firebase/Supabase removal.

6. **Lighthouse Audit**: Step 38 in migration checklist - not yet completed.

---

## 15. REMOVED SERVICES (Complete)

| Service | Status | Notes |
|---------|--------|-------|
| **Supabase** | Fully removed | All data migrated to Aurora PostgreSQL. @supabase/supabase-js removed from all package.json files. Old supabase.ts files deleted. |
| **Firebase** | Fully removed | firebase.json, firebase.ts config, analytics.ts all deleted. Firebase/react-native-firebase removed from all package.json files. |
| **Vercel** | Fully removed | .vercel/ directory deleted. No vercel.json or deployment configs remain. |
| **Hostinger** | Fully removed | Domain now managed via Route 53. |
| **WooCommerce** | Fully removed | All WC code and API keys deleted. Products managed via admin panel. |

---

## 16. FILE-BY-FILE REFERENCE

### Critical Files
| File | Purpose |
|------|---------|
| `customer-web/src/main.tsx` | Amplify v6 config (Cognito + OAuth) |
| `customer-web/src/contexts/AuthContext.tsx` | Auth state, login, Google login, Hub listener |
| `customer-web/src/contexts/AssetContext.tsx` | CDN asset provider, useAsset() hook |
| `customer-web/src/services/api.ts` | Axios API client with JWT interceptor |
| `customer-web/src/pages/CheckoutPage.tsx` | Order placement (calls POST /orders) |
| `customer-web/src/components/Header.tsx` | Site header with logo_main asset |
| `admin-panel/src/main.tsx` | Amplify v6 config (admin redirects) |
| `admin-panel/src/App.tsx` | Auth state + Hub listener for OAuth |
| `admin-panel/src/lib/admin-api.ts` | Admin API client, signIn, signInWithGoogle |
| `admin-panel/src/pages/MediaPage.tsx` | S3 media upload/manage UI |
| `lambda/api/index.js` | ALL API routes, JWT verify, CORS, DB queries |
| `terraform/main.tf` | Core AWS infrastructure |
| `database/rds_schema.sql` | Complete PostgreSQL schema |

---

*This document should be uploaded to Antigravity IDE for context synchronization.*
