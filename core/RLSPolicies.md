# RLS (Row Level Security) Policies - Phase 12

## Objective
Verify and define RLS policies to ensure tenant isolation and data security in the new offline-first architecture.

## Current RLS Status
The current RLS policy status is unknown from the Supabase inspection. We need to:
1. Verify existing RLS policies on all tables
2. Ensure proper tenant isolation
3. Implement policies for new tables (OutboxV2, SyncMetadata)

## RLS Policy Principles

### Core Principles
1. **Tenant Isolation**: Users can only access data from their own tenant
2. **User Context**: All policies must use `auth.uid()` to identify the current user
3. **Tenant Resolution**: Use User table to map auth.uid() to tenantId
4. **Defense in Depth**: Apply policies at table level for SELECT, INSERT, UPDATE, DELETE

### Tenant Resolution Pattern
All policies use this pattern to resolve tenantId from auth.uid():
```sql
tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid())
```

## Required RLS Policies

### 1. User Table Policies

```sql
-- Enable RLS on User table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON "User" FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON "User" FOR UPDATE
  USING (id = auth.uid());

-- Insert is handled by Supabase Auth triggers/backend
```

### 2. Tenant Table Policies

```sql
-- Enable RLS on Tenant table
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;

-- Users can view their own tenant
CREATE POLICY "Users can view own tenant"
  ON "Tenant" FOR SELECT
  USING (id IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));

-- Updates to tenant should be restricted to admins
CREATE POLICY "Admins can update tenant"
  ON "Tenant" FOR UPDATE
  USING (
    id IN (SELECT tenantId FROM "User" WHERE id = auth.uid())
    AND auth.uid() IN (
      SELECT id FROM "User" 
      WHERE tenantId = "Tenant".id 
      AND role = 'ADMIN'
    )
  );
```

### 3. Product Table Policies

```sql
-- Enable RLS on Product table
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;

-- Users can view products from their tenant
CREATE POLICY "Users can view own tenant products"
  ON "Product" FOR SELECT
  USING (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));

-- Users can insert products for their tenant
CREATE POLICY "Users can insert own tenant products"
  ON "Product" FOR INSERT
  WITH CHECK (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));

-- Users can update products in their tenant
CREATE POLICY "Users can update own tenant products"
  ON "Product" FOR UPDATE
  USING (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));

-- Users can soft delete products in their tenant
CREATE POLICY "Users can soft delete own tenant products"
  ON "Product" FOR UPDATE
  USING (
    tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid())
    AND deletedAt IS NULL
  )
  WITH CHECK (deletedAt IS NOT NULL);
```

### 4. Client Table Policies

```sql
-- Enable RLS on Client table
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;

-- Users can view clients from their tenant
CREATE POLICY "Users can view own tenant clients"
  ON "Client" FOR SELECT
  USING (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));

-- Users can insert clients for their tenant
CREATE POLICY "Users can insert own tenant clients"
  ON "Client" FOR INSERT
  WITH CHECK (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));

-- Users can update clients in their tenant
CREATE POLICY "Users can update own tenant clients"
  ON "Client" FOR UPDATE
  USING (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));
```

### 5. Sale Table Policies

```sql
-- Enable RLS on Sale table
ALTER TABLE "Sale" ENABLE ROW LEVEL SECURITY;

-- Users can view sales from their tenant
CREATE POLICY "Users can view own tenant sales"
  ON "Sale" FOR SELECT
  USING (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));

-- Users can insert sales for their tenant
CREATE POLICY "Users can insert own tenant sales"
  ON "Sale" FOR INSERT
  WITH CHECK (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));

-- Users can update sales in their tenant
CREATE POLICY "Users can update own tenant sales"
  ON "Sale" FOR UPDATE
  USING (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));
```

### 6. SyncOutbox Table Policies (Existing)

```sql
-- Enable RLS on SyncOutbox table
ALTER TABLE "SyncOutbox" ENABLE ROW LEVEL SECURITY;

-- Users can view outbox entries from their tenant
CREATE POLICY "Users can view own tenant outbox"
  ON "SyncOutbox" FOR SELECT
  USING (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));

-- Users can insert outbox entries for their tenant
CREATE POLICY "Users can insert own tenant outbox"
  ON "SyncOutbox" FOR INSERT
  WITH CHECK (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));

-- Users can update outbox entries in their tenant
CREATE POLICY "Users can update own tenant outbox"
  ON "SyncOutbox" FOR UPDATE
  USING (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));
```

### 7. OutboxV2 Table Policies (New)

```sql
-- Enable RLS on OutboxV2 table
ALTER TABLE "OutboxV2" ENABLE ROW LEVEL SECURITY;

-- Users can view outbox entries from their tenant
CREATE POLICY "Users can view own tenant outbox"
  ON "OutboxV2" FOR SELECT
  USING (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));

-- Users can insert outbox entries for their tenant
CREATE POLICY "Users can insert own tenant outbox"
  ON "OutboxV2" FOR INSERT
  WITH CHECK (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));

-- Users can update outbox entries in their tenant
CREATE POLICY "Users can update own tenant outbox"
  ON "OutboxV2" FOR UPDATE
  USING (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));
```

