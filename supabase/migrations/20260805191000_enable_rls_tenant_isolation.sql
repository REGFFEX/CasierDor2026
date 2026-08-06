-- Enable Row Level Security on all public tables exposed via PostgREST.
-- Multi-tenant isolation: authenticated users only access rows for their tenant.

-- ---------------------------------------------------------------------------
-- Helper: resolve tenant for the current Supabase Auth session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT "tenantId"
  FROM public."User"
  WHERE id = (SELECT auth.uid())::text
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;

-- ---------------------------------------------------------------------------
-- Provision Tenant + User when a Supabase Auth account is created
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id text;
  company_name text;
  display_name text;
BEGIN
  company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', 'Établissement');
  display_name := COALESCE(
    NULLIF(
      TRIM(
        CONCAT(
          COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
          ' ',
          COALESCE(NEW.raw_user_meta_data->>'last_name', '')
        )
      ),
      ''
    ),
    NEW.email
  );
  new_tenant_id := gen_random_uuid()::text;

  INSERT INTO public."Tenant" (id, name, "createdAt", "updatedAt")
  VALUES (new_tenant_id, company_name, NOW(), NOW());

  INSERT INTO public."User" (
    id,
    "tenantId",
    email,
    "passwordHash",
    role,
    "displayName",
    "storageAccountId",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    NEW.id::text,
    new_tenant_id,
    NEW.email,
    '',
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
    display_name,
    NEW.id::text,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();

-- ---------------------------------------------------------------------------
-- Indexes for RLS policy columns
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_tenant_id ON public."User" ("tenantId");
CREATE INDEX IF NOT EXISTS idx_product_tenant_id ON public."Product" ("tenantId");
CREATE INDEX IF NOT EXISTS idx_client_tenant_id ON public."Client" ("tenantId");
CREATE INDEX IF NOT EXISTS idx_sale_tenant_id ON public."Sale" ("tenantId");
CREATE INDEX IF NOT EXISTS idx_sync_outbox_tenant_id ON public."SyncOutbox" ("tenantId");

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public."Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Sale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SyncOutbox" ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Tenant
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_select_own ON public."Tenant";
CREATE POLICY tenant_select_own ON public."Tenant"
  FOR SELECT
  TO authenticated
  USING (id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_update_own ON public."Tenant";
CREATE POLICY tenant_update_own ON public."Tenant"
  FOR UPDATE
  TO authenticated
  USING (id = public.current_tenant_id())
  WITH CHECK (id = public.current_tenant_id());

-- ---------------------------------------------------------------------------
-- User
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS user_select_tenant ON public."User";
CREATE POLICY user_select_tenant ON public."User"
  FOR SELECT
  TO authenticated
  USING ("tenantId" = public.current_tenant_id());

DROP POLICY IF EXISTS user_update_self ON public."User";
CREATE POLICY user_update_self ON public."User"
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid())::text)
  WITH CHECK ("tenantId" = public.current_tenant_id());

-- ---------------------------------------------------------------------------
-- Product, Client, Sale, SyncOutbox (tenant-scoped CRUD)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS product_tenant_all ON public."Product";
CREATE POLICY product_tenant_all ON public."Product"
  FOR ALL
  TO authenticated
  USING ("tenantId" = public.current_tenant_id())
  WITH CHECK ("tenantId" = public.current_tenant_id());

DROP POLICY IF EXISTS client_tenant_all ON public."Client";
CREATE POLICY client_tenant_all ON public."Client"
  FOR ALL
  TO authenticated
  USING ("tenantId" = public.current_tenant_id())
  WITH CHECK ("tenantId" = public.current_tenant_id());

DROP POLICY IF EXISTS sale_tenant_all ON public."Sale";
CREATE POLICY sale_tenant_all ON public."Sale"
  FOR ALL
  TO authenticated
  USING ("tenantId" = public.current_tenant_id())
  WITH CHECK ("tenantId" = public.current_tenant_id());

DROP POLICY IF EXISTS sync_outbox_tenant_all ON public."SyncOutbox";
CREATE POLICY sync_outbox_tenant_all ON public."SyncOutbox"
  FOR ALL
  TO authenticated
  USING ("tenantId" = public.current_tenant_id())
  WITH CHECK ("tenantId" = public.current_tenant_id());
