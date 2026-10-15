import {iso,pct} from './shared.js'
import {MO} from './notes.js'
/* ---- Q&A: answers only from the findings above ---- */
function answer(q,F,A){const ql=q.toLowerCase(),routes=[...new Set(A.map(a=>a.route))],rs=routes.filter(r=>{const[o,d]=r.toLowerCase().split('-');return ql.includes(r.toLowerCase())||(ql.includes(o)&&ql.includes(d))});
const yr=(ql.match(/\b(20\d\d)\b/)||[])[1],mo=MO.findIndex(m=>new RegExp('\\b'+m+'[a-z]*\\b').test(ql))+1;
const ok=r=>{const d=new Date(r.week_of),e=new Date(+d+6*864e5);return(!rs.length||rs.includes(r.route))&&(!yr||d.getUTCFullYear()==yr)&&(!mo||d.getUTCMonth()+1==mo||e.getUTCMonth()+1==mo)};
if(!rs.length&&!yr&&!mo&&!/unexplained|flagged|justified|explained|why/.test(ql))return'Try: "why did Chennai-Bangalore get pricier in March 2025?" or "which routes are unexplained?". Routes: '+routes.join(', ')+'.';
let s=F.filter(ok);if(/unexplained|flagged|no (good )?reason/.test(ql))s=s.filter(r=>r.flagged=='Yes');else if(/justified|explained/.test(ql)&&!/un/.test(ql))s=s.filter(r=>r.flagged!='Yes');
if(!s.length){const b=A.filter(a=>ok({route:a.route,week_of:iso(a.w)}));if(!b.length)return"I have no data matching that route/period, so I can't say.";const h=b.reduce((x,y)=>y.own>x.own?y:x);
return`Nothing was flagged for that selection. The highest weekly reading was ${h.route} (week of ${iso(h.w)}) at ${h.cpt.toFixed(2)} per tonne-km, ${pct(h.own)} vs its own history and ${pct(h.sim)} vs similar routes, which did not meet the flagging rules.`}
return s.length+' finding(s):\n\n'+s.map(r=>`- ${r.route}, week of ${r.week_of}: ${r.cost} per tonne-km (${r.own.split(' vs')[0]} vs own history, ${r.sim.split(' vs')[0]} vs similar) -> ${r.flagged=='Yes'?'UNEXPLAINED':'justified by '+r.note}. ${r.reason}`).join('\n\n')}
export { answer }