### 8. SyncMetadata Table Policies (New)

```sql
-- Enable RLS on SyncMetadata table
ALTER TABLE "SyncMetadata" ENABLE ROW LEVEL SECURITY;

-- Users can view sync metadata from their tenant
CREATE POLICY "Users can view own tenant sync metadata"
  ON "SyncMetadata" FOR SELECT
  USING (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));

-- Users can insert sync metadata for their tenant
CREATE POLICY "Users can insert own tenant sync metadata"
  ON "SyncMetadata" FOR INSERT
  WITH CHECK (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));

-- Users can update sync metadata in their tenant
CREATE POLICY "Users can update own tenant sync metadata"
  ON "SyncMetadata" FOR UPDATE
  USING (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));
```

## RLS Verification Checklist

### Pre-Implementation Verification
- [ ] Check if RLS is enabled on all tables
- [ ] Document existing RLS policies
- [ ] Identify any missing policies
- [ ] Test tenant isolation with multiple test accounts

### Post-Implementation Verification
- [ ] Verify RLS is enabled on all tables
- [ ] Test cross-tenant access is blocked
- [ ] Test same-tenant access works correctly
- [ ] Test INSERT operations respect tenant isolation
- [ ] Test UPDATE operations respect tenant isolation
- [ ] Test soft delete operations work correctly
- [ ] Verify policies use auth.uid() correctly

## Testing Scenarios

### Scenario 1: Cross-Tenant Access Prevention
```sql
-- Setup: User A (Tenant A) and User B (Tenant B)
-- Test: User A tries to access Tenant B's products
-- Expected: Access denied
```

### Scenario 2: Same-Tenant Access Success
```sql
-- Setup: User A (Tenant A) with products in Tenant A
-- Test: User A accesses their own products
-- Expected: Access granted
```

### Scenario 3: Insert with Correct Tenant
```sql
-- Setup: User A (Tenant A)
-- Test: User A inserts product with tenantId = Tenant A
-- Expected: Insert succeeds
```

### Scenario 4: Insert with Wrong Tenant
```sql
-- Setup: User A (Tenant A)
-- Test: User A tries to insert product with tenantId = Tenant B
-- Expected: Insert denied
```

## RLS Performance Considerations

### Indexes for RLS Performance
```sql
-- Index on User.id for auth.uid() lookups
CREATE INDEX IF NOT EXISTS "user_id_idx" ON "User"(id);

-- Index on User.tenantId for tenant resolution
CREATE INDEX IF NOT EXISTS "user_tenantid_idx" ON "User"(tenantId);

-- Index on Product.tenantId for tenant filtering
CREATE INDEX IF NOT EXISTS "product_tenantid_idx" ON "Product"(tenantId);

-- Index on Client.tenantId for tenant filtering
CREATE INDEX IF NOT EXISTS "client_tenantid_idx" ON "Client"(tenantId);

-- Index on Sale.tenantId for tenant filtering
CREATE INDEX IF NOT EXISTS "sale_tenantid_idx" ON "Sale"(tenantId);
```

## Security Considerations

### 1. No Public Access
Ensure no policies allow public access:
```sql
-- Check for policies using 'anon' role
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND (policyname LIKE '%public%' OR policyname LIKE '%anon%');
```

### 2. Service Role Considerations
Service role bypasses RLS - ensure service role is only used in backend:
```sql
-- Service role should only be used in:
-- - Edge functions
-- - Database triggers
-- - Backend services
-- Never in client-side code
```

### 3. Function Security
If using database functions, ensure they respect RLS:
```sql
-- Functions should be SECURITY DEFINER and check tenant
CREATE OR REPLACE FUNCTION get_tenant_products(tenant_id TEXT)
RETURNS TABLE (...) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM "Product"
  WHERE tenantId = tenant_id
  AND tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid());
END;
$$;
```

## Migration Steps

### Step 1: Enable RLS on All Tables
```sql
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SyncOutbox" ENABLE ROW LEVEL SECURITY;
```

### Step 2: Drop Existing Policies (if any)
```sql
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON "User";
-- ... repeat for all existing policies
```

### Step 3: Create New Policies
-- Apply all policies defined above in order

### Step 4: Verify Policies
```sql
-- Check all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Step 5: Test Policies
-- Run testing scenarios to verify tenant isolation

## Rollback Strategy

If RLS policies cause issues:
1. Disable RLS on affected tables: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`
2. Restore previous policies if needed
3. Investigate and fix issues
4. Re-enable RLS with corrected policies

## Conclusion

RLS policies are critical for tenant isolation and data security. The policies defined above ensure:
- ✅ Complete tenant isolation
- ✅ User context enforcement via auth.uid()
- ✅ Proper access control for all operations
- ✅ Defense in depth across all tables
- ✅ Performance optimization with proper indexes

These policies should be implemented and thoroughly tested before production deployment.