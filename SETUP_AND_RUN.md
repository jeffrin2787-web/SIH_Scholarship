# MoTA Unified ST Scholarship Platform — Complete Setup & Run Guide

This document provides step-by-step instructions for installing dependencies, configuring environment variables, running the backend, running the mobile application, executing automated tests, and building the production Android APK/AAB.

---

## 1. Project Overview
The Ministry of Tribal Affairs (MoTA) runs **5 scholarship schemes** for Scheduled Tribe (ST) students:
1. **Pre-Matric** (Class IX–X)
2. **Post-Matric** (Class XI through PhD)
3. **Top Class Education** (Notified Premier Institutes)
4. **National Fellowship (NFST)** (M.Phil / PhD research)
5. **National Overseas Scholarship (NOS)** (Master’s / PhD abroad)

These schemes were historically scattered across **3 separate portals**:
- National Scholarship Portal (NSP)
- SFMP Portal (Canara Bank)
- Standalone NOS Portal

This project unifies all 5 schemes into a **single, mobile-first application** backed by an **Adapter Architecture**, an automated **Smart Verification Engine**, a **DigiLocker Reusable Document Wallet**, an authenticated **JAGO AI Conversational Skill**, and a **Coverage Gap Outreach Engine**.

---

## 2. Technologies Used

### Backend Subsystem
- **Runtime**: Node.js (v18+ or v24+)
- **Framework**: Express.js (REST API, CORS, JSON Body Parser)
- **Database**: SQLite3 (Embedded relational storage, ACID compliant, zero external setup)
- **Security**: JSON Web Tokens (JWT) for session management, BCrypt for password hashing
- **Algorithms**: Jaro-Winkler string similarity for demographic fuzzy matching
- **Testing**: Built-in HTTP integration test runner (`tests/api.test.js`)

### Mobile Frontend Subsystem
- **Framework**: React Native + Expo (v52)
- **Navigation**: React Navigation (Native Stack + Bottom Tabs)
- **HTTP Client**: Axios with request/response interceptors & dynamic host resolution
- **Design System**: India Stack & MoTA National Branding (MoTA Forest Green `#1B4D3E`, National Saffron `#FF9933`, Surface Slate `#F8FAFC`)
- **Compatibility**: Android, iOS (via Expo Go / prebuild), and Web Browser preview (via React Native Web & Metro)

---

## 3. Complete Folder Structure

