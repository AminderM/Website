# Integrated Supply Chain Technologies - PRD

## Original Problem Statement
Build a Tools feature for the logistics TMS application with:
1. A Tools page with Fuel Surcharge Calculator and IFTA Fuel Tax Estimator
2. A floating quick tools sidebar accessible from anywhere in the app

## Architecture
- **Frontend**: React 19 with TypeScript, TailwindCSS
- **Backend**: FastAPI (Python) with JWT authentication
- **Database**: MongoDB (available but not used for current tools)
- **Authentication**: JWT-based with in-memory user storage (demo mode)

## User Personas
1. **Fleet Owners** - Need quick access to fuel surcharge calculations for billing
2. **Dispatchers** - Calculate IFTA tax liability across jurisdictions
3. **Operations Managers** - Access tools while creating BOL documents

## Core Requirements (Static)
- [x] Authenticated access to tools
- [x] Fuel Surcharge Calculator with DOE standard calculations
- [x] IFTA Fuel Tax Estimator with multi-jurisdiction support
- [x] Quick access sidebar from any page

## What's Been Implemented
**March 25, 2026:**
- Created `/app/src/pages/ToolsPage.tsx` with full calculators
- Created `/app/src/components/QuickToolsSidebar.tsx` with mini calculators
- Updated App.tsx with routing and sidebar integration
- Updated Navbar.tsx with Tools link for authenticated users
- Created `/app/backend/server.py` with FastAPI authentication

## Prioritized Backlog

### P0 (Critical)
- None remaining

### P1 (High Priority)
- Add calculation history storage in MongoDB
- Export IFTA report to CSV/PDF

### P2 (Medium Priority)
- Mileage/distance calculator
- Weight conversion tool
- Rate quote estimator
- Freight class calculator

### P3 (Low Priority)
- Dark/light theme persistence
- Mobile-optimized quick tools

## Next Tasks
1. Persist calculations to MongoDB for user history
2. Add export functionality for IFTA reports
3. Implement additional fleet tools based on user feedback
