# CoinSight Database Schema Verification

**Date:** February 11, 2026  
**Status:** Final Schema Check

---

## ✅ Required Tables

You have **8 tables** in Supabase. Here's the verification for each:

---

### 1️⃣ **`holdings`** ✅ REQUIRED

**Purpose:** Stores user portfolio holdings (coins owned)

#### Required Columns:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Auto-generated |
| `user_id` | uuid | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | FK to auth |
| `coin_id` | text | NOT NULL | e.g., "bitcoin" |
| `symbol` | text | NOT NULL | e.g., "BTC" |
| `name` | text | NOT NULL | e.g., "Bitcoin" |
| `quantity` | numeric | NOT NULL | Amount owned |
| `buy_price` | numeric | NOT NULL | Average buy price |
| `current_price` | numeric | DEFAULT 0 | Latest price |
| `price_change_24h` | numeric | DEFAULT 0 | 24h change % |
| `image` | text | NULLABLE | Coin icon URL |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update |

#### Required Indexes:
- Index on `user_id` (for fast lookups)
- Index on `coin_id` (for fast coin-based queries)

#### RLS Policies Needed:
```sql
-- Users can view their own holdings
CREATE POLICY "Users can view own holdings" ON holdings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own holdings
CREATE POLICY "Users can insert own holdings" ON holdings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own holdings
CREATE POLICY "Users can update own holdings" ON holdings
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own holdings
CREATE POLICY "Users can delete own holdings" ON holdings
  FOR DELETE USING (auth.uid() = user_id);
```

**Code References:** 
- `src/services/portfolioService.js`
- `src/context/PortfolioContext.jsx`

---

### 2️⃣ **`transactions`** ✅ REQUIRED

**Purpose:** Stores user transaction history (buy/sell records)

#### Required Columns:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Auto-generated |
| `user_id` | uuid | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | FK to auth |
| `coin_id` | text | NOT NULL | e.g., "bitcoin" |
| `symbol` | text | NOT NULL | e.g., "BTC" |
| `name` | text | NOT NULL | e.g., "Bitcoin" |
| `action` | text | NOT NULL | "buy" or "sell" |
| `quantity` | numeric | NOT NULL | Amount transacted |
| `price` | numeric | NOT NULL | Price per coin |
| `total` | numeric | NOT NULL | Total value |
| `timestamp` | timestamptz | DEFAULT now() | Transaction time |

#### Required Indexes:
- Index on `user_id` (for fast user queries)
- Index on `timestamp` (for sorting)

#### RLS Policies Needed:
```sql
-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**Code References:**
- `src/services/transactionService.js`
- `src/pages/TransactionHistory.jsx`

---

### 3️⃣ **`price_alerts`** ✅ REQUIRED

**Purpose:** Stores user-defined price alerts for coins

#### Required Columns:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Auto-generated |
| `user_id` | uuid | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | FK to auth |
| `coin_id` | text | NOT NULL | e.g., "bitcoin" |
| `coin_name` | text | NOT NULL | e.g., "Bitcoin" |
| `symbol` | text | NOT NULL | e.g., "BTC" |
| `target_price` | numeric | NOT NULL | Price threshold |
| `condition` | text | NOT NULL | "above" or "below" |
| `is_active` | boolean | DEFAULT true | Alert status |
| `triggered_at` | timestamptz | NULLABLE | When alert fired |
| `created_at` | timestamptz | DEFAULT now() | Creation time |

#### Required Indexes:
- Index on `user_id` (for fast user queries)
- Index on `is_active` (for checking active alerts)
- Composite index on `(user_id, is_active, triggered_at)` (for alert checking)

#### RLS Policies Needed:
```sql
-- Users can view their own alerts
CREATE POLICY "Users can view own alerts" ON price_alerts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own alerts
CREATE POLICY "Users can insert own alerts" ON price_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own alerts
CREATE POLICY "Users can update own alerts" ON price_alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own alerts
CREATE POLICY "Users can delete own alerts" ON price_alerts
  FOR DELETE USING (auth.uid() = user_id);
