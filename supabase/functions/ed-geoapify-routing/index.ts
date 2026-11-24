// Staging safety replacement for the legacy ed-geoapify-routing endpoint.
// No auth adapter, database adapter, quota adapter, or provider transport is supplied.
import {handleGatewayRequest} from "./gateway.mjs";
Deno.serve(request=>handleGatewayRequest(request,{env:{
 ED_STAGING_ALLOWED_ORIGIN:Deno.env.get("ED_STAGING_ALLOWED_ORIGIN")??"",
 ED_STAGING_GEOAPIFY_ENABLED:Deno.env.get("ED_STAGING_GEOAPIFY_ENABLED")??"",
 ED_STAGING_GEOAPIFY_NETWORK_ENABLED:Deno.env.get("ED_STAGING_GEOAPIFY_NETWORK_ENABLED")??""
}}));
