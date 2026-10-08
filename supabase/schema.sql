DROP TABLE IF EXISTS public.profiles;

CREATE TABLE IF NOT EXISTS public.profils (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT,
  prenom TEXT,
  telephone TEXT,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  pays TEXT,
  role TEXT NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profils
  ADD COLUMN IF NOT EXISTS adresse TEXT,
  ADD COLUMN IF NOT EXISTS code_postal TEXT,
  ADD COLUMN IF NOT EXISTS ville TEXT,
  ADD COLUMN IF NOT EXISTS pays TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profils (id, nom, prenom, telephone, adresse, code_postal, ville, pays, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nom', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'prenom', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'telephone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'adresse', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'code_postal', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'ville', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'pays', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'client')
  )
  ON CONFLICT (id) DO UPDATE SET
    nom = EXCLUDED.nom,
    prenom = EXCLUDED.prenom,
    telephone = EXCLUDED.telephone,
    adresse = EXCLUDED.adresse,
    code_postal = EXCLUDED.code_postal,
    ville = EXCLUDED.ville,
    pays = EXCLUDED.pays,
    role = EXCLUDED.role;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_profile_created ON auth.users;
CREATE TRIGGER on_auth_user_profile_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user_profile();

ALTER TABLE public.profils ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profils_select_own" ON public.profils;
CREATE POLICY "profils_select_own"
  ON public.profils
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profils_insert_own" ON public.profils;
CREATE POLICY "profils_insert_own"
  ON public.profils
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profils_update_own" ON public.profils;
CREATE POLICY "profils_update_own"
  ON public.profils
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profils_admin_all" ON public.profils;
CREATE POLICY "profils_admin_all"
  ON public.profils
  FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  total_amount NUMERIC(10,2) NOT NULL,
  mode_retrait TEXT NOT NULL DEFAULT 'retrait',
  adresse_livraison TEXT,
  code_postal TEXT,
  ville TEXT,
  pays TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS mode_retrait TEXT NOT NULL DEFAULT 'retrait',
  ADD COLUMN IF NOT EXISTS adresse_livraison TEXT,
  ADD COLUMN IF NOT EXISTS code_postal TEXT,
  ADD COLUMN IF NOT EXISTS ville TEXT,
  ADD COLUMN IF NOT EXISTS pays TEXT;

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.customers (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
