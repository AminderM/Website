# Frontend Integration Guide
## Integrated Supply Chain Technologies

**Backend URL:** `https://api.staging.integratedtech.ca`  
**Environment Variable:** `REACT_APP_BACKEND_URL`

---

## Quick Reference

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/health` | GET | No | Health check |
| `/api/auth/signup` | POST | No | Register user |
| `/api/auth/login` | POST | No | Get JWT token |
| `/api/auth/user` | GET | Yes | Get user profile |
| `/api/history/fuel-surcharge` | POST | Yes | Save calculation |
| `/api/history/ifta` | POST | Yes | Save IFTA data |
| `/api/history/bol` | POST | Yes | Save BOL |
| `/api/history` | GET | Yes | List history (filterable) |
| `/api/history/{id}` | GET | Yes | Get single record |
| `/api/history/{id}` | DELETE | Yes | Delete record |

---

## Key Integration Points

### 1. Base URL Configuration
```typescript
// Use environment variable
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

// All API calls
const response = await fetch(`${API_BASE_URL}/api/endpoint`);
```

### 2. Authentication Header
```typescript
// Include with all authenticated requests
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### 3. Key Points
- **Base URL:** Use `REACT_APP_BACKEND_URL` from `.env`
- **Auth Header:** `Authorization: Bearer <token>`
- **All fields are optional** - submit only what you have
- **Pagination:** Default 20 items, max 100 per page
- **Filtering:** Use `?type=fuel-surcharge|ifta|bol`

---

## TypeScript Interfaces

```typescript
// ============================================
// Authentication Types
// ============================================
interface User {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  created_at: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

// ============================================
// Fuel Surcharge Types
// ============================================
interface FuelSurchargeData {
  current_fuel_price: number;
  base_fuel_price: number;
  base_rate: number;
  miles?: number;
  surcharge_method: 'percentage' | 'cpm';
  surcharge_percent: number;
  surcharge_amount: number;
  total_with_surcharge: number;
  cpm_surcharge: number;
}

// ============================================
// IFTA Types
// ============================================
interface IFTAJurisdiction {
  state: string;
  miles: number;
  fuel_purchased: number;
  tax_rate: number;
  fuel_used: number;
  net_taxable_fuel: number;
  tax_due: number;
}

interface IFTAData {
  mpg: number;
  total_fuel_purchased?: number;
  total_miles: number;
  total_fuel_used: number;
  jurisdictions: IFTAJurisdiction[];
  total_tax_due: number;
}

// ============================================
// BOL Types
// ============================================
interface BOLData {
  bol_number: string;
  bol_date: string;
  shipper_name: string;
  consignee_name: string;
  carrier_name?: string;
  total_weight?: string;
  freight_terms?: 'Prepaid' | 'Collect' | 'Third Party';
}

// ============================================
// History Types
// ============================================
type HistoryType = 'fuel_surcharge' | 'ifta' | 'bol';

interface HistoryItem {
  id: string;
  type: HistoryType;
  data: FuelSurchargeData | IFTAData | BOLData;
  created_at: string;
}

interface HistoryResponse {
  history: HistoryItem[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}
```

---

## React API Service

```typescript
// services/api.ts

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  // ============================================
  // Authentication
  // ============================================
  
  async signup(data: SignupRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUser(): Promise<User> {
    return this.request<User>('/api/auth/user');
  }

  // ============================================
  // History - Save
  // ============================================
  
  async saveFuelSurcharge(data: FuelSurchargeData): Promise<{ success: boolean; id: string }> {
    return this.request('/api/history/fuel-surcharge', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async saveIFTA(data: IFTAData): Promise<{ success: boolean; id: string }> {
    return this.request('/api/history/ifta', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async saveBOL(data: BOLData): Promise<{ success: boolean; id: string }> {
    return this.request('/api/history/bol', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // History - Read
  // ============================================
  
  async getHistory(options?: {
    type?: HistoryType;
    page?: number;
    limit?: number;
  }): Promise<HistoryResponse> {
    const params = new URLSearchParams();
    if (options?.type) params.append('type', options.type);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    
    const query = params.toString();
    return this.request(`/api/history${query ? `?${query}` : ''}`);
  }

  async getHistoryItem(id: string): Promise<HistoryItem> {
    return this.request(`/api/history/${id}`);
  }

  // ============================================
  // History - Delete
  // ============================================
  
  async deleteHistoryItem(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/history/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
export default api;
```

---

## React Hook Examples