```
d:/Tribal/
├── README.md                           # Main Project Overview & Architecture
├── SETUP_AND_RUN.md                    # Exhaustive Setup, Execution, and Build Guide
│
├── backend/                            # REST API & Business Logic Layer
│   ├── package.json                    # Backend dependencies & scripts
│   ├── .env                            # Active environment configuration
│   ├── .env.example                    # Template environment file
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                   # SQLite connection & Promise-based query helpers
│   │   ├── database/
│   │   │   ├── initDb.js               # Relational DDL table definitions
│   │   │   ├── seed.js                 # Rich ST demographic & scheme seed script
│   │   │   └── mota_scholarship.db     # SQLite database file
│   │   ├── middleware/
│   │   │   └── authMiddleware.js       # JWT validation & Officer RBAC guard
│   │   ├── services/
│   │   │   ├── adapters/
│   │   │   │   ├── NspAdapter.js       # NSP normalization adapter
│   │   │   │   ├── SfmpAdapter.js      # Canara Bank SFMP adapter
│   │   │   │   ├── NosAdapter.js       # Standalone NOS portal adapter
│   │   │   │   ├── DigiLockerAdapter.js# DigiLocker OAuth & API Setu connector
│   │   │   │   └── RegistryAdapter.js  # UIDAI, AISHE, UDISE+, UGC-NTA connector
│   │   │   ├── VerificationEngine.js   # Jaro-Winkler fuzzy matching & rules engine
│   │   │   ├── JagoService.js          # JAGO conversational AI skill with live DB lookups
│   │   │   └── OutreachService.js      # Coverage gap set-difference analytics
│   │   ├── controllers/
│   │   │   ├── authController.js       # OTR generation (14-digit) & authentication
│   │   │   ├── applicationController.js# Multi-scheme aggregation & one-scheme check
│   │   │   ├── documentController.js   # DigiLocker sync & document reusability
│   │   │   ├── jagoController.js       # Conversational AI endpoint
│   │   │   ├── adminController.js      # Manual review queue & outreach trigger
│   │   │   └── notificationController.js# Milestone alerts & notices
│   │   ├── routes/
│   │   │   └── api.js                  # Express API router (`/api/v1/*`)
│   │   └── server.js                   # Express server entry point
│   └── tests/
│       └── api.test.js                 # 9-Suite Automated Integration Test Runner
│
└── mobile/                             # Mobile Application Layer
    ├── package.json                    # Mobile dependencies & run scripts
    ├── app.json                        # Expo app metadata & configurations
    ├── .env                            # Mobile API base URL configuration
    ├── .env.example                    # Mobile template environment file
    ├── App.js                          # Root App wrapper (Providers & StatusBar)
    ├── index.js                        # Expo root component registration
    └── src/
        ├── api/
        │   └── client.js               # Axios instance with Android/Web IP resolution
        ├── theme/
        │   └── colors.js               # MoTA palette & design tokens
        ├── context/
        │   └── AuthContext.js          # Authentication state & 1-tap demo persona switcher
        ├── components/
        │   ├── Header.js               # MoTA branding header with unread badge
        │   ├── StageTimeline.js        # 5-stage visual progress stepper
        │   ├── DbtCard.js              # Direct Benefit Transfer card with UTR
        │   ├── DeficiencyBanner.js     # Actionable alert banner for flagged items
        │   └── DocumentCard.js         # DigiLocker verified certificate card
        ├── navigation/
        │   └── RootNavigator.js        # Navigation container (Auth, Student, Officer)
        └── screens/
            ├── auth/
            │   ├── LoginScreen.js      # Sign-in with 1-tap quick demo accounts
            │   └── RegisterScreen.js   # ST student onboarding (14-digit OTR issue)
            ├── student/
            │   ├── DashboardScreen.js  # 5-scheme unified tracking & DBT cards
            │   ├── ApplicationDetailScreen.js # Full stage timeline & audit log
            │   ├── ApplySchemeScreen.js# Scheme browser with one-scheme check
            │   ├── DocumentWalletScreen.js # DigiLocker consent modal & reusable vault
            │   ├── JagoChatScreen.js   # Multilingual JAGO AI chatbot
            │   ├── NotificationsScreen.js # Milestone tracking
            │   └── ProfileScreen.js    # 14-digit OTR card & NPCI bank status
            └── admin/
                ├── ReviewQueueScreen.js# Nodal desk side-by-side mismatch diffs
                └── CoverageGapScreen.js# UDISE+/AISHE gap analytics & outreach
```

---

## 4. Environment Variables Configuration

### Backend (`d:/Tribal/backend/.env`)
```ini
PORT=5000
JWT_SECRET=mota_tribal_scholarship_super_secret_jwt_key_2026
NODE_ENV=development
DB_PATH=./src/database/mota_scholarship.db
```

### Mobile App (`d:/Tribal/mobile/.env`)
```ini
# When testing in Browser / Web:
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1

# When testing on Android Emulator:
# EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api/v1

# When testing on a Physical Phone over Wi-Fi:
# EXPO_PUBLIC_API_URL=http://<YOUR_COMPUTER_LOCAL_IP>:5000/api/v1
```

---

## 5. How to Install Dependencies

Both folders have their dependencies already installed. If running on a new machine:

```bash
# 1. Install Backend Dependencies
cd d:/Tribal/backend
npm install

# 2. Install Mobile Frontend Dependencies
cd d:/Tribal/mobile
npm install
```

---

## 6. How to Run the Backend & Database

```bash
cd d:/Tribal/backend

# 1. Initialize schema and seed database with rich sample ST data
npm run seed

# 2. Start the Backend API Server
npm start
```

The backend starts on `http://localhost:5000`.
- Health Check: `http://localhost:5000/api/v1/health`
- Schemes Endpoint: `http://localhost:5000/api/v1/schemes`

---

## 7. How to Run Automated Backend Tests

The automated test runner starts an isolated server instance, seeds clean data, and executes 9 end-to-end integration tests:

```bash
cd d:/Tribal/backend
npm test
```

### Verified Test Cases:
1. `GET /health` $\rightarrow$ Confirms service is online.
2. `POST /auth/register` $\rightarrow$ Registers new student & validates issuance of a **14-digit OTR**.
3. `POST /auth/login` $\rightarrow$ Authenticates student with JWT token.
4. `GET /applications/my-applications` $\rightarrow$ Confirms unified normalization of applications across NSP, SFMP, and NOS.
5. `POST /applications/apply` $\rightarrow$ Validates that attempting to hold two active schemes concurrently returns **HTTP 409 Conflict (ONE_SCHEME_RESTRICTION)**.
6. `POST /wallet/sync-digilocker` $\rightarrow$ Validates OAuth consent exchange and cryptographic verification of 4 issued certificates.
7. `POST /jago/chat` $\rightarrow$ Validates JAGO AI assistant extracting live database status and responding contextually.
8. `POST /admin/review-queue/:id/decision` $\rightarrow$ Validates officer approving a name spelling exception without hard-blocking the application.
9. `GET /admin/coverage-gaps` $\rightarrow$ Validates calculation of unreached enrolled ST students from UDISE+/AISHE records.

---

## 8. How to Run the Mobile Application

```bash
cd d:/Tribal/mobile

# Option A: Instant Browser / Web Preview (Recommended for quick testing)
npm run web

# Option B: Run on Android Emulator or Physical Device via Expo Go
npm start
```

When you run `npm run web`, Expo starts the Metro bundler and opens the application in your default web browser at `http://localhost:8081`.

---

## 9. 1-Tap Evaluation (How to Test in 2 Minutes)

On the **Login Screen**, look at the bottom section labeled **"⚡ Quick Demo Switcher (Instant Evaluation)"**. Tap any card to test that specific persona immediately:

### Persona 1: Sunita Soren (Active Post-Matric Student)
- Tap **"1. Sunita Soren (Active Post-Matric)"**
- **Dashboard**: Observe Post-Matric application at **District Verification** stage, ₹18,500 sanctioned.
- **Deficiency Alert**: Notice the banner: *"Income Certificate Renewal Required for Next Academic Term"*. Tap **"Resolve Now"** $\rightarrow$ opens Document Wallet.
- **JAGO AI**: Tap **"Ask JAGO AI"** $\rightarrow$ Ask *"Where is my scholarship money?"* $\rightarrow$ JAGO replies with Sunita's actual live sanction details (₹18,500). Switch language to **हिन्दी (Hindi)** to test multilingual response.
- **One-Scheme Rule**: Go to **Apply** tab $\rightarrow$ Tap **"Apply"** for NFST or Top Class $\rightarrow$ Observe real-time warning explaining that Sunita already has an active Post-Matric application!

### Persona 2: Rajesh Kumar Munda (Disbursed Pre-Matric Student)
- Sign out $\rightarrow$ Tap **"2. Rajesh Munda (Disbursed Pre-Matric)"**
- **Dashboard**: Observe Pre-Matric application marked **DISBURSED**.
- **DBT Card**: Shows ₹7,000 credited to Bank of India account with PFMS UTR `UTR20250918BOI994821`.
- **Profile**: Displays PVTG status (Birhor Tribe) and Aadhaar NPCI mapped status.

### Persona 3: Anjali Kerketta (NFST Fellowship in Review)
- Sign out $\rightarrow$ Tap **"3. Anjali Kerketta (NFST Fellowship)"**
- **Dashboard**: Observe NFST Fellowship (SFMP portal) under scrutiny. Name on UGC-NTA score card is *"Anjali K. Kerketta"* while application is *"Anjali Kerketta"*. Confidence score: 84.5% (routed to officer review queue).

### Persona 4: Dr. Ramesh Chandra Meena (MoTA Nodal Officer)
- Sign out $\rightarrow$ Tap **"4. Dr. R. C. Meena (Nodal Officer)"**
- **Review Queue**: View flagged applications. Tap on Anjali Kerketta $\rightarrow$ Observe **side-by-side mismatch diff** (Application Name vs UGC-NTA Name).
- Tap **"✓ Approve Exception"** $\rightarrow$ Status instantly updates, clears verification, and advances application to Sanctioned without rejection!
- **Coverage Gap Tab**: View UDISE+ & AISHE enrollment saturation:
  - 5 Total Enrolled ST Students
  - 1 Active Claim
  - 4 Unreached Beneficiaries
- Tap **"📢 Trigger Multi-Channel Outreach Broadcast"** $\rightarrow$ Simulates dispatching targeted SMS and JAGO proactive nudges.

---

## 10. How to Build the Android APK / AAB

To generate an Android APK for physical device installation using EAS (Expo Application Services):

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Configure Build Profile
Run in `d:/Tribal/mobile`:
```bash
eas build:configure
```
This generates `eas.json`. Ensure the `preview` profile generates an APK:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Step 4: Build Android APK
```bash
eas build -p android --profile preview
```
EAS builds the standalone APK in the cloud and provides a direct download link / QR code to install on Android.

---

## 11. Pitch Defense for Hackathon Judges

When presenting to Smart India Hackathon (SIH) judges, use these architectural talking points:

1. **Why sit on top rather than rebuild?**
   *"Legacy portals (NSP, SFMP, NOS) have heavy regulatory mandates. Rebuilding them creates institutional friction. Our platform implements the Adapter Pattern above them, unifying the student experience through a single 14-digit OTR identity without requiring changes to existing backend infrastructure."*

2. **Why simulated DigiLocker?**
   *"Official DigiLocker production onboarding requires an organizational API Setu agreement with Ministry sponsorship. For our demo, we adhered strictly to the official DigiLocker OAuth2 consent redirect specification and consumed standard API Setu cryptographic payload schemas."*

3. **How does Smart Verification prevent bottlenecks?**
   *"Traditional government systems fail or reject applications outright when a name typo occurs. Our Smart Verification Engine calculates a Jaro-Winkler confidence score. Records above 90% auto-verify; records below 90% degrade gracefully into the Officer Manual Review Queue with side-by-side diffs, ensuring zero students are wrongly rejected."*

4. **Why extend JAGO rather than build a generic chatbot?**
   *"MoTA already operates JAGO for general policy FAQs. Rather than creating a redundant bot, our solution registers as an authenticated transactional skill within JAGO, giving it secure access to student-specific live scholarship records."*
