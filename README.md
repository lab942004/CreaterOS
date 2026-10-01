# CreatorOS — "Your AI Operating System for Content."

CreatorOS is an enterprise-grade, all-in-one operating platform engineered for content creators, media studios, and autonomous solopreneurs. It unites analytics intelligence, social media management, multimodal video editing, content repurposing, AI strategy synthesis, scheduling, and creator CRM into a single unified workspace.

---

## 🚀 Key Architectural Highlights

- **Frontend (`/frontend`)**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts.
- **Backend (`/backend`)**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL schema, modular service architecture.
- **Separate Admin Console (`/admin`)**: Fully decoupled administrative portal for workspace management, feature flags, AI token tracking, and system health telemetry.
- **Social Integration Adapter Layer**: Pluggable `SocialPlatformAdapter` with built-in OAuth support and high-fidelity Mock Mode for YouTube, Instagram, TikTok, LinkedIn, and X.
- **AI Operating Intelligence**: Provider abstraction with contextual memory injection from Creator Brain, Hook DNA sequencing, and autonomous terminal execution.
- **Video Lab & Repurpose Engine**: Integrated speech transcription, highlight detection, viral clip extraction, and platform-specific format translation.

---

## 📦 Project Structure

```
CreaterOS/
│
├── frontend/             # Creator application (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/   # Layout, Sidebar, MobileNav
│   │   ├── pages/        # 40+ Creator screens (Dashboard, Analytics, DNA, Composer, Video Lab...)
│   │   ├── services/     # Modular API clients (apiCore, apiPublishing, apiSystem)
│   │   └── ...
│
├── backend/              # Production API service (Express + TypeScript + Prisma)
│   ├── prisma/           # schema.prisma (Normalized relational models)
│   ├── src/
│   │   ├── ai/           # AI Provider Abstraction
│   │   ├── integrations/ # SocialPlatformAdapter architecture
│   │   ├── routes/       # Auth, Dashboard, Content, Video Lab, Autopilot, Brand...
│   │   ├── utils/        # Persistent mock database with demo datasets
│   │   └── ...
│
├── admin/                # Decoupled Admin Portal (React + Vite)
│   ├── src/
│   │   ├── components/   # Admin Layout & Telemetry
│   │   ├── pages/        # Dashboard, Users, Workspaces, Health, AI Usage, Flags...
│   │   └── services/     # adminApi client
│
├── docker-compose.yml    # Containerized multi-service deployment
├── .env.example          # Environment variable specifications
└── README.md
```

---

## 🛠️ Quickstart Installation & Execution

### 1. Start the Backend API (Port 5000)
```bash
cd backend
npm install
npm run build
node dist/index.js
```
The backend includes a health check at `http://localhost:5000/api/health`.

### 2. Start the Creator Frontend (Port 3000)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
Default Creator Login:
- Email: `creator@creatoros.ai`
- Password: `CreatorOS@2026`

### 3. Start the Dedicated Admin Portal (Port 3001)
```bash
cd admin
npm install
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) in your browser.
Default Admin Login:
- Email: `admin@creatoros.ai`
- Password: `CreatorOS@2026`

---

## 🧪 Verification & Automated Testing

Run the automated validation test suite:
```bash
cd backend
npx ts-node src/tests.ts
```
Expected output:
```
🧪 Starting CreatorOS Verification Test Suite...
1. Checking Store Models & Seed Data: ✓ verified
2. Checking AI Provider Subsystem: ✓ verified
3. Checking Social Platform Adapter Factory: ✓ verified
🎉 ALL CREATOROS TEST SUITES PASSED CLEANLY (100% SUCCESS).
```

---

## 🌐 Supported Screen Catalog

### Creator OS Platform
1. **Landing Page** (`/`)
2. **Login & Auth** (`/login`, `/register`, `/forgot-password`)
3. **Onboarding Wizard** (`/onboarding`) — 7-step profile, category, platform, and voice setup
4. **Dashboard Command Center** (`/dashboard`)
5. **Analytics Intelligence** (`/analytics`, `/analytics/platforms`)
6. **Content Management** (`/content`, `/content/:id`, `/content/:id/dna`)
7. **Ideas & Opportunities** (`/ideas`, `/opportunities`)
8. **AI Workspace** (`/ai/strategist`, `/ai/my-content`, `/ai/command-center`)
9. **Creation & Studio** (`/calendar`, `/composer`, `/create`, `/scripts`)
10. **Video Lab & Repurposing** (`/video-lab`, `/thumbnails`)
11. **Audience & Community** (`/audience`, `/comments`, `/trends`, `/benchmark`)
12. **Automation & Operations** (`/scheduler`, `/publishing`, `/autopilot`)
13. **Brand & Business** (`/creator-brain`, `/memory`, `/brand-kit`, `/revenue`, `/brand-deals`, `/campaigns`, `/team`, `/reports`)
14. **System & Security** (`/notifications`, `/settings`, `/security`)

### Separate Admin Application
1. **Admin Login** (`/login`)
2. **Admin Command Dashboard** (`/dashboard`)
3. **Creator Users** (`/users`)
4. **Workspaces** (`/workspaces`)
5. **Platform Health & Latency** (`/health`)
6. **Job Monitor** (`/jobs`)
7. **AI Usage & Token Billing** (`/ai-usage`)
8. **Cloud Media Storage** (`/storage`)
9. **Feature Flags** (`/feature-flags`)
10. **Security Audit Logs** (`/audit-logs`)