```

**Code References:**
- `src/services/alertService.js`
- `src/services/priceAlertService.js`
- `src/pages/PriceAlerts.jsx`

---

### 4️⃣ **`notifications`** ✅ REQUIRED

**Purpose:** Stores user notifications (price alerts, portfolio updates)

#### Required Columns:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Auto-generated |
| `user_id` | uuid | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | FK to auth |
| `type` | text | NOT NULL | e.g., "buy", "sell", "price_alert" |
| `coin` | text | NOT NULL | Coin symbol |
| `quantity` | numeric | DEFAULT 0 | Amount (if applicable) |
| `price` | numeric | DEFAULT 0 | Price (if applicable) |
| `message` | text | NOT NULL | Notification message |
| `read` | boolean | DEFAULT false | Read status |
| `created_at` | timestamptz | DEFAULT now() | Creation time |

#### Required Indexes:
- Index on `user_id` (for fast user queries)
- Index on `created_at` (for sorting)
- Index on `read` (for filtering unread)

#### RLS Policies Needed:
```sql
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own notifications
CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);
```

**Code References:**
- `src/context/NotificationContext.jsx`
- `src/services/priceAlertService.js`
- `src/services/alertService.js`

---

### 5️⃣ **`user_settings`** ✅ REQUIRED

**Purpose:** Stores user preferences and settings

#### Required Columns:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Auto-generated |
| `user_id` | uuid | NOT NULL, UNIQUE, REFERENCES auth.users(id) ON DELETE CASCADE | FK to auth, one per user |
| `portfolio_updates` | boolean | DEFAULT true | Notification preference |
| `market_trends` | boolean | DEFAULT false | Notification preference |
| `price_alerts_enabled` | boolean | DEFAULT true | Alert system toggle |
| `currency` | text | DEFAULT 'USD' | Preferred currency |
| `created_at` | timestamptz | DEFAULT now() | Creation time |
| `updated_at` | timestamptz | DEFAULT now() | Last update |

#### Required Indexes:
- Unique index on `user_id` (enforces one setting per user)

#### RLS Policies Needed:
```sql
-- Users can view their own settings
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);
```

**Code References:**
- `src/context/NotificationContext.jsx`
- `src/context/PortfolioContext.jsx`
- `src/pages/Settings.jsx`

---

### 6️⃣ **`portfolio_snapshots`** ✅ REQUIRED

**Purpose:** Daily portfolio value tracking for history/charts

#### Required Columns:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Auto-generated |
| `user_id` | uuid | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | FK to auth |
| `snapshot_date` | date | NOT NULL | Date of snapshot (YYYY-MM-DD) |
| `total_value` | numeric | NOT NULL | Portfolio value on that day |
| `created_at` | timestamptz | DEFAULT now() | Creation time |

#### Required Constraints:
- **UNIQUE constraint on `(user_id, snapshot_date)`** - One snapshot per day per user

#### Required Indexes:
- Unique index on `(user_id, snapshot_date)` (for upsert operations)
- Index on `snapshot_date` (for date range queries)

#### RLS Policies Needed:
```sql
-- Users can view their own snapshots
CREATE POLICY "Users can view own snapshots" ON portfolio_snapshots
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own snapshots
CREATE POLICY "Users can insert own snapshots" ON portfolio_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own snapshots (for upsert)
CREATE POLICY "Users can update own snapshots" ON portfolio_snapshots
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own snapshots
CREATE POLICY "Users can delete own snapshots" ON portfolio_snapshots
  FOR DELETE USING (auth.uid() = user_id);
```

**Code References:**
- `src/utils/historyUtils.js`
- `src/pages/Settings.jsx` (for data deletion)

---

### 7️⃣ **`waitlist`** ✅ OPTIONAL (ONLY IF USING WAITLIST FEATURE)

**Purpose:** Stores email addresses for waitlist/early access

#### Required Columns:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Auto-generated |
| `email` | text | NOT NULL, UNIQUE | Email address |
| `created_at` | timestamptz | DEFAULT now() | Signup time |

#### Required Constraints:
- **UNIQUE constraint on `email`** - No duplicate emails

#### RLS Policies:
**Note:** This table may not need RLS if it's public-facing (anonymous inserts allowed).

**Optional Public Insert Policy:**
```sql
-- Allow anyone to insert into waitlist
CREATE POLICY "Anyone can join waitlist" ON waitlist
  FOR INSERT WITH CHECK (true);
