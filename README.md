# Event Department Web

Information management system for the Event Department of Coc Sai Gon Media Club (CSG).

## 📋 Overview

Event Department Web is a comprehensive web application for managing Event Department operations at CSG. It provides tools for vendor management, member management, inventory tracking, event guidance, and other internal utilities.

## ✨ Key Features

### 🔐 Authentication and Authorization
- Two login roles:
  - **Admin**: requires password `eventleader`
  - **Member**: no password required
- Route protection based on user role

### 📊 Dashboard
- System overview
- Quick access to important stats and data

### 🏪 Vendor Management
- Manage vendor directory
- Create, update, and delete vendor records
- Search and filter vendors

### 👥 Members Management (Admin only)
- Manage Event Department members
- Import member lists from Excel
- Track member scores by semester
- View member history and statistics

### 📦 Inventory Management
- Manage event inventory
- Import data from CSV/XLSX
- Search and filter by type and item
- Track available quantities
- Inventory CRUD (Admin only)
- Firestore synchronization

### 📚 Event Guide
- Event operations handbook
- Guides for Planning, Event Production, and Paperwork teams
- Templates and checklists
- Linked documentation resources

### 🔍 Tax Lookup
- Lookup business tax IDs
- Validate company information

### 🖼️ Remove Background
- Background removal tool for images
- Fast image processing workflow

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** - UI framework
- **Material-UI (MUI) 5.14.18** - Component library
- **Ant Design** - Additional UI components
- **React Router 6.20.0** - Routing
- **Framer Motion** - Animations
- **XLSX** - Excel file processing

### Backend and Services
- **Firebase/Firestore** - Database and backend services
- **@xenova/transformers** - AI/ML processing
- **docxtemplater** - Word document generation

### Development Tools
- **React Scripts 5.0.1**
- **ESLint**
- **cross-env**
- **concurrently**

## 📦 Installation

### Requirements
- Node.js 14+
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd EventDepartmentWeb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - See `FIREBASE_SETUP.md` for setup instructions
   - Create `src/backend/firebase/config.js` with your Firebase project credentials

4. **Run the application**
   ```bash
   # Run frontend + backend together (recommended)
   npm run dev

   # Run frontend only
   npm start

   # Unix/Mac frontend start
   npm run start:unix
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔑 Login

### Admin
- Select **Admin** on the login page
- Enter password: `eventleader`
- Full access to all features (including member management)

### Member
- Select **Member** on the login page
- No password required
- Access to non-admin features only

## 📁 Project Structure

```
src/
├── frontend/
│   ├── components/      # React components
│   │   ├── Common/      # Shared components
│   │   ├── Layout/      # Layout components
│   │   ├── Vendor/      # Vendor-related components
│   │   └── Weather/     # Weather widget
│   ├── contexts/        # React contexts (Auth)
│   ├── pages/           # Page components
│   ├── styles/          # Global styles
│   └── theme/           # Theme configuration
├── backend/
│   ├── firebase/        # Firebase configuration
│   └── services/        # Service layer
└── image/               # Static images
```

## 📄 Main Routes

| Route | Page | Access |
|-------|------|--------|
| `/` | Dashboard | All users |
| `/vendors` | Vendor Management | All users |
| `/inventory` | Inventory | All users |
| `/members` | Members Management | Admin only |
| `/members/import` | Import Members | Admin only |
| `/members/:semester` | Member Scores | Admin only |
| `/event-guide` | Event Guide | All users |
| `/tax-lookup` | Tax Lookup | All users |
| `/remove-bg` | Remove Background | All users |
| `/login` | Login | Public |

## 🔧 Scripts

- `npm run dev` - Run frontend (3000) and backend API (3002) together
- `npm start` - Start frontend dev server (Windows)
- `npm run start:frontend` - Start frontend (auto-reuses existing instance on port 3000)
- `npm run start:backend` - Start backend API server (auto-reuses existing instance on port 3002)
- `npm run start:unix` - Start frontend dev server (Unix/Mac)
- `npm run build` - Build for production
- `npm test` - Run tests

## 🔐 Security Notes

- Admin password is hardcoded for development/demo use only
- Admin routes are protected by `AdminProtectedRoute`
- Auth state is managed by `AuthContext`

## 📝 Notes

- The app uses Firebase Firestore as its primary database
- Firebase must be configured before running the app
- Some features require admin role
- CSV/XLSX import files must follow the expected format

## 🤝 Contributing

This project belongs to Coc Sai Gon Media Club (CSG). Suggestions and contributions are welcome.

## 📄 License

Private project - All rights reserved

---

**Version:** 1.0.0  
**Maintained by:** Event Department - CSG
