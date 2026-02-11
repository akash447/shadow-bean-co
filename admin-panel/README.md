# Shadow Bean Co - Admin Panel

Back-office dashboard for managing orders, products, media, pricing, and users.

**Live**: [admin-shadowbeanco.com](https://admin-shadowbeanco.com)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.9 |
| Build | Vite 7 |
| Icons | Lucide React |
| Auth | AWS Amplify 6 + Cognito (manual PKCE OAuth for Google) |
| API | Axios → api.shadowbeanco.net (Lambda + API Gateway) |
| Hosting | AWS Amplify (auto-deploy from `main` branch) |
| Routing | React Router DOM 7 (`BrowserRouter`) |

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Dashboard | Stats overview (users, orders, revenue, recent orders) |
| `/orders` | OrdersPage | All orders with customer info (name/email/phone via profiles JOIN), 10s polling |
| `/products` | ProductsPage | Product CRUD, image management |
| `/users` | UsersPage | Registered users list |
| `/reviews` | ReviewsPage | Customer reviews moderation |
| `/pricing` | PricingPage | Size-based pricing tiers, discount management |
| `/terms` | TermsPage | Terms & conditions versioning |
| `/media` | MediaPage | S3 media upload/replace/delete, pre-signed URL uploads |
| `/access` | AccessPage | Admin user access management |

## Auth

- Google OAuth via manual PKCE (same as customer-web)
- Admin check: API `/admin/auth/check` validates against `admin_users` table
- Master admin fallback for bootstrapping
- `isGoogleRedirecting` flag prevents Hub event interference during OAuth

## API Client

`src/lib/admin-api.ts` — Axios instance with:
- Cognito JWT interceptor (Amplify session → cached token fallback)
- 401 response handler (logs only, no redirects)
- 10s polling on OrdersPage for real-time order updates

## Layout

- **Desktop**: Sidebar navigation + main content area
- **Mobile**: Bottom navigation bar + hamburger menu for sidebar

## Project Structure

```
src/
├── components/
│   ├── Login.tsx              # Admin login (Google OAuth)
│   ├── Sidebar.tsx            # Desktop nav sidebar
│   └── BottomNav.tsx          # Mobile bottom navigation
├── lib/
│   └── admin-api.ts           # Axios + Cognito JWT + admin endpoints
├── pages/
│   ├── Dashboard.tsx
│   ├── OrdersPage.tsx         # Orders + customer info (profiles JOIN)
│   ├── ProductsPage.tsx
│   ├── UsersPage.tsx
│   ├── ReviewsPage.tsx
│   ├── PricingPage.tsx
│   ├── TermsPage.tsx
│   ├── MediaPage.tsx          # S3 media management
│   └── AccessPage.tsx         # Admin access control
├── App.tsx                    # Routes + auth gate
└── index.css
```

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # TypeScript check + Vite build
```

## Deployment

Pushes to `main` auto-deploy via AWS Amplify → `admin-shadowbeanco.com`.
Amplify build spec: `npx tsc -b && npx vite build`, base directory: `admin-panel`.
