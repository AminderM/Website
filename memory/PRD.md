# Integrated Supply Chain Technologies - PRD

## Original Problem Statement
Build a Tools feature for the logistics TMS application with:
1. A Tools page with Fuel Surcharge Calculator and IFTA Fuel Tax Estimator
2. A sidebar with BOL Generator, Fuel Surcharge Calculator, IFTA Tax Calculator
3. History of all calculations and BOLs generated

## Architecture
- **Frontend**: React 19 with TypeScript, TailwindCSS
- **Backend**: FastAPI (Python) with JWT authentication
- **Database**: MongoDB for storing calculation history
- **Authentication**: JWT-based with seeded test user

## User Personas
1. **Fleet Owners** - Need quick access to fuel surcharge calculations for billing
2. **Dispatchers** - Calculate IFTA tax liability across jurisdictions
3. **Operations Managers** - Access tools while creating BOL documents

## Core Requirements (Static)
- [x] Authenticated access to tools
- [x] Fuel Surcharge Calculator with DOE standard calculations
- [x] IFTA Fuel Tax Estimator with multi-jurisdiction support
- [x] Persistent sidebar with all tools
- [x] History tab showing past calculations and BOLs

## What's Been Implemented
**March 25, 2026:**
- Created `/app/src/pages/ToolsPage.tsx` with full calculators and save functionality
- Created `/app/src/components/AppSidebar.tsx` with Tools and History tabs
- Updated App.tsx with sidebar integration and layout wrapper
- Updated `/app/backend/server.py` with MongoDB history APIs:
  - POST /api/history/fuel-surcharge
  - POST /api/history/ifta
  - POST /api/history/bol
  - GET /api/history
- Updated BOLGeneratorPage.tsx with save BOL functionality

## Prioritized Backlog

### P0 (Critical)
- None remaining

### P1 (High Priority)
- Export IFTA report to CSV/PDF
- Load saved BOL from history for editing

### P2 (Medium Priority)
- Mileage/distance calculator
- Weight conversion tool
- Rate quote estimator

### P3 (Low Priority)
- Dark/light theme persistence
- Mobile-optimized sidebar

## Next Tasks
1. Add ability to load saved calculations back into forms
2. Export functionality for reports
3. Implement additional fleet tools
