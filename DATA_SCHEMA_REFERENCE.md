# Data Schema Reference
## Fleet Management System - History Data Types

---

## 1. Fuel Surcharge Calculation

### Collection Name: `fuel_surcharge_calculations`

### Document Structure
```javascript
{
  "_id": ObjectId,                      // MongoDB auto-generated
  "user_id": String,                    // User identifier from JWT
  "type": "fuel_surcharge",             // Constant identifier
  "data": {
    // === INPUT FIELDS (from user) ===
    "current_fuel_price": Number,       // Current diesel price per gallon
    "base_fuel_price": Number,          // Baseline fuel price for comparison
    "base_rate": Number,                // Base freight rate in dollars
    "miles": Number,                    // Trip distance (used for CPM method)
    "surcharge_method": String,         // Calculation method used

    // === OUTPUT FIELDS (calculated results) ===
    "surcharge_percent": Number,        // Percentage increase from base
    "surcharge_amount": Number,         // Dollar amount of surcharge
    "total_with_surcharge": Number,     // Base rate + surcharge amount
    "cpm_surcharge": Number             // Cost per mile surcharge rate
  },
  "created_at": String                  // ISO 8601 timestamp
}
```

### Field Specifications

| Field | Type | Required | Constraints | Example | Description |
|-------|------|----------|-------------|---------|-------------|
| `current_fuel_price` | Number | Yes | > 0 | `4.50` | Current diesel price ($/gallon) |
| `base_fuel_price` | Number | Yes | > 0 | `2.50` | Baseline fuel price ($/gallon) |
| `base_rate` | Number | Yes | >= 0 | `3000.00` | Base freight rate ($) |
| `miles` | Number | No | >= 0, default: 0 | `750` | Trip distance in miles |
| `surcharge_method` | String | Yes | "percentage" or "cpm" | `"percentage"` | Calculation method |
| `surcharge_percent` | Number | Yes | >= 0 | `80.00` | Surcharge as percentage |
| `surcharge_amount` | Number | Yes | >= 0 | `2400.00` | Surcharge in dollars |
| `total_with_surcharge` | Number | Yes | >= 0 | `5400.00` | Total rate with surcharge |
| `cpm_surcharge` | Number | Yes | >= 0 | `0.333` | Per-mile surcharge rate |

### Calculation Formulas
```
surcharge_percent = ((current_fuel_price - base_fuel_price) / base_fuel_price) * 100

cpm_surcharge = (current_fuel_price - base_fuel_price) / average_mpg
  where average_mpg = 6 (industry standard for trucks)

surcharge_amount:
  - If method = "percentage": (surcharge_percent / 100) * base_rate
  - If method = "cpm": cpm_surcharge * miles

total_with_surcharge = base_rate + surcharge_amount
```

### Example Document
```json
{
  "_id": "65f8a1b2c3d4e5f6a7b8c9d0",
  "user_id": "user_1711360800_abc123",
  "type": "fuel_surcharge",
  "data": {
    "current_fuel_price": 4.50,
    "base_fuel_price": 2.50,
    "base_rate": 3000.00,
    "miles": 750,
    "surcharge_method": "percentage",
    "surcharge_percent": 80.00,
    "surcharge_amount": 2400.00,
    "total_with_surcharge": 5400.00,
    "cpm_surcharge": 0.333
  },
  "created_at": "2026-03-25T10:30:00.000Z"
}
```

---

## 2. IFTA Tax Calculation

### Collection Name: `ifta_calculations`

### Document Structure
```javascript
{
  "_id": ObjectId,                      // MongoDB auto-generated
  "user_id": String,                    // User identifier from JWT
  "type": "ifta",                       // Constant identifier
  "data": {
    // === INPUT FIELDS ===
    "mpg": Number,                      // Fleet average miles per gallon
    "total_fuel_purchased": Number,     // Total gallons purchased (all states)

    // === CALCULATED SUMMARY ===
    "total_miles": Number,              // Sum of miles across all jurisdictions
    "total_fuel_used": Number,          // Total gallons consumed (total_miles / mpg)
    
    // === JURISDICTION BREAKDOWN ===
    "jurisdictions": [                  // Array of state/province data
      {
        "state": String,                // 2-3 letter jurisdiction code
        "miles": Number,                // Miles driven in this jurisdiction
        "fuel_purchased": Number,       // Gallons purchased in this jurisdiction
        "tax_rate": Number,             // Fuel tax rate ($/gallon)
        "fuel_used": Number,            // Gallons used (miles / mpg)
        "net_taxable_fuel": Number,     // Fuel used - fuel purchased
        "tax_due": Number               // net_taxable_fuel * tax_rate
      }
    ],
    
    // === TOTAL ===
    "total_tax_due": Number             // Sum of all jurisdiction tax_due values
  },
  "created_at": String                  // ISO 8601 timestamp
}
```

