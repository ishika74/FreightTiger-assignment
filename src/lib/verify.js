import {CFG,iso,pct} from './shared.js'
import {covers,gap,first} from './notes.js'
import {index} from './retrieval.js'
/* ---- verification gate: every check must pass for a note to justify a flag ---- */
function check(n,route,w,own,sim){const span=`${iso(w)} to ${iso(w+6)}`;
if(!covers(n,route))return{ok:0,g:'scope',d:'its scope does not include this route'};
if(!n.raises)return{ok:0,g:'polarity',d:'it does not describe a cost rise on this route'};
if(!(n.s<=w+6&&w<=n.e))return{ok:0,g:'window',d:`it covers ${iso(n.s)} to ${iso(n.e)}, which does not include the week ${span}`};
if(n.scope.has('all routes')&&sim>=CFG.PEER)return{ok:0,g:'peers',d:`it affects all routes, yet this route is ${pct(sim)} above similar routes, so a market-wide factor cannot account for the gap`};
if(n.mag&&own>n.mag[1]+CFG.TOL)return{ok:0,g:'magnitude',d:`it cites about ${Math.round(n.mag[0]*100)}%-${Math.round(n.mag[1]*100)}% but this route rose ${pct(own)} vs its own history`};
return{ok:1}}
function judge(c,route,w,own,sim){const v=c.map(x=>({...x,v:check(x.n,route,w,own,sim)})),ok=v.filter(x=>x.v.ok).sort((a,b)=>(a.n.scope.has('all routes')-b.n.scope.has('all routes'))||b.s-a.s||(a.n.id<b.n.id?-1:1));
if(ok.length)return[ok[0].n,[]];return[null,v.filter(x=>x.n.scope.size&&gap(x.n,w)<=CFG.NEAR).sort((a,b)=>gap(a.n,w)-gap(b.n,w)||(a.n.id<b.n.id?-1:1)).slice(0,2)]}
function explain(n,w,own){const sp=`${iso(w)} to ${iso(w+6)}`;let when=n.kind=='explicit'?`The week ${sp} falls inside the window the note states (${iso(n.s)} to ${iso(n.e)}).`:n.kind=='open_ended'?`The note says the increase starts the week of ${iso(n.s)}; week ${sp} is within the first 8 weeks, before the trailing baseline has absorbed it.`:`The week ${sp} is the week the note refers to.`;
const mg=n.mag?` The observed ${pct(own)} vs this route's own history is in line with the note's ${Math.round(n.mag[0]*100)}%-${Math.round(n.mag[1]*100)}% rise (allowing about 5 points of normal weekly noise).`:'';
return `Matches note ${n.id} dated ${n.date} (${n.applies}): "${n.text}" ${when}${mg} The cost rise has a clear explanation.`}
function unexplained(near){if(!near.length)return'No matching note found for this route or date range. Cost rise looks unexplained and worth a human review.';
const p=near.map(x=>x.v.g=='polarity'?`${x.n.id} (${x.n.date}) says "${first(x.n)}" -- it does not describe a reason for a cost rise on this route`:`${x.n.id} (${x.n.date}, ${x.n.applies}) is rejected because ${x.v.d}`);
return`${near.length>1?'Closest notes considered: ':'Closest note considered: '}${p.join('; ')}. No genuine justification found; flagged for review.`}
function findings(A,notes){const search=index(notes);return A.filter(e=>e.cand).map(e=>{const[n,near]=judge(search(e.route),e.route,e.w,e.own,e.sim);
return{route:e.route,week_of:iso(e.w),cost:e.cpt.toFixed(2),own:pct(e.own)+" vs this route's past average",sim:pct(e.sim)+' vs similar-length routes this week',
flagged:n?'No (justified)':'Yes',note:n?n.id:'',reason:n?explain(n,e.w,e.own):unexplained(near)}})}
export { check, judge, explain, unexplained, findings }
