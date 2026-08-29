# Supabase Compatibility Check - Phase 11

## Objective
Verify that the new offline-first architecture is compatible with the current Supabase database state without requiring destructive migrations.

## Current Supabase State (from SUPABASE-INSPECTION.md)

### Existing Tables
- ✅ Tenant - Structure correct
- ✅ User - Structure correct  
- ✅ Product - Missing `deletedAt` column
- ✅ Client - Missing `deletedAt` column
- ✅ Sale - Missing `deletedAt` column
- ✅ SyncOutbox - Structure correct

### Missing Tables
- ❌ Activity - Not needed for Phase 1
- ❌ TrashItem - Not needed for Phase 1
- ❌ Plan - Not needed for Phase 1
- ❌ Subscription - Not needed for Phase 1

## New Architecture Requirements vs Current State

### 1. Authentication (Phase 1)
**Required:** Supabase Auth + User table with tenantId
**Current State:** ✅ COMPATIBLE
- Supabase Auth is configured and working
- User table exists with required fields (id, tenantId, email, displayName, etc.)
- No migration needed

### 2. Identity Mapping (Phase 2)
**Required:** User.id, tenantId, storageAccountId mapping
**Current State:** ✅ COMPATIBLE
- User table has all required fields
- No migration needed

### 3. Product Entity (Phase 5)
**Required:** Product table with version field for conflict resolution
**Current State:** ⚠️ PARTIALLY COMPATIBLE
- Product table exists with basic fields
- Missing: `version` field for optimistic concurrency
- Missing: `deletedAt` field for soft delete
- Missing: `syncStatus` field for sync tracking
- Missing: `lastSyncedAt` field for sync tracking

**Solution:** Add these fields via non-destructive migration:
```sql
ALTER TABLE "Product" ADD COLUMN "version" INTEGER DEFAULT 1;
ALTER TABLE "Product" ADD COLUMN "deletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Product" ADD COLUMN "syncStatus" TEXT DEFAULT 'synced';
ALTER TABLE "Product" ADD COLUMN "lastSyncedAt" TIMESTAMP WITH TIME ZONE;
```

### 4. Outbox Pattern (Phase 6)
**Required:** Outbox table with enhanced fields
**Current State:** ⚠️ NEEDS ENHANCEMENT
- SyncOutbox table exists but lacks some fields for new architecture
- Missing: `mutationId` (uses id instead)
- Missing: `entityId` 
- Missing: `entityType`
- Missing: `userId`
- Missing: `deviceId`
- Missing: `version`
- Missing: `status` (has attempts and lastError but not structured status)
- Missing: `nextRetryAt`

**Solution:** Use existing SyncOutbox for compatibility, create new enhanced outbox table:
```sql
CREATE TABLE "OutboxV2" (
  "mutationId" TEXT PRIMARY KEY,
  "entityId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "status" TEXT DEFAULT 'pending',
  "attempts" INTEGER DEFAULT 0,
  "lastAttemptAt" TIMESTAMP WITH TIME ZONE,
  "nextRetryAt" TIMESTAMP WITH TIME ZONE,
  "payload" JSONB NOT NULL,
  "error" TEXT
);
```

### 5. Sync Metadata (Phase 7)
**Required:** Sync metadata tracking
**Current State:** ❌ NOT IMPLEMENTED
- No sync metadata table exists

**Solution:** Create new table:
```sql
CREATE TABLE "SyncMetadata" (
  "key" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Migration Strategy

### Phase 1 - Non-Destructive Migrations Only
1. Add missing columns to Product table (ALTER TABLE)
2. Create OutboxV2 table (CREATE TABLE)
3. Create SyncMetadata table (CREATE TABLE)

### Phase 2 - Data Migration (if needed)
- Migrate existing SyncOutbox data to OutboxV2 if necessary
- Initialize sync metadata for existing tenants

### Phase 3 - Cleanup (Future)
- Once migration is validated, consider deprecating old SyncOutbox
- Add indexes for performance optimization

## RLS Policies Required

### Product Table
```sql
-- Enable RLS
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see products from their tenant
CREATE POLICY "Users can view own tenant products"
  ON "Product" FOR SELECT
  USING (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));

-- Policy: Users can insert products for their tenant
CREATE POLICY "Users can insert own tenant products"
  ON "Product" FOR INSERT
  WITH CHECK (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));

-- Policy: Users can update products in their tenant
CREATE POLICY "Users can update own tenant products"
  ON "Product" FOR UPDATE
  USING (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));

-- Policy: Users can soft delete products in their tenant
CREATE POLICY "Users can delete own tenant products"
  ON "Product" FOR UPDATE
  USING (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()))
  WITH CHECK (deletedAt IS NOT NULL);
```

### OutboxV2 Table
```sql
-- Enable RLS
ALTER TABLE "OutboxV2" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see outbox entries from their tenant
CREATE POLICY "Users can view own tenant outbox"
  ON "OutboxV2" FOR SELECT
  USING (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));

-- Policy: Users can insert outbox entries for their tenant
CREATE POLICY "Users can insert own tenant outbox"
  ON "OutboxV2" FOR INSERT
  WITH CHECK (tenantId IN (SELECT tenantId FROM "User" WHERE id = auth.uid()));
```

## Compatibility Matrix

| Component | Current State | Required Changes | Risk Level |
|-----------|--------------|------------------|------------|
| Supabase Auth | ✅ Working | None | Low |
| User Table | ✅ Compatible | None | Low |
| Tenant Table | ✅ Compatible | None | Low |
| Product Table | ⚠️ Missing fields | Add columns | Low |
| SyncOutbox | ⚠️ Limited fields | Create OutboxV2 | Low |
| Sync Metadata | ❌ Missing | Create table | Low |
| RLS Policies | ⚠️ Unknown | Verify/Add | Medium |

## Rollback Strategy

If issues arise:
1. New tables (OutboxV2, SyncMetadata) can be safely dropped
2. Added columns can be dropped (ALTER TABLE DROP COLUMN)
3. RLS policies can be dropped
4. No existing data will be affected

## Conclusion

The current Supabase state is **compatible** with the new architecture with only **non-destructive additions** required:

1. Add columns to Product table (ALTER TABLE)
2. Create new OutboxV2 table (CREATE TABLE)  
3. Create new SyncMetadata table (CREATE TABLE)
4. Verify and enhance RLS policies

**No destructive operations are required.** The migration is safe and reversible.