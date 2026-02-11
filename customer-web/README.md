# Shadow Bean Co - Customer Web

Premium artisan coffee ordering platform with an interactive Yeti mascot.

**Live**: [shadowbeanco.net](https://shadowbeanco.net)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.9 |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin) |
| Animation | Framer Motion 12 |
| State | Zustand 5 (cart), React Context (auth, assets, yeti) |
| Auth | AWS Amplify 6 + Cognito (manual PKCE OAuth for Google) |
| API | Axios → api.shadowbeanco.net (Lambda + API Gateway) |
| Hosting | AWS Amplify (auto-deploy from `main` branch) |
| Routing | React Router DOM 7 (`BrowserRouter` — NOT HashRouter) |

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | HomePage | Landing page with hero, features, reviews |
| `/shop` | ShopPage | Coffee products, taste profile builder, add to cart |
| `/cart` | CartPage | Card-based items, quantity controls, corner Yeti |
| `/checkout` | CheckoutPage | Shipping form, order summary, COD payment, Yeti celebrates |
| `/login` | LoginPage | Tabbed Sign In / Create Account, Google OAuth, Yeti reactions |
| `/register` | RegisterPage | Redirects to `/login?tab=register` |
| `/profile` | ProfilePage | User stats (orders, blends, reviews) |
| `/about` | AboutPage | Brand story |

## Yeti Mascot

Interactive blue SVG mascot (`src/components/Yeti.tsx`) animated with framer-motion.

**Design**: Blue (#6BA4CC body, #D0E6F5 belly), bulky build with ice-blue horns, fluffy fur crown, bushy eyebrows, toe beans, paw pads, holding a coffee cup.

**States**:
| State | Trigger | Animation |
|-------|---------|-----------|
| `idle` | Default | Gentle sway + periodic blink |
| `watching` | Email field focused | Eyes follow cursor position |
| `shy` | Password field focused | Covers eyes with paws |
| `happy` | Login success, order placed | Bounce + cup raise |
| `sad` | Error, empty cart | Droop posture |

**Context**: `YetiProvider` (`src/components/YetiMascot.tsx`) wraps the app. Pages call `setYetiState()` and `setLookAt()` to control.

## Auth System

3-tier token resilience (handles Amplify v6 OAuth token refresh issues):

1. **Amplify session** — `fetchAuthSession()` (primary)
2. **Local auth cache** — `shadow_bean_auth_cache` in localStorage (fallback)
3. **Manual Cognito refresh** — `/oauth2/token` with `grant_type=refresh_token` (last resort)

**Google OAuth**: Manual PKCE flow (bypasses Amplify's unreliable `signInWithRedirect`):
- Generate `code_verifier` + `code_challenge`
- Redirect to Cognito `/oauth2/authorize?identity_provider=Google`
- Exchange code at `/oauth2/token`
- Store tokens in Amplify's localStorage format

**Redirect preservation**: `?redirect=/checkout` stored in `sessionStorage('shadow_bean_oauth_redirect')` before Google OAuth, retrieved after callback.

**Profile sync**: `ensureProfile()` called on every auth recovery path — both Google and email signups saved to DB.

## API Client

`src/services/api.ts` — Axios instance pointing to `https://api.shadowbeanco.net`.

- Request interceptor attaches Cognito JWT (Amplify → cached token fallback)
- Response interceptor logs 401s without redirecting (AuthContext handles auth state)

## Project Structure

```
src/
├── components/
│   ├── Yeti.tsx              # Animated SVG Yeti mascot (5 states)
│   ├── YetiMascot.tsx        # Yeti context provider + controller
│   └── SEO.tsx               # Meta tags
├── contexts/
│   ├── AuthContext.tsx        # Auth (Google OAuth, token cache, manual refresh)
│   └── AssetContext.tsx       # Dynamic CDN assets via API
├── pages/
│   ├── HomePage.tsx
│   ├── ShopPage.tsx
│   ├── CartPage.tsx           # Corner Yeti, card-based items
│   ├── CheckoutPage.tsx       # Yeti celebrates, COD payment
│   ├── LoginPage.tsx          # Dark navy panel + snow particles + Yeti
│   ├── RegisterPage.tsx       # Redirect to /login?tab=register
│   ├── ProfilePage.tsx
│   └── AboutPage.tsx
├── services/
│   └── api.ts                 # Axios + Cognito JWT interceptor
├── stores/
│   └── cartStore.ts           # Zustand cart state
├── App.tsx                    # Routes + providers (Asset > Auth > Yeti > Router)
├── App.css
├── index.css                  # @import "tailwindcss"
└── main.tsx                   # Amplify config + React root
```

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # TypeScript check + Vite build
npm run preview      # Preview production build on :4173
```

## Build Optimization

Manual chunks in `vite.config.ts`:
- `vendor`: react, react-dom, react-router-dom
- `amplify`: aws-amplify
- `state`: zustand
- `motion`: framer-motion

Target: ES2020, CSS code splitting enabled, chunk warning at 300KB.

## Environment Variables

```env
VITE_API_URL=https://api.shadowbeanco.net
```

Falls back to `https://api.shadowbeanco.net` if not set.

## Deployment

Pushes to `main` auto-deploy via AWS Amplify → `shadowbeanco.net`.
Amplify build spec: `npx tsc -b && npx vite build`, base directory: `customer-web`.
