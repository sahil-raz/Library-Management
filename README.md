# 📱 Production-Ready Multi-Library Management SaaS

A complete, production-ready, mobile-first **Multi-Library & Study Center Management SaaS** platform engineered to behave and feel like a premium native iOS application (designed around a 430px mobile viewport, safe-area insets, fluid spring micro-interactions, ReactBits components, bottom navigation, bottom sheets, and PWA/Android APK readiness).

---

## 🌟 Key Features

### 1. Multi-Tenant Role-Based Architecture
- **Super Admin (Platform Owner)**:
  - Global overview metrics: Revenue, Total/Active Admins, Managers, Patrons, Branches, Pending/Approved Payments.
  - Organization inspection: 10 dedicated tabs per library (Profile, Subscription & Limits, Payments, Branches, Managers, Users, Plans, Seats, Expenses, Audit Trail).
  - SaaS Plan Creator (`/plan-creator`): Custom quotas, pricing, Days/Months/Years validity switch, and dynamic feature chips.
  - Payment Review (`/admin-payments`): Approve or reject library subscription purchases with UTR & screenshot verification.
  - Platform Payment Gateway: Configure Super Admin UPI ID, QR code upload, and payment instructions.
  - Platform Security Audit Trail: Full system activity logs.
  - Initial Super Admin auto-created on first startup with forced password change on first login.

- **Admin (Library / Study Hall Owner)**:
  - Library Dashboard: Live SaaS quota utilization progress bars (Branches, Managers, Users, Seats, Messages, Queue).
  - SaaS Plan Purchase: Browse platform plans, pay via Super Admin UPI/QR, submit 12-digit UTR and payment screenshot.
  - Branch Management: Multi-branch creation strictly enforced by purchased SaaS plan limits.
  - Staff Manager Management: Assign staff strictly to ONE branch with customizable boolean permission flags (`users_view`, `users_create`, `seats_view`, `seats_assign`, `queue_manage`, `expenses_manage`, `reminders_send`, `dashboard_view`, etc.).
  - Student Membership Plans: Create custom patron subscription tiers (Days, Months, Years).
  - Seat Management: Visual desk cards, auto-expiring seat reservations, assign/release seats.
  - Student / Patron Management: Manage student list, entry statuses (`NONE`, `QUEUE`, `ACTIVE`, `EXPIRED`, `SUSPENDED`).
  - Waiting Queue System: Direct entry queue with priority ranking and 1-tap promotion to active seat status.
  - Branch Expense Tracker: Track electric, internet, water, and maintenance expenses per branch.
  - Student Fee Verification: Approve or reject patron fee payments via UPI.
  - Library Payment Gateway: Configure library-specific UPI ID and QR code for student fees.
  - WhatsApp Reminders: Dynamic personalized `https://wa.me/{number}?text=...` generation with automated tracking for **2 days before expiry** and **on expiry day**.
  - Organization Audit Logs: Tenant-scoped audit trail.

- **Manager (Branch Staff)**:
  - Strictly scoped to their single assigned branch (`branchId`).
  - Cannot access other branches, settings, or tenant configurations.
  - Only features permitted by the library admin are displayed and accessible.
  - Branch operations: View branch patrons, register walk-in students, assign desks, manage waiting queue, and log utility expenses.

- **User (Student / Library Patron)**:
  - Public registration at `/api/public/register` with library and branch selection.
  - Personal Study Pass: Plan name, active seat number, expiration date, and countdown of days remaining.
  - Desk Allocation: Allocated desk details, branch operating hours, and address.
  - Fee Payment: Browse library plans, pay via UPI/QR, and submit UTR for instant admin review.
  - In-app Notification Center: Alerts on fee approvals, seat allocations, and renewal reminders.
  - Account Profile: Password change and emergency contact management.

---

## 🛠️ Technology Stack

- **Frontend**:
  - React 18 + TypeScript + Vite
  - Tailwind CSS + Apple System Design Tokens
  - Framer Motion + ReactBits Micro-Interactions (`SpotlightCard`, `AnimatedCounter`, `ShinyText`, `ShimmerButton`, `PulseBadge`, `IOSToggle`, `SegmentedControl`, `BottomSheet`, `SkeletonLoader`)
  - Lucide Icons
  - Mobile-First Architecture (Centered 430px frame with safe area insets)
  - PWA Web App Manifest for Android APK packaging

