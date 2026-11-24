// STAGING-ONLY entrypoint. The provider is deliberately not connected.
// Authentication and quota adapters remain absent, so every enabled request fails closed.
import {handleGatewayRequest} from "./gateway.mjs";
export {validateRequest,parseRouteResponse,authorizeOperator,authorizeRoutePreflight,hashRequest} from "./gateway.mjs";

Deno.serve(request=>handleGatewayRequest(request,{env:{
 ED_STAGING_ALLOWED_ORIGIN:Deno.env.get("ED_STAGING_ALLOWED_ORIGIN")??"",
 ED_STAGING_GEOAPIFY_ENABLED:Deno.env.get("ED_STAGING_GEOAPIFY_ENABLED")??"",
 ED_STAGING_GEOAPIFY_NETWORK_ENABLED:Deno.env.get("ED_STAGING_GEOAPIFY_NETWORK_ENABLED")??""
}}));
