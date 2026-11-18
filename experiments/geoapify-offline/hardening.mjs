import {createHash} from 'node:crypto';
export function canonical(value) {
  if(value===null)return 'null';
  if(typeof value==='string')return JSON.stringify(value.normalize('NFC'));
  if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(Object.is(value,-0)?0:value);
  if(typeof value==='boolean')return String(value);
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(typeof value==='object'&&Object.getPrototypeOf(value)===Object.prototype){const keys=Object.keys(value).sort();if(keys.some(k=>k==='__proto__'||k==='constructor'||k==='prototype'))throw Error('unsafe key');return '{'+keys.map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}'}
  throw Error('invalid payload');
}
export function operationHash(identity,payload){if(typeof identity!=='string'||!identity.trim()||identity.length>128)throw Error('invalid identity');return createHash('sha256').update(canonical({identity,payload})).digest('hex')}
