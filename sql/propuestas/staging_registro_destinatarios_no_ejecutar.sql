-- PROPOSAL ONLY. STAGING xqahthghvozeigbojhyi. DO NOT EXECUTE.
-- Review server-side Edge Function contract and backup before deployment.
-- Existing public.clientes_oficiales: numero integer PK, codigo text unique,
-- nombre text, auth_user_id uuid nullable, residencia text nullable, creado_en timestamptz.
-- Existing enlace_auth.cliente_credenciales and cliente_sesiones are retained.
BEGIN;
ALTER TABLE public.clientes_oficiales
  ADD COLUMN IF NOT EXISTS telefono text,
  ADD COLUMN IF NOT EXISTS correo text,
  ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'activo',
  ADD COLUMN IF NOT EXISTS provincia text,
  ADD COLUMN IF NOT EXISTS municipio text,
  ADD COLUMN IF NOT EXISTS barrio text,
  ADD COLUMN IF NOT EXISTS direccion_habitual text;
-- Residence-dependent invariant: use NOT VALID until historical rows are audited.
ALTER TABLE public.clientes_oficiales
  ADD CONSTRAINT ed_cliente_cuba_direccion_ck
  CHECK (residencia IS DISTINCT FROM 'cuba' OR
    (nullif(btrim(coalesce(provincia,'')),'') IS NOT NULL AND
     nullif(btrim(coalesce(municipio,'')),'') IS NOT NULL AND
     length(btrim(coalesce(direccion_habitual,''))) >= 8)) NOT VALID;

CREATE TABLE IF NOT EXISTS public.clientes_destinatarios (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 cliente_numero integer NOT NULL REFERENCES public.clientes_oficiales(numero) ON DELETE RESTRICT,
 nombre text NOT NULL CHECK (length(btrim(nombre)) >= 3),
 telefono text NOT NULL CHECK (telefono ~ '^\\+53[0-9]{8}$'),
 provincia text NOT NULL, municipio text NOT NULL,
 barrio text, direccion text NOT NULL CHECK (length(btrim(direccion)) >= 8),
 referencias text, creado_en timestamptz NOT NULL DEFAULT now(),
 actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ed_destinatarios_cliente_idx ON public.clientes_destinatarios(cliente_numero);

CREATE TABLE IF NOT EXISTS public.clientes_direcciones_entrega (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 cliente_numero integer NOT NULL REFERENCES public.clientes_oficiales(numero) ON DELETE RESTRICT,
 nombre_receptor text NOT NULL, telefono_receptor text NOT NULL,
 provincia text NOT NULL, municipio text NOT NULL, barrio text,
 direccion text NOT NULL CHECK (length(btrim(direccion)) >= 8),
 referencias text, creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ed_direcciones_cliente_idx ON public.clientes_direcciones_entrega(cliente_numero);

-- Historical order snapshots are a separate future proposal, not enabled here.
-- No customer policies until authentication/ownership contract is verified.
ALTER TABLE public.clientes_destinatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_direcciones_entrega ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.clientes_destinatarios,public.clientes_direcciones_entrega FROM PUBLIC,anon,authenticated;
REVOKE ALL ON SEQUENCE public.clientes_destinatarios_id_seq,public.clientes_direcciones_entrega_id_seq FROM PUBLIC,anon,authenticated;
COMMIT;
-- The COMMIT above is part of a NON-EXECUTED migration proposal, not a test script.
