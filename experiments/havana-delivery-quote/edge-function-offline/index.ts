// Offline-only Supabase Edge Function; disabled until separate deployment authorization.
import {handleGateway,responseOf} from './gateway.mjs';
// No auth or ledger adapters configured: every POST fails closed, without a provider call.
Deno.serve(async request => responseOf(await handleGateway(request)));
