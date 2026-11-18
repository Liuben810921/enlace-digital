// Offline strict JSON parser: duplicate keys (including NFC-equivalent) are rejected before JSON.parse.
export function parseStrictJson(raw){
 if(typeof raw!=='string'||raw.length>65536)throw Error('invalid JSON');let i=0;
 const ws=()=>{while(i<raw.length&&/\s/.test(raw[i]))i++};
 const str=()=>{const s=i++;while(i<raw.length){if(raw[i]==='\\'){i+=2;continue}if(raw[i]==='"'){i++;return JSON.parse(raw.slice(s,i))}i++}throw Error('string')};
 const val=(depth=0)=>{if(depth>32)throw Error('depth');ws();const c=raw[i];if(c==='"')return str();
 if(c==='{'){i++;ws();const o={},keys=new Set();if(raw[i]==='}'){i++;return o}while(true){ws();if(raw[i]!=='"')throw Error('key');const k=str(),n=k.normalize('NFC');if(keys.has(n)||['__proto__','constructor','prototype'].includes(n))throw Error('duplicate key');keys.add(n);ws();if(raw[i++]!==':')throw Error('colon');Object.defineProperty(o,k,{value:val(depth+1),enumerable:true,writable:true,configurable:true});ws();if(raw[i]==='}'){i++;return o}if(raw[i++]!==',')throw Error('comma')}}
 if(c==='['){i++;ws();const a=[];if(raw[i]===']'){i++;return a}while(true){a.push(val(depth+1));ws();if(raw[i]===']'){i++;return a}if(raw[i++]!==',')throw Error('comma')}}
 const m=/^(true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(raw.slice(i));if(!m)throw Error('value');i+=m[0].length;const parsed=JSON.parse(m[0]);if(typeof parsed==='number'&&!Number.isFinite(parsed))throw Error('nonfinite');return parsed};
 const r=val();ws();if(i!==raw.length)throw Error('trailing');return r;
}