```

**Code References:**
- `src/pages/Login.jsx` (registration tab)

---

### 8️⃣ **`profiles`** ❓ OPTIONAL (NOT CURRENTLY USED IN CODE)

**Purpose:** User metadata and roles (mentioned in README but not implemented)

**Status:** This table is **NOT actively used** in the current codebase. You can:
- **Keep it** if you plan to use it for future features (user profiles, roles, etc.)
- **Remove it** if you don't need it

#### If You Keep It (Suggested Columns):
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Auto-generated |
| `user_id` | uuid | NOT NULL, UNIQUE, REFERENCES auth.users(id) ON DELETE CASCADE | FK to auth |
| `full_name` | text | NULLABLE | User's full name |
| `avatar_url` | text | NULLABLE | Profile picture URL |
| `role` | text | DEFAULT 'user' | e.g., "user", "admin" |
| `created_at` | timestamptz | DEFAULT now() | Creation time |
| `updated_at` | timestamptz | DEFAULT now() | Last update |

**Code References:** None (mentioned only in README)

---

## 🔐 Security Checklist

### Row Level Security (RLS)
- [ ] **Enable RLS on ALL tables** (except public tables like `waitlist`)
- [ ] Test that users can only access their own data
- [ ] Test that anonymous users cannot access protected data

### Verification SQL:
```sql
-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Should return TRUE for all tables except possibly 'waitlist'
```

---

## 📋 Quick Verification Checklist

Use this checklist to verify your Supabase setup:

### Tables Exist
- [ ] `holdings`
- [ ] `transactions`
- [ ] `price_alerts`
- [ ] `notifications`
- [ ] `user_settings`
- [ ] `portfolio_snapshots`
- [ ] `waitlist` (optional)
- [ ] `profiles` (optional, not used)

### Critical Columns Check
Run these queries in Supabase SQL Editor to verify column structure:

```sql
-- Check holdings table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'holdings'
ORDER BY ordinal_position;

-- Check transactions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- Check price_alerts table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'price_alerts'
ORDER BY ordinal_position;

-- Check notifications table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Check user_settings table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_settings'
ORDER BY ordinal_position;

-- Check portfolio_snapshots table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'portfolio_snapshots'
ORDER BY ordinal_position;

-- Check waitlist table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'waitlist'
ORDER BY ordinal_position;
```

### Unique Constraints
- [ ] `user_settings.user_id` is UNIQUE
- [ ] `portfolio_snapshots` has UNIQUE constraint on `(user_id, snapshot_date)`
- [ ] `waitlist.email` is UNIQUE

### Foreign Keys
- [ ] All `user_id` columns reference `auth.users(id)` with `ON DELETE CASCADE`

### Indexes for Performance
- [ ] Index on `holdings.user_id`
- [ ] Index on `transactions.user_id`
- [ ] Index on `price_alerts.user_id`
- [ ] Index on `notifications.user_id`
- [ ] Composite index on `portfolio_snapshots(user_id, snapshot_date)`

---

## 🚀 Next Steps

1. **Run the verification queries above** to check your current schema
2. **Compare the output** with the required columns listed
3. **Add any missing columns** using ALTER TABLE commands
4. **Enable RLS** on all tables if not already enabled
5. **Add RLS policies** as shown above
6. **Test the app** to ensure everything works

---

## 📝 SQL Script to Add Missing Columns

If you find any missing columns, here's a template:

```sql
-- Example: Add missing column to existing table
ALTER TABLE holdings 
ADD COLUMN IF NOT EXISTS image text;

ALTER TABLE holdings 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_coin_id ON holdings(coin_id);

-- Enable RLS
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (see above for each table)
```

---

## Summary

✅ **All 8 tables are accounted for**  
✅ **6 tables are actively used** (holdings, transactions, price_alerts, notifications, user_settings, portfolio_snapshots)  
⚠️ **1 table is conditionally used** (waitlist - only if using waitlist feature)  
❓ **1 table is unused** (profiles - mentioned in README but not in code)

**Recommendation:** Keep all tables, but verify that each has the correct columns and RLS policies as listed above.