### Field Specifications - Main Document

| Field | Type | Required | Constraints | Example | Description |
|-------|------|----------|-------------|---------|-------------|
| `mpg` | Number | Yes | > 0 | `6.5` | Fleet average MPG |
| `total_fuel_purchased` | Number | No | >= 0 | `3500` | Total gallons bought |
| `total_miles` | Number | Yes | >= 0 | `4300` | Sum of all jurisdiction miles |
| `total_fuel_used` | Number | Yes | >= 0 | `661.54` | total_miles / mpg |
| `jurisdictions` | Array | Yes | min 1 item | `[...]` | Jurisdiction breakdown |
| `total_tax_due` | Number | Yes | any | `25.23` | Net tax owed (can be negative=credit) |

### Field Specifications - Jurisdiction Object

| Field | Type | Required | Constraints | Example | Description |
|-------|------|----------|-------------|---------|-------------|
| `state` | String | Yes | 2-3 chars | `"TX"` | State/province code |
| `miles` | Number | Yes | >= 0 | `2500` | Miles in jurisdiction |
| `fuel_purchased` | Number | Yes | >= 0 | `350` | Gallons bought in jurisdiction |
| `tax_rate` | Number | Yes | >= 0 | `0.20` | Tax rate per gallon |
| `fuel_used` | Number | Yes | >= 0 | `384.62` | miles / mpg |
| `net_taxable_fuel` | Number | Yes | any | `34.62` | fuel_used - fuel_purchased |
| `tax_due` | Number | Yes | any | `6.92` | Tax owed (negative = credit) |

### Calculation Formulas
```
For each jurisdiction:
  fuel_used = miles / mpg
  net_taxable_fuel = fuel_used - fuel_purchased
  tax_due = net_taxable_fuel * tax_rate

Summary:
  total_miles = SUM(jurisdictions[].miles)
  total_fuel_used = total_miles / mpg
  total_tax_due = SUM(jurisdictions[].tax_due)

Note: If net_taxable_fuel is negative (bought more than used),
      tax_due will be negative (tax credit)
```

### Common IFTA Tax Rates (Reference)
```javascript
// US States ($/gallon) - 2024 rates
{
  "AL": 0.29,  "AK": 0.0895, "AZ": 0.26,  "AR": 0.285, "CA": 0.68,
  "CO": 0.22,  "CT": 0.25,   "DE": 0.22,  "FL": 0.35,  "GA": 0.324,
  "ID": 0.32,  "IL": 0.467,  "IN": 0.54,  "IA": 0.30,  "KS": 0.24,
  "KY": 0.246, "LA": 0.20,   "ME": 0.312, "MD": 0.417, "MI": 0.467,
  "MN": 0.285, "MS": 0.18,   "MO": 0.22,  "MT": 0.2975,"NE": 0.246,
  "NV": 0.23,  "NH": 0.222,  "NJ": 0.414, "NM": 0.21,  "NY": 0.3215,
  "NC": 0.38,  "ND": 0.23,   "OH": 0.47,  "OK": 0.19,  "OR": 0.38,
  "PA": 0.741, "SC": 0.22,   "SD": 0.28,  "TN": 0.27,  "TX": 0.20,
  "UT": 0.314, "VA": 0.262,  "WA": 0.494, "WV": 0.357, "WI": 0.329,
  "WY": 0.24
}

// Canadian Provinces ($/gallon)
{
  "ON": 0.143, "QC": 0.192, "BC": 0.15, "AB": 0.13, "SK": 0.15, "MB": 0.14
}
```

### Example Document
```json
{
  "_id": "65f8a1b2c3d4e5f6a7b8c9d1",
  "user_id": "user_1711360800_abc123",
  "type": "ifta",
  "data": {
    "mpg": 6.5,
    "total_fuel_purchased": 600,
    "total_miles": 4300,
    "total_fuel_used": 661.54,
    "jurisdictions": [
      {
        "state": "TX",
        "miles": 2500,
        "fuel_purchased": 350,
        "tax_rate": 0.20,
        "fuel_used": 384.62,
        "net_taxable_fuel": 34.62,
        "tax_due": 6.92
      },
      {
        "state": "CA",
        "miles": 1800,
        "fuel_purchased": 250,
        "tax_rate": 0.68,
        "fuel_used": 276.92,
        "net_taxable_fuel": 26.92,
        "tax_due": 18.31
      }
    ],
    "total_tax_due": 25.23
  },
  "created_at": "2026-03-25T09:15:00.000Z"
}
```

---

