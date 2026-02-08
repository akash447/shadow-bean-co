# Shadow Bean Co - Specialty Coffee E-Commerce

## Architecture (Pure AWS)

| Service | AWS Resource |
|---------|-------------|
| Auth | Cognito (Google OAuth + email/password) |
| Database | Aurora PostgreSQL Serverless v2 (Data API) |
| API | Lambda + API Gateway (api.shadowbeanco.net) |
| Media/CDN | S3 + CloudFront (media.shadowbeanco.net) |
| Customer Site | Amplify Hosting (shadowbeanco.net) |
| Admin Panel | Amplify Hosting (admin-shadowbeanco.com) |
| Payments | Razorpay |
| Shipping | Shiprocket |

## Project Structure

### `customer-web/` - Customer Website (React/Vite)
- Shop, Cart, Checkout, Profile, About pages
- Deployed via Amplify to **shadowbeanco.net**
- Run: `cd customer-web && npm run dev`

### `admin-panel/` - Admin Dashboard (React/Vite)
- Orders, Products, Pricing, Media, Users management
- Deployed via Amplify to **admin-shadowbeanco.com**
- Run: `cd admin-panel && npm run dev`

### `mobile-app/` - Mobile App (React Native/Expo)
- Android/iOS native app
- Run: `cd mobile-app && npx expo start`

### `web-app/` - Expo Web (React Native Web)
- Web version of mobile app
- Run: `cd web-app && npx expo start --web`

### `lambda/api/` - Serverless API
- Node.js Lambda handler for all API endpoints
- Deployed to **api.shadowbeanco.net**

### `terraform/` - Infrastructure as Code
- All AWS resources defined in Terraform

### `database/` - Database Schema
- `rds_schema.sql` - PostgreSQL schema (12 tables)

---
**Region**: ap-south-1 (Mumbai) | **Domain**: shadowbeanco.net
