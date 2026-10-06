# FleetTrack ⚓
### Naval Administrative Budget Management System

A production-quality, centralized annual budget management platform designed for naval administrative command units, built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM**.

The system enables headquarters command to allocate annual budget ceilings across commissioned personnel, while officers track, manage, and submit expenditure vouchers within authorized allocations. All calculations are executed authoritatively on the server and use **integer minor units (Paisa: 1 BDT = 100 Paisa)** to eliminate floating-point rounding inaccuracies.

---

## Key Highlights

- **Currency**: Bangladeshi Taka (`৳` / `BDT`) with localized formatting (`৳10,00,000` / `৳1,00,000`).
- **Precision Accounting**: Safe monetary storage in minor units (`BigInt` / integer Paisa).
- **Role-Based Access Control (RBAC)**:
  - **`ADMIN`**: Command-level oversight, financial year definitions, user enrolment, allocation adjustments with audit directives, organization analytics, and voucher approvals.
  - **`PERSONNEL`**: Personal operational budget tracking, voucher submissions, responsive table/cards view, and itemized audit statements.
- **Visual Budget Progress Ring**: Multi-segment SVG progress indicator distinguishing Spent, Pending, and Remaining funds with contextual status levels (*Healthy*, *Moderate*, *Approaching Limit*, *Critical*, *Exceeded*).
- **Data Visualizations**: Recharts-powered monthly spending trajectories, category breakdowns, organization budget utilization bars, and utilization distribution histograms.
- **Audit Ledger**: Immutable database audit log tracking all allocation amendments, voucher lifecycle events, and account status updates.
- **Mobile-First UX**: Responsive layouts that switch seamlessly from desktop tables to touch-optimized mobile transaction cards and navigation drawers.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript (ES2022)
- **Styling**: Tailwind CSS v4 & custom design tokens
- **Icons**: Lucide Icons
- **Database & ORM**: Prisma ORM with SQLite (zero-config local persistence) and PostgreSQL compatibility
- **Charts**: Recharts
- **Validation**: Zod & React Hook Form
- **Auth**: HMAC-SHA256 encrypted JWT HTTP-only session cookies & bcrypt password hashing

---

## Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node 22/24)
- npm

### 2. Installation & Setup

```bash
# Clone the repository
git clone https://github.com/NahianBinRahman/fleettrack.git
cd fleettrack

# Install dependencies
npm install

# Initialize database schema
npm run db:push

# Seed realistic naval personnel, allocations, and vouchers
npm run db:seed
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the assigned port) in your browser.

---

## Demo Accounts

The database comes pre-seeded with 20 commissioned officers, 3 financial years (`2025 Closed`, `2026 Active`, `2027 Draft`), and 119 realistic expenditures across various budget utilization levels. The login portal features **1-click login buttons** for instant testing:

| Role / Scenario | Officer Name | Email | Password | Seeded Utilization |
| :--- | :--- | :--- | :--- | :--- |
| **HQ Admin** | Commodore K. M. Tariqul Islam, ndc, psc | `admin@fleettrack.mil.bd` | `password123` | Full Organization Command |
| **Over Budget** | Lt Cdr Sadia Rahman, BN | `sadia.rahman@fleettrack.mil.bd` | `password123` | **105.0%** (Exceeded Limit) |
| **Near Limit** | Commander Faisal Ahmed, psc, BN | `faisal.ahmed@fleettrack.mil.bd` | `password123` | **96.0%** (Critical) |
| **Approaching** | Lt Cdr Hasan Mahmud, BN | `hasan.mahmud@fleettrack.mil.bd` | `password123` | **88.0%** (Approaching Limit) |
| **Healthy** | Sub-Lieutenant Asif Al-Mamun, BN | `asif.mamun@fleettrack.mil.bd` | `password123` | **25.0%** (Healthy) |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/        # Secure official sign-in portal
│   ├── (personnel)/         # Officer portal (Dashboard, My Budget, Expenses, Reports, Profile)
│   ├── admin/               # HQ Command (Overview, Personnel, Expenses, FYs, Reports, Audit Log, Settings)
│   ├── actions/             # Server Actions (auth, expenses, admin)
│   └── globals.css          # Design tokens & naval theme styling
├── components/
│   ├── admin/               # Personnel management tables, budget adjust modal, audit viewer
│   ├── budget/              # Progress ring, stat cards, utilization bar, status badges, alerts
│   ├── charts/              # Recharts monthly velocity, category donut, org comparison charts
│   ├── expenses/            # Dual-view expense table, voucher detail drawer, form with live budget context
│   ├── shared/              # Sidebar, MobileNav, PageHeader, ConfirmDialog, FY selector
│   └── ui/                  # Reusable button, card, badge, input, textarea
├── lib/
│   ├── auth.ts              # JWT session handling & server-side authorization
│   ├── audit.ts             # Centralized audit logging engine
│   ├── db.ts                # Prisma client singleton
│   ├── money.ts             # Authoritative BDT formatting & minor-unit calculations
│   └── utils.ts             # Class merging helper
└── prisma/
    ├── schema.prisma        # Relational database schema
    └── seed.ts              # Seeding script with realistic naval data
```

---

## License

This project is licensed under the MIT License.
