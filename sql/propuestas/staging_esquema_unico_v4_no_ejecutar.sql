-- PROPOSAL ONLY. STAGING xqahthghvozeigbojhyi. DO NOT EXECUTE.
-- INCOMPLETE: DO NOT APPLY. Required RPCs and server-side contract not yet migrated.
-- Production schema reconciled for delivery columns and route types; no data operations authorized.
-- Existing public.clientes_oficiales: numero integer PK, codigo text unique,
-- nombre text, auth_user_id uuid nullable, residencia text nullable, creado_en timestamptz.
-- Existing enlace_auth.cliente_credenciales and cliente_sesiones are retained.
BEGIN;
-- Sequence absent in staging (read-only catalog verification on 2026-11-09).
CREATE SEQUENCE IF NOT EXISTS public.clientes_oficiales_numero_seq AS integer START WITH 1;
REVOKE ALL ON SEQUENCE public.clientes_oficiales_numero_seq FROM PUBLIC,anon,authenticated;
GRANT USAGE,SELECT ON SEQUENCE public.clientes_oficiales_numero_seq TO service_role;
ALTER TABLE public.clientes_oficiales
  ADD COLUMN IF NOT EXISTS telefono text,
  ADD COLUMN IF NOT EXISTS correo text,
  ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'pendiente_activacion',
  ADD COLUMN IF NOT EXISTS provincia text,
  ADD COLUMN IF NOT EXISTS municipio text,
  ADD COLUMN IF NOT EXISTS barrio text,
  ADD COLUMN IF NOT EXISTS direccion_habitual text;
-- Residence-dependent invariant: use NOT VALID until historical rows are audited.
DO $guard$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_catalog.pg_constraint
   WHERE conrelid='public.clientes_oficiales'::pg_catalog.regclass
     AND conname='ed_cliente_cuba_direccion_ck'
 ) THEN
   ALTER TABLE public.clientes_oficiales
     ADD CONSTRAINT ed_cliente_cuba_direccion_ck
     CHECK (residencia IS DISTINCT FROM 'cuba' OR
       (nullif(btrim(coalesce(provincia,'')),'') IS NOT NULL AND
        nullif(btrim(coalesce(municipio,'')),'') IS NOT NULL AND
        length(btrim(coalesce(direccion_habitual,''))) >= 8)) NOT VALID;
 END IF;
END $guard$;

CREATE TABLE IF NOT EXISTS public.clientes_destinatarios (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 cliente_numero integer NOT NULL REFERENCES public.clientes_oficiales(numero) ON DELETE CASCADE,
 nombre text NOT NULL CHECK (length(btrim(nombre)) >= 2),
 telefono text NOT NULL CHECK (telefono ~ ('^([+]53)?[0-9]{8}' || chr(36))),
 provincia text NOT NULL, municipio text NOT NULL,
 barrio text NOT NULL DEFAULT '', direccion text NOT NULL CHECK (length(btrim(direccion)) >= 8),
 referencias text NOT NULL DEFAULT '', creado_en timestamptz NOT NULL DEFAULT now(),
 actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ed_destinatarios_cliente_idx ON public.clientes_destinatarios(cliente_numero);

CREATE TABLE IF NOT EXISTS public.clientes_direcciones_entrega (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 cliente_numero integer NOT NULL REFERENCES public.clientes_oficiales(numero) ON DELETE CASCADE,
 nombre_receptor text NOT NULL, telefono_receptor text NOT NULL,
 provincia text NOT NULL, municipio text NOT NULL, barrio text NOT NULL DEFAULT '',
 direccion text NOT NULL CHECK (length(direccion) BETWEEN 8 AND 500),
 referencias text NOT NULL DEFAULT '', latitud double precision CHECK (latitud BETWEEN -90 AND 90),
 longitud double precision CHECK (longitud BETWEEN -180 AND 180),
 distancia_km numeric CHECK (distancia_km >= 0), punto_salida_id text, ruta_version text,
 calculado_en timestamptz, usado_en timestamptz NOT NULL DEFAULT now(),
 creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ed_direcciones_cliente_idx ON public.clientes_direcciones_entrega(cliente_numero);

-- Historical order snapshots are a separate future proposal, not enabled here.
-- No customer policies until authentication/ownership contract is verified.
ALTER TABLE public.clientes_destinatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_direcciones_entrega ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.clientes_destinatarios,public.clientes_direcciones_entrega FROM PUBLIC,anon,authenticated;
REVOKE ALL ON SEQUENCE public.clientes_destinatarios_id_seq,public.clientes_direcciones_entrega_id_seq FROM PUBLIC,anon,authenticated;
-- Explicit grants for the staging Edge service role (RLS remains enabled).
GRANT SELECT,INSERT,UPDATE ON public.clientes_destinatarios,public.clientes_direcciones_entrega TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.clientes_destinatarios_id_seq,public.clientes_direcciones_entrega_id_seq TO service_role;
COMMIT;
