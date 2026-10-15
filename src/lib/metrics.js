import {CFG,day,iso,mon,mean} from './shared.js'
/* ---- metrics: weekly cost per tonne-km + the two baselines ---- */
function weekly(rows){const m=new Map();for(const r of rows){const q=+r.quantity_tonnes,k=+r.distance_km,c=+r.freight_cost_inr,d=Date.parse(r.shipment_date);
if(!(q>0&&k>0&&c>0)||isNaN(d))continue;const route=r.origin.trim()+'-'+r.destination.trim(),w=mon(day(r.shipment_date)),key=route+'|'+r.route_type+'|'+w;
const e=m.get(key)||{route,type:r.route_type,w,c:0,tk:0};e.c+=c;e.tk+=q*k;m.set(key,e)}
const A=[...m.values()].map(e=>({...e,cpt:e.c/e.tk})).sort((a,b)=>a.route<b.route?-1:a.route>b.route?1:a.w-b.w),by={};
for(const e of A){const h=(by[e.route]??=[]),p=h.slice(-CFG.BASE).map(x=>x.cpt);e.n=p.length;e.base=p.length?mean(p):NaN;e.own=e.cpt/e.base-1;h.push(e)}
for(const e of A){const p=A.filter(x=>x.type==e.type&&x.w==e.w&&x.route!=e.route);e.peer=p.length?mean(p.map(x=>x.cpt)):NaN;e.sim=e.cpt/e.peer-1;
e.cand=e.n>=CFG.MINH&&(e.own>=CFG.OWN||(e.sim>=CFG.PEER&&e.own>=CFG.PMIN))}return A}
export { weekly }