### useAuth Hook
```typescript
// hooks/useAuth.ts
import { useState, useCallback } from 'react';
import api from '../services/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.login({ email, password });
      localStorage.setItem('token', response.token);
      api.setToken(response.token);
      setUser(response.user);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    api.setToken(null);
    setUser(null);
  }, []);

  return { user, loading, error, login, logout };
}
```

### useHistory Hook
```typescript
// hooks/useHistory.ts
import { useState, useCallback } from 'react';
import api from '../services/api';

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchHistory = useCallback(async (options?: {
    type?: HistoryType;
    page?: number;
    limit?: number;
  }) => {
    setLoading(true);
    try {
      const response = await api.getHistory(options);
      setHistory(response.history);
      setHasMore(response.has_more);
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    await api.deleteHistoryItem(id);
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  return { history, loading, hasMore, fetchHistory, deleteItem };
}
```

---

## Component Examples

### Save Calculation Example
```tsx
// Example: Saving a fuel surcharge calculation
const handleSaveCalculation = async () => {
  try {
    const result = await api.saveFuelSurcharge({
      current_fuel_price: 4.50,
      base_fuel_price: 2.50,
      base_rate: 3000,
      miles: 750,
      surcharge_method: 'percentage',
      surcharge_percent: 80,
      surcharge_amount: 2400,
      total_with_surcharge: 5400,
      cpm_surcharge: 0.333
    });
    
    console.log('Saved with ID:', result.id);
    // Show success message
  } catch (error) {
    console.error('Save failed:', error);
    // Show error message
  }
};
```

### History List Component
```tsx
// components/HistoryList.tsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';

const HistoryList: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<HistoryType | 'all'>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadHistory = async () => {
      const response = await api.getHistory({
        type: filter === 'all' ? undefined : filter,
        page,
        limit: 20
      });
      setHistory(response.history);
    };
    loadHistory();
  }, [filter, page]);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this item?')) {
      await api.deleteHistoryItem(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'fuel_surcharge', 'ifta', 'bol'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type as any)}
            className={filter === type ? 'active' : ''}
          >
            {type === 'all' ? 'All' : type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* History Items */}
      {history.map(item => (
        <div key={item.id} className="history-item">
          <span className="type-badge">{item.type}</span>
          <span className="date">{new Date(item.created_at).toLocaleDateString()}</span>
          <button onClick={() => handleDelete(item.id)}>Delete</button>
        </div>
      ))}

      {/* Pagination */}
      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
          Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
};
```

---

## Error Handling

### Standard Error Format
```typescript
interface ApiError {
  detail: string;
  error_code?: string;
  field?: string;
}
```

### Common Error Codes
| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `AUTH_MISSING_TOKEN` | 401 | No token provided |
| `AUTH_INVALID_TOKEN` | 401 | Token is invalid |
| `AUTH_EXPIRED_TOKEN` | 401 | Token has expired |
| `USER_EXISTS` | 409 | Email already registered |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `NOT_FOUND` | 404 | Resource not found |

### Error Handling Example
```typescript
try {
  await api.login({ email, password });
} catch (error) {
  if (error.message === 'Invalid email or password') {
    // Show login error
  } else if (error.message === 'Token has expired') {
    // Redirect to login
  } else {
    // Generic error handling
  }
}
```

---

## Environment Setup

### .env File
```env
# Development
REACT_APP_BACKEND_URL=http://localhost:8001

# Staging
REACT_APP_BACKEND_URL=https://api.staging.integratedtech.ca

# Production
REACT_APP_BACKEND_URL=https://api.integratedtech.ca
```

---

## Query Parameters Reference

### GET /api/history

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | all | Filter: `fuel_surcharge`, `ifta`, `bol` |
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 20 | Items per page (max 100) |

**Examples:**
```
GET /api/history                          # All items, page 1
GET /api/history?type=fuel_surcharge      # Only fuel surcharge
GET /api/history?page=2&limit=50          # Page 2, 50 items
GET /api/history?type=bol&limit=10        # BOLs only, 10 items
```

---

## Testing Checklist

- [ ] Login with valid credentials returns token
- [ ] Login with invalid credentials returns 401
- [ ] Signup creates new user and returns token
- [ ] Signup with existing email returns 409
- [ ] Protected endpoints reject requests without token
- [ ] Protected endpoints reject expired tokens
- [ ] Save fuel surcharge returns success and ID
- [ ] Save IFTA returns success and ID
- [ ] Save BOL returns success and ID
- [ ] Get history returns user's items only
- [ ] History filtering by type works
- [ ] History pagination works
- [ ] Get single history item works
- [ ] Delete history item works
- [ ] Deleted items no longer appear in history

---

**Document Version:** 1.0  
**Last Updated:** March 25, 2026
