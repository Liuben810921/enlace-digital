'use strict';
// Pure offline adapter for OSRM-compatible route JSON. No HTTP or external calls.
// Coordinates are WGS84 decimal degrees; routing engine receives [longitude,latitude].
function validPoint(p){return p&&typeof p.lat==='number'&&typeof p.lng==='number'&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180}
function makeRouteRequest(origin,destination){
 if(!validPoint(origin)||!validPoint(destination))return {ok:false,reason:'invalid_coordinates'};
 return {ok:true,engine:'osrm-compatible',profile:'driving',coordinates:[[origin.lng,origin.lat],[destination.lng,destination.lat]],requiresExternalService:true};
}
function readRouteDistance(response){
 if(!response||response.code!=='Ok'||!Array.isArray(response.routes)||!response.routes.length)return {ok:false,reason:'route_unavailable'};
 const route=response.routes[0];
 if(typeof route.distance!=='number'||!Number.isFinite(route.distance)||route.distance<0)return {ok:false,reason:'invalid_route_distance'};
 return {ok:true,roadDistanceKm:route.distance/1000,source:'osrm-compatible-route-response'};
}
module.exports={makeRouteRequest,readRouteDistance};