## 3. Bill of Lading (BOL)

### Collection Name: `bol_documents`

### Document Structure
```javascript
{
  "_id": ObjectId,                      // MongoDB auto-generated
  "user_id": String,                    // User identifier from JWT
  "type": "bol",                        // Constant identifier
  "data": {
    // === DOCUMENT REFERENCE ===
    "bol_number": String,               // Unique BOL identifier
    "bol_date": String,                 // Date of BOL creation

    // === PARTIES ===
    "shipper_name": String,             // Origin company/shipper
    "consignee_name": String,           // Destination company/receiver
    "carrier_name": String,             // Trucking/transport company

    // === SHIPMENT DETAILS ===
    "total_weight": String,             // Total shipment weight
    "freight_terms": String             // Payment terms
  },
  "created_at": String                  // ISO 8601 timestamp
}
```

### Field Specifications

| Field | Type | Required | Constraints | Example | Description |
|-------|------|----------|-------------|---------|-------------|
| `bol_number` | String | Yes | 1-50 chars, non-empty | `"BOL-2026-001234"` | Unique BOL reference number |
| `bol_date` | String | Yes | ISO date (YYYY-MM-DD) | `"2026-03-25"` | Date BOL was created |
| `shipper_name` | String | Yes | 1-200 chars, non-empty | `"ABC Logistics Inc."` | Company shipping the goods |
| `consignee_name` | String | Yes | 1-200 chars, non-empty | `"XYZ Warehouse Co."` | Company receiving the goods |
| `carrier_name` | String | No | max 200 chars | `"FastFreight LLC"` | Transport company |
| `total_weight` | String | No | max 50 chars | `"45000 lbs"` | Total weight with unit |
| `freight_terms` | String | No | enum values | `"Prepaid"` | Payment responsibility |

### Freight Terms Values
```javascript
// Allowed values for freight_terms
[
  "Prepaid",      // Shipper pays freight charges
  "Collect",      // Consignee pays freight charges
  "Third Party"   // Third party pays freight charges
]
```

### Example Document
```json
{
  "_id": "65f8a1b2c3d4e5f6a7b8c9d2",
  "user_id": "user_1711360800_abc123",
  "type": "bol",
  "data": {
    "bol_number": "BOL-2026-001234",
    "bol_date": "2026-03-25",
    "shipper_name": "ABC Logistics Inc.",
    "consignee_name": "XYZ Warehouse Co.",
    "carrier_name": "FastFreight LLC",
    "total_weight": "45000 lbs",
    "freight_terms": "Prepaid"
  },
  "created_at": "2026-03-25T08:00:00.000Z"
}
```

---

## 4. API Request Payload Examples

### Save Fuel Surcharge - POST /api/history/fuel-surcharge
```json
{
  "current_fuel_price": 4.50,
  "base_fuel_price": 2.50,
  "base_rate": 3000.00,
  "miles": 750,
  "surcharge_method": "percentage",
  "surcharge_percent": 80.00,
  "surcharge_amount": 2400.00,
  "total_with_surcharge": 5400.00,
  "cpm_surcharge": 0.333
}
```

### Save IFTA - POST /api/history/ifta
```json
{
  "mpg": 6.5,
  "total_fuel_purchased": 600,
  "total_miles": 4300,
  "total_fuel_used": 661.54,
  "jurisdictions": [
    {
      "state": "TX",
      "miles": 2500,
      "fuel_purchased": 350,
      "tax_rate": 0.20,
      "fuel_used": 384.62,
      "net_taxable_fuel": 34.62,
      "tax_due": 6.92
    },
    {
      "state": "CA",
      "miles": 1800,
      "fuel_purchased": 250,
      "tax_rate": 0.68,
      "fuel_used": 276.92,
      "net_taxable_fuel": 26.92,
      "tax_due": 18.31
    }
  ],
  "total_tax_due": 25.23
}
```

### Save BOL - POST /api/history/bol
```json
{
  "bol_number": "BOL-2026-001234",
  "bol_date": "2026-03-25",
  "shipper_name": "ABC Logistics Inc.",
  "consignee_name": "XYZ Warehouse Co.",
  "carrier_name": "FastFreight LLC",
  "total_weight": "45000 lbs",
  "freight_terms": "Prepaid"
}
```

---

## 5. History Response Format