- **Backend**:
  - Node.js + Express + TypeScript
  - MongoDB + Mongoose with compound indexes and reference integrity
  - JWT Authentication + Bcrypt password hashing
  - Server-side multi-tenant isolation (`adminId` and `branchId` scoping)
  - Server-side subscription quota middleware (`checkPlanLimit`)
  - Server-side subscription & seat auto-expiry verification + background worker
  - Helmet, CORS, Rate Limiting, Central Error Handling, and Zod input validation
  - Multer upload validation (MIME checking, random safe filenames, size limits)

---

## 🚀 Quick Start & Deployment

### 1. Environment Configuration
The system only requires setting `MONGODB_URI`. Everything else has sensible production defaults.

Create `.env` in the root:
```env
# REQUIRED: Your MongoDB connection string (e.g. MongoDB Atlas or local MongoDB)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/libr_saas?retryWrites=true&w=majority

# Optional settings (defaults provided):
PORT=5000
JWT_SECRET=production_super_secret_jwt_key_libr_saas_2026
SUPERADMIN_EMAIL=owner@example.com
SUPERADMIN_PASSWORD=ChangeThisImmediately
SUPERADMIN_NAME=Platform Owner
CLIENT_URL=http://localhost:5000
```

### 2. Install Dependencies
```bash
# Install all dependencies in one command:
npm install
```

### 3. Run Development Server
Both backend API and React frontend run together on a **single server and port** (default: `5000`) with full Vite HMR and zero concurrently:
```bash
npm run dev
```
Open **`http://localhost:5000`** in your browser.

### 4. Build & Production Start
```bash
# Production Build (Vite Client + Server TypeScript):
npm run build

# Start Production Server (Serves API + Client SPA from single port 5000):
npm start
```

### 5. Run Automated Sanity Tests
```bash
npm test
```

---

## 🔑 Default Credentials & First-Run Initialization

On first startup, the server automatically connects to MongoDB, syncs indexes, and creates:
1. **Default Super Admin**:
   - **Email**: `owner@example.com` (or value of `SUPERADMIN_EMAIL`)
   - **Password**: `ChangeThisImmediately` (or value of `SUPERADMIN_PASSWORD`)
   - *Security*: The Super Admin is flagged with `mustChangePassword: true` on first login.
2. **Default Super Admin Payment Config**: Initialized with default UPI details.
3. **Starter SaaS Plans**: Starter, Growth Pro, and Enterprise tiers created automatically so new library owners can immediately subscribe.

---

## 🔒 Security Architecture

1. **Multi-Tenant Isolation**:
   - Every library query and mutation is strictly scoped by `adminId` on the server.
   - Staff managers are additionally scoped to their assigned `branchId`.
   - Never trusts client-supplied tenant identifiers.
2. **Server-Side Quota Enforcement**:
   - Creating branches, managers, users, seats, or queue entries calls `checkPlanLimit(adminId, resource)`.
   - If exceeded, returns structured JSON:
     ```json
     {
       "success": false,
       "code": "PLAN_LIMIT_REACHED",
       "message": "Maximum branch limit reached for your plan."
     }
     ```
3. **Granular Staff Permissions**:
   - Staff managers cannot perform actions without explicit boolean permissions (`users_view`, `users_create`, `seats_assign`, etc.).
4. **Audit Logging**:
   - System and organization events (`LOGIN`, `LOGOUT`, `PAYMENT_APPROVED`, `SEAT_ASSIGNED`, etc.) are recorded with actor, IP, timestamp, and metadata.

---

## 📱 Mobile APK / PWA Preparation

The frontend is intentionally designed for mobile viewports with:
- `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />`
- Apple Touch & PWA manifest in `client/public/manifest.json`.
- CSS safe-area insets (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`).
- Touch target sizing and spring micro-interactions.
- To package into an Android APK, open the project in **Capacitor**, **Cordova**, or wrap the production URL inside an Android WebView.

---

## 📄 License
ISC License. Built for production scale.
