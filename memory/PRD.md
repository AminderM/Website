# Integrated Supply Chain Technologies - PRD

## Original Problem Statement
Build a Tools feature for the logistics TMS application with:
1. A sidebar with BOL Generator, Fuel Surcharge Calculator, IFTA Tax Calculator
2. Each tool displays individually when selected (not all together)
3. History of all calculations and BOLs generated
4. Remove BOL Generator and Tools from top navigation header

## Architecture
- **Frontend**: React 19 with TypeScript, TailwindCSS
- **Backend**: FastAPI (Python) with JWT authentication
- **Database**: MongoDB for storing calculation history
- **Production Backend**: api.staging.integratedtech.ca

## User Personas
1. **Fleet Owners** - Need quick access to fuel surcharge calculations for billing
2. **Dispatchers** - Calculate IFTA tax liability across jurisdictions
3. **Operations Managers** - Access tools while creating BOL documents

## Core Requirements (Static)
- [x] Authenticated access to tools via sidebar only
- [x] Each tool shows individually on its own page
- [x] Fuel Surcharge Calculator with DOE standard calculations
- [x] IFTA Fuel Tax Estimator with multi-jurisdiction support
- [x] Persistent sidebar with all tools
- [x] History tab showing past calculations and BOLs
- [x] Backend API documentation for production deployment

## What's Been Implemented
**March 25, 2026:**
- Created `/app/src/pages/FuelSurchargePage.tsx` - individual fuel surcharge calculator page
- Created `/app/src/pages/IFTACalculatorPage.tsx` - individual IFTA calculator page
- Updated `/app/src/components/AppSidebar.tsx` with Tools and History tabs
- Updated `/app/src/App.tsx` with separate routes for each tool
- Removed BOL Generator and Tools from top navbar
- Created `/app/BACKEND_API_INSTRUCTIONS.md` for production backend integration
- Routes: /bol-generator, /fuel-surcharge, /ifta-calculator

## API Endpoints (for api.staging.integratedtech.ca)
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/auth/user
- POST /api/history/fuel-surcharge
- POST /api/history/ifta
- POST /api/history/bol
- GET /api/history

## Prioritized Backlog

### P0 (Critical)
- None remaining

### P1 (High Priority)
- Backend deployment to api.staging.integratedtech.ca
- Export IFTA report to CSV/PDF

### P2 (Medium Priority)
- Load saved calculations back into forms
- Additional fleet tools (mileage, weight conversion)

### P3 (Low Priority)
- Mobile-optimized sidebar

## Next Tasks
1. Backend developer implements APIs per /app/BACKEND_API_INSTRUCTIONS.md
2. Update frontend REACT_APP_BACKEND_URL to point to api.staging.integratedtech.ca
