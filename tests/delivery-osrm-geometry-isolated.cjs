'use strict';
// Pure offline OSRM GeoJSON LineString validator. Does not invent a route or fetch tiles.
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const valid=p=>Array.isArray(p)&&p.length===2&&finite(p[0])&&finite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;
function readOsrmGeometry(response,{maxPoints=20000}={}){
 const fail=reason=>({ok:false,reason,feeStatus:'pending_confirmation'});
 if(response?.code!=='Ok'||!Array.isArray(response.routes)||!response.routes.length)return fail('route_unavailable');
 const r=response.routes[0],g=r?.geometry;
 if(!g||g.type!=='LineString'||!Array.isArray(g.coordinates)||g.coordinates.length<2||g.coordinates.length>maxPoints)return fail('invalid_geometry');
 if(!g.coordinates.every(valid))return fail('invalid_coordinates');
 if(!finite(r.distance)||r.distance<0)return fail('invalid_route_distance');
 return {ok:true,coordinates:g.coordinates.map(p=>[...p]),distanceMeters:r.distance,requiresTrustedBackend:true};
}
function geometryToSvgPath(geometry,{width=360,height=220,padding=18}={}){
 if(!geometry?.ok||!Array.isArray(geometry.coordinates))return {ok:false,reason:'unverified_geometry'};
 const xs=geometry.coordinates.map(p=>p[0]),ys=geometry.coordinates.map(p=>p[1]);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 if(maxX===minX&&maxY===minY)return {ok:false,reason:'degenerate_geometry'};
 const scale=Math.min((width-2*padding)/(maxX-minX||1e-10),(height-2*padding)/(maxY-minY||1e-10));
 const x0=(width-(maxX-minX)*scale)/2,y0=(height-(maxY-minY)*scale)/2;
 const points=geometry.coordinates.map(([lng,lat])=>[Math.round((x0+(lng-minX)*scale)*100)/100,Math.round((height-y0-(lat-minY)*scale)*100)/100]);
 return {ok:true,path:points.map(([x,y],i)=>(i?'L':'M')+x+' '+y).join(' '),points,schematic:true};
}
module.exports={readOsrmGeometry,geometryToSvgPath};
