# 🚿 Washio Admin Dashboard — Parallel Development Version

This is a **parallel development clone** of the Washio admin dashboard originally built by WebMedia. It's designed for **independent development and testing** while the original version remains unchanged.

## 🎯 Purpose

- **Parallel Development**: Work on admin features independently from WebMedia's version
- **Real-time Data Sync**: Both admin dashboards connect to the **same backend** and **same MongoDB**
- **A/B Testing**: Compare approaches and development speed between this version and the original
- **Zero Coupling**: Changes here don't affect the original WebMedia repo

## 🏗️ Architecture

```
┌────────────────────┐
│   Mobile App       │
│   (Expo/RN)        │
└─────────┬──────────┘
          │ (API calls)
          ↓
┌────────────────────┐
│  FastAPI Backend   │
│  MongoDB ←────┐    │
└────────────────────┘
               │
         ┌─────┴─────┐
         ↓           ↓
    ┌─────────┐  ┌─────────┐
    │ Admin   │  │ Admin   │
    │ v1      │  │ v2      │
    │WebMedia │  │JARVIS   │
    └─────────┘  └─────────┘
```

**Both admins** read/write to the **same MongoDB**:
- Admin v1 (WebMedia): `https://washio-admin.vercel.app`
- Admin v2 (JARVIS): `https://washio-admin-parallel.vercel.app`

When a mobile app user creates an order → **both admins see it immediately**.

## 🚀 Quick Start

### Local Development
```bash
npm install
npm run dev
```

Visit: `http://localhost:5173`

Environment: Uses `http://localhost:8000` backend (local dev)

### Production Deployment

#### On Vercel
```bash
# Option 1: Via CLI
npm install -g vercel
vercel deploy --prod

# Option 2: Via Vercel Dashboard
# 1. Push to GitHub
# 2. Go to https://vercel.com/new
# 3. Import this repo
# 4. Set env var: VITE_API_URL=https://api.washio.com
# 5. Deploy
```

#### Environment Variables

For production Vercel deployment, set:
```
VITE_API_URL=https://api.washio.com
```

For local dev, edit `.env.local`:
```
VITE_API_URL=http://localhost:8000
```

## 📊 Features

- **Users** (customer lifecycle visibility)
  - View customer activity derived from the admin orders feed
  - Search users by phone number
  - See approximate registration date, last order, order count, total spend, cars seen in orders, and deleted-account flags
  - See the limitation below: registered users with no orders are not shown because the backend does not expose an admin user-list endpoint

- **Orders Management**
  - List all orders with real-time status
  - View order details (photos, customer info, courier assignment)
  - Change order status
  - Assign courier
  - Upload payment link
  - Edit order details (location, price, car info)
  - Cancel orders
  - Archive completed orders

- **Courier Management**
  - List all couriers
  - Create new courier
  - Edit courier details
  - Deactivate couriers

- **Settings**
  - View/update service price
  - Language toggle (RU/KA)

- **Admin Management**
  - Create/edit/delete admin accounts
  - Manage user access

- **Multi-language Support**
  - Russian (RU)
  - Georgian (KA)

## 🔄 Real-Time Sync Testing

1. **Login to both admins** simultaneously
2. **Create an order** in the mobile app
3. **Refresh both admin dashboards** → same order appears in both
4. **Change status in Admin v1** → order reflects change
5. **Check Admin v2** → status updated (may need refresh)

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite + TypeScript
- **UI**: Tailwind CSS + Lucide Icons
- **API Client**: Axios
- **Routing**: React Router DOM v7
- **Date**: date-fns
- **Tests**: Vitest

## ✅ Verification

```bash
npm test
npm run build
```

## 📁 Project Structure

```
├── src/
│   ├── api/           # API client (connects to backend)
│   ├── pages/         # Main pages (Login, Dashboard, Orders, etc)
│   ├── components/    # Reusable components
│   ├── context/       # Auth context
│   ├── i18n/          # Translations (RU/KA)
│   ├── constants/     # Constants (order statuses)
│   ├── utils/         # Utility functions
│   └── App.tsx        # Main app component
├── public/            # Static assets
├── dist/              # Build output (Vercel deploys this)
├── vercel.json        # Vercel deployment config
└── package.json       # Dependencies
```

## 🔐 Authentication

- **Login**: Username + Password (admin account)
- **Session**: JWT token stored in localStorage
- **Auto-refresh**: Token refreshes on 401 response

### Test Admin Credentials
```
Username: admin
Password: admin123
```

## ⚠️ Important Notes

### Differences from Original
- Simplified TypeScript config (no composite)
- Environment variables for API URL
- Vercel deployment ready
- Independent Git history

### Data Consistency
Both admin versions are **100% read/write synchronized** with the backend:
- Same MongoDB database
- Same FastAPI backend
- Real-time sync (may need page refresh for immediate updates)

### Not Modified in Original
The source code in `washio-mobile-app/admin-web` remains **untouched**. This is a clean clone for parallel development. The shared FastAPI backend (`washio-mobile-app/backend`) was **not modified** either — the Users section is built entirely from the existing `GET /orders` response.

### Users section — known limitations (by design)
The backend exposes **no admin endpoint** that lists customer accounts (`db.users`). The Users page is therefore reconstructed by aggregating the orders feed, which means:
- **Registered-but-never-ordered users are invisible.** A user who completed OTP registration but never placed an order leaves no trace in the orders feed.
- **Registration date is approximate** — it shows the customer's *first order* time, not the true `created_at` on the (unexposed) user document.
- **Cars are derived from orders**, not from the user's saved garage (`db.cars`, also unexposed).
- **Deleted accounts** are detected via the `user_deleted` flag the backend stamps on a user's orders during account deletion. A deleted user with zero orders leaves no trace at all.

Removing these limitations would require a new backend admin endpoint (e.g. `GET /admin/users`), which is intentionally **out of scope** here to avoid modifying the shared backend.

## 📝 Deployment Checklist

- [ ] GitHub repo created
- [ ] Vercel project created
- [ ] Environment variable `VITE_API_URL` set to production backend
- [ ] Both admins tested with real mobile app orders
- [ ] Status/courier changes sync between admins
- [ ] Auto-refresh every 10 seconds working

## 🤝 Development Workflow

1. Create feature branches for new features
2. Test with real mobile app data
3. Compare implementation with WebMedia version
4. Deploy to Vercel when ready
5. Monitor real-time sync with original admin

## 📞 Support

For questions about this parallel version, refer to:
- `DEPLOYMENT.md` — Detailed deployment guide
- Original repo: `washio-mobile-app/admin-web`
- Backend API docs: `https://api.washio.com/docs` (if available)

---

**Built for independent, parallel development of the Washio admin dashboard.**