### GET /api/history Response
```json
{
  "history": [
    {
      "type": "fuel_surcharge",
      "data": {
        "current_fuel_price": 4.50,
        "base_fuel_price": 2.50,
        "base_rate": 3000.00,
        "miles": 750,
        "surcharge_method": "percentage",
        "surcharge_percent": 80.00,
        "surcharge_amount": 2400.00,
        "total_with_surcharge": 5400.00,
        "cpm_surcharge": 0.333
      },
      "created_at": "2026-03-25T10:30:00.000Z"
    },
    {
      "type": "ifta",
      "data": {
        "mpg": 6.5,
        "total_fuel_purchased": 600,
        "total_miles": 4300,
        "total_fuel_used": 661.54,
        "jurisdictions": [...],
        "total_tax_due": 25.23
      },
      "created_at": "2026-03-25T09:15:00.000Z"
    },
    {
      "type": "bol",
      "data": {
        "bol_number": "BOL-2026-001234",
        "bol_date": "2026-03-25",
        "shipper_name": "ABC Logistics Inc.",
        "consignee_name": "XYZ Warehouse Co.",
        "carrier_name": "FastFreight LLC",
        "total_weight": "45000 lbs",
        "freight_terms": "Prepaid"
      },
      "created_at": "2026-03-25T08:00:00.000Z"
    }
  ]
}
```

---

## 6. MongoDB Index Recommendations

```javascript
// Create indexes for optimal query performance
db.fuel_surcharge_calculations.createIndex({ "user_id": 1, "created_at": -1 });
db.ifta_calculations.createIndex({ "user_id": 1, "created_at": -1 });
db.bol_documents.createIndex({ "user_id": 1, "created_at": -1 });
db.bol_documents.createIndex({ "data.bol_number": 1 });
```

---

## 7. TypeScript/Pydantic Type Definitions

### TypeScript Interfaces
```typescript
// Fuel Surcharge
interface FuelSurchargeData {
  current_fuel_price: number;
  base_fuel_price: number;
  base_rate: number;
  miles: number;
  surcharge_method: 'percentage' | 'cpm';
  surcharge_percent: number;
  surcharge_amount: number;
  total_with_surcharge: number;
  cpm_surcharge: number;
}

// IFTA Jurisdiction
interface IFTAJurisdiction {
  state: string;
  miles: number;
  fuel_purchased: number;
  tax_rate: number;
  fuel_used: number;
  net_taxable_fuel: number;
  tax_due: number;
}

// IFTA Calculation
interface IFTAData {
  mpg: number;
  total_fuel_purchased: number;
  total_miles: number;
  total_fuel_used: number;
  jurisdictions: IFTAJurisdiction[];
  total_tax_due: number;
}

// BOL
interface BOLData {
  bol_number: string;
  bol_date: string;
  shipper_name: string;
  consignee_name: string;
  carrier_name: string;
  total_weight: string;
  freight_terms: 'Prepaid' | 'Collect' | 'Third Party';
}

// History Item (returned from API)
interface HistoryItem {
  type: 'fuel_surcharge' | 'ifta' | 'bol';
  data: FuelSurchargeData | IFTAData | BOLData;
  created_at: string;
}
```

### Python Pydantic Models
```python
from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class FuelSurchargeData(BaseModel):
    current_fuel_price: float = Field(..., gt=0)
    base_fuel_price: float = Field(..., gt=0)
    base_rate: float = Field(..., ge=0)
    miles: float = Field(default=0, ge=0)
    surcharge_method: Literal["percentage", "cpm"]
    surcharge_percent: float = Field(..., ge=0)
    surcharge_amount: float = Field(..., ge=0)
    total_with_surcharge: float = Field(..., ge=0)
    cpm_surcharge: float = Field(..., ge=0)

class IFTAJurisdiction(BaseModel):
    state: str = Field(..., min_length=2, max_length=3)
    miles: float = Field(..., ge=0)
    fuel_purchased: float = Field(..., ge=0)
    tax_rate: float = Field(..., ge=0)
    fuel_used: float = Field(..., ge=0)
    net_taxable_fuel: float
    tax_due: float

class IFTAData(BaseModel):
    mpg: float = Field(..., gt=0)
    total_fuel_purchased: Optional[float] = Field(default=0, ge=0)
    total_miles: float = Field(..., ge=0)
    total_fuel_used: float = Field(..., ge=0)
    jurisdictions: List[IFTAJurisdiction] = Field(..., min_items=1)
    total_tax_due: float

class BOLData(BaseModel):
    bol_number: str = Field(..., min_length=1, max_length=50)
    bol_date: str
    shipper_name: str = Field(..., min_length=1, max_length=200)
    consignee_name: str = Field(..., min_length=1, max_length=200)
    carrier_name: Optional[str] = Field(default="", max_length=200)
    total_weight: Optional[str] = Field(default="", max_length=50)
    freight_terms: Optional[Literal["Prepaid", "Collect", "Third Party"]] = "Prepaid"
```

---

**Document Version:** 1.0  
**Last Updated:** March 25, 2026
