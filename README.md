# Ministry of Tribal Affairs (MoTA) — Unified ST Scholarship Mobile Platform

A complete, production-ready, full-stack mobile platform addressing the Ministry of Tribal Affairs (MoTA) Smart India Hackathon problem statement: consolidating **5 scholarship schemes** scattered across **3 disconnected portals** into a unified, mobile-first experience powered by Smart Automated Verification and MoTA's **JAGO AI** conversational skill.

---

## 🏛️ Schemes & Portals Unified

| Scheme Name | Source Portal | Target Audience | Income Ceiling | Key Benefits |
| :--- | :--- | :--- | :--- | :--- |
| **Pre-Matric ST** | National Scholarship Portal (NSP) | Class IX & X | ₹2,50,000 | ₹3,500/yr (Day) / ₹7,000/yr (Hostel) + Book grant |
| **Post-Matric ST** | National Scholarship Portal (NSP) | Class XI to PhD | ₹2,50,000 | Tuition reimbursement + Maintenance up to ₹13,500/yr |
| **Top Class ST** | National Scholarship Portal (NSP) | Premier Institutes (IIT/IIM/AIIMS) | ₹6,000,000 | Full tuition + ₹3,000/mo living + Laptop grant |
| **NFST Fellowship** | SFMP (Canara Bank) | M.Phil / PhD (NET/JRF) | No Ceiling | JRF ₹37,000/mo, SRF ₹42,000/mo + ₹20,500 Contingency |
| **National Overseas (NOS)** | Standalone NOS Portal | Master's & PhD Abroad | ₹6,000,000 | Full tuition + £9,900 (UK) / $15,400 (US) + Airfare |

---

## 🚀 Key Architectural Highlights

1. **Unified Identity Resolution (OTR)**: Uses the Aadhaar-linked **14-digit One-Time Registration (OTR)** as the primary key connecting disparate vendor application IDs.
2. **Adapter Architecture**: Decoupled connectors (`NspAdapter`, `SfmpAdapter`, `NosAdapter`, `DigiLockerAdapter`, `RegistryAdapter`) normalize varied portal data into a canonical schema.
3. **One-Scheme Active Enforcement**: Real-time validation preventing double dipping across multiple schemes in the same academic cycle.
4. **Digital Document Wallet (DigiLocker Reusability)**: Simulates official DigiLocker OAuth2 consent flow and cryptographically signed certificates. Fetch once $\rightarrow$ reuse across all 5 schemes without re-uploading.
5. **Smart Verification & Manual Review Queue**:
   - Computes weighted confidence scores ($0-100\%$) using Jaro-Winkler string similarity.
   - $\ge 90\% \rightarrow$ **Auto-Verified** without human delay.
   - $< 90\% \rightarrow$ **Routed to Officer Manual Review Queue** with side-by-side mismatch comparison (never hard-blocked or rejected on typo).
6. **JAGO AI Conversational Assistant**:
   - MoTA's conversational assistant skill querying the student's **live database record**.
   - **5 Supported Languages**: English, Hindi (हिन्दी), Tamil (தமிழ்), Assamese (অসমীয়া), and Bihari / Bhojpuri (बिहारी / भोजपुरी) with native script auto-detection and conversational prompt chips.
   - Generates contextual answers for disbursements, timelines, deficiencies, and deep-link actions.
7. **Coverage Gap Analytics & Outreach**:
   - Cross-references enrolled ST students in UDISE+ and AISHE against active scholarship claims to identify unreached beneficiaries.
   - Multi-channel proactive broadcast nudge trigger.

---

## 📁 Repository Structure

```
d:/Tribal/
├── backend/                        # Node.js / Express REST Backend
│   ├── src/
│   │   ├── config/                 # SQLite connection & Promise query helpers
│   │   ├── controllers/            # Auth, Applications, Documents, JAGO, Admin, Notifications
│   │   ├── database/               # DDL schema, initDb, and rich seed script
│   │   ├── middleware/             # JWT Auth, Officer RBAC, validation
│   │   ├── routes/                 # Express API router
│   │   ├── services/
│   │   │   ├── adapters/           # NSP, SFMP, NOS, DigiLocker, Registry Adapters
│   │   │   ├── VerificationEngine.js # Jaro-Winkler fuzzy matching & rules engine
│   │   │   ├── JagoService.js      # Conversational NLU & live student context skill
│   │   │   └── OutreachService.js  # Coverage gap set-difference analytics
│   │   └── server.js               # Server entry point
│   ├── tests/
│   │   └── api.test.js             # 9-Suite Automated Integration Test Runner
│   ├── package.json
│   └── .env.example
│
└── mobile/                         # React Native / Expo Mobile Application
    ├── src/
    │   ├── api/                    # Dynamic Axios client with interceptors
    │   ├── components/             # Header, StageTimeline, DbtCard, DeficiencyBanner, DocumentCard
    │   ├── context/                # AuthContext with 1-tap Demo Persona Switcher
    │   ├── navigation/             # RootNavigator, StudentTabs, OfficerTabs
    │   ├── screens/
    │   │   ├── auth/               # LoginScreen, RegisterScreen (with 14-digit OTR gen)
    │   │   ├── student/            # Dashboard, Detail, Apply, Wallet, JAGO AI, Notifs, Profile
    │   │   └── admin/              # ReviewQueue (Diffs), CoverageGap (Outreach)
    │   └── theme/                  # MoTA National Branding Color Palette
    ├── App.js                      # Root app wrapper
    ├── app.json                    # Expo configuration
    ├── package.json
    └── .env.example
```

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Start the Backend API
```bash
cd d:/Tribal/backend

# Install dependencies (already installed)
npm install

# Initialize and seed database with rich sample data
npm run seed

# Run the automated API test suite (Verifies all 9 components)
npm test

# Start the Backend Server (runs on http://localhost:5000)
npm start
```

### 2. Start the Mobile Application
```bash
cd d:/Tribal/mobile

# Start Expo development server
npm start

# For Web Preview (Instant in browser):
npm run web

# For Android:
npm run android
```

---

## 👥 Pre-Configured Demo Accounts (1-Tap Switcher)

The mobile login screen includes an **Instant Demo Switcher** so evaluators and judges can test every workflow with a single tap:

1. **Sunita Soren** (`Student - Post-Matric`):
   - OTR: `20268839201941` | Password: `Student@123`
   - Active Post-Matric application at **District Verification** stage, ₹18,500 sanctioned, with an expired income certificate deficiency alert.
2. **Rajesh Kumar Munda** (`Student - Pre-Matric Disbursed`):
   - OTR: `20267711442290` | Password: `Student@123`
   - Pre-Matric completed & **₹7,000 DBT Disbursed** to Bank of India account with PFMS UTR.
3. **Anjali Kerketta** (`Student - NFST Fellowship`):
   - OTR: `20265533119933` | Password: `Student@123`
   - Ph.D. scholar with application routed to Officer Review Queue due to name variance.
4. **Dr. Ramesh Chandra Meena** (`MoTA Nodal Officer`):
   - Email: `officer@mota.gov.in` | Password: `Officer@123`
   - Nodal Officer access to the **Manual Review Queue** and **Coverage Gap Analytics**.
