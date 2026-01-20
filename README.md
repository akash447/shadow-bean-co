# Shadow Bean Co - Project Structure

This project has been separated into independent environments to ensure stability.

## 📂 Folders

### 1. `web-app/` (Web Only)
The Customer-facing website (Shop, Cart, Profile).
- **Config**: Firebase v10 (Stable for Web), Metro Web Support.
- **Run**: `cd web-app` then `npm run web` (or `npx expo start --web`).
- **Port**: 8098 (Default).

### 2. `mobile-app/` (Native Only)
The Android/iOS Application.
- **Config**: Optimized for Native Builds (Firebase v12+ allowed).
- **Run**: `cd mobile-app` then `npm run android` / `npm run ios`.

### 3. `admin-panel/` (Admin Dashboard)
The internal tool for managing orders and products.
- **Run**: `cd admin-panel` then `npm run dev`.

---
**Note**: Shared code must be manually synced or moved to a shared package in the future.
