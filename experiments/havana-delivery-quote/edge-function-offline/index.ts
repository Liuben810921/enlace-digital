// Offline-only Supabase Edge Function skeleton. Not deployed; no provider or secrets.
// Intentionally rejects every request until identity verification and atomic ledger are implemented.
Deno.serve(async (request: Request): Promise<Response> => {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({status:'PENDIENTE',reason:'METHOD_NOT_ALLOWED',feeCup:null,routes:[]}),{status:405,headers});
  }
  // No JWT parsing or trust in client-provided role. Server verification must precede enabling.
  return new Response(JSON.stringify({status:'PENDIENTE',reason:'GATEWAY_NOT_ENABLED',feeCup:null,routes:[]}),{status:503,headers});
});
