// ENLACE DIGITAL — función de diagnóstico de correo (entorno de preparación).
// No envía mensajes ni permite cambios de contraseñas.
// Desplegada por separado de enlace-cliente-auth para proteger el registro existente.
Deno.serve(async (req: Request) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "https://liuben810921.github.io",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "authorization,apikey,content-type",
  };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Metodo no permitido" }), { status: 405, headers });
  let body: { action?: string };
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "Solicitud invalida" }), { status: 400, headers }); }
  if (body?.action !== "status") return new Response(JSON.stringify({ error: "Operacion no disponible" }), { status: 400, headers });
  return new Response(JSON.stringify({
    stage: "preparacion",
    credential_present: Boolean(Deno.env.get("GMAIL_APP_PASSWORD")),
    smtp_verified: false,
    automatic_emails_enabled: false,
    verification_enabled: false,
    password_recovery_enabled: false,
  }), { status: 200, headers });
});
