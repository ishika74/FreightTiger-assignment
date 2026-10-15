const CFG={BASE:8,MINH:4,OWN:.10,PEER:.20,PMIN:.03,TOL:.05,NEAR:35};
const SAMPLE_NOTES=`note_id,date,applies_to,note
N001,2025-02-24,Chennai-Bangalore,"Heavy flooding on the Chennai-Bangalore highway disrupted normal truck movement from Feb 24 to Mar 8, forcing longer detours and higher trip costs. Roads were passable again by Mar 9."
N002,2025-01-20,Ahmedabad-Mumbai,A regional festival week saw a temporary surcharge applied by transporters on the Ahmedabad-Mumbai corridor due to high demand and limited truck availability.
N003,2025-05-05,All Routes,"Diesel prices rose nationwide starting this week, pushing up transportation costs across all routes by roughly 5-7%."
N004,2024-03-11,All Routes,"A new toll plaza was commissioned on a national highway stretch, but the affected routes are not part of this dataset."
N005,2024-07-29,Mumbai-Delhi,Scheduled highway maintenance work between Mumbai and Delhi caused minor delays for about a week; costs were not significantly affected.
N006,2025-09-22,All Routes,A logistics industry report noted overall demand for freight capacity remained stable this quarter with no major disruptions reported.
N007,2024-05-20,Delhi-Jaipur,Local authorities announced improved road conditions on the Delhi-Jaipur stretch after resurfacing work was completed.
N008,2025-06-09,Kolkata-Bhubaneswar,No significant disruptions were reported on the Kolkata-Bhubaneswar corridor this quarter; freight movement remained normal.
N009,2025-03-17,Chennai-Bangalore,Highway authorities confirmed the Chennai-Bangalore route returned to normal conditions after flood-related repairs were completed.
N010,2025-10-27,All Routes,A new vehicle tracking mandate was introduced for commercial fleets; compliance costs were absorbed by transporters without a rate change.`;
function parseCSV(t){const R=[];let r=[],f='',q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++}else q=false}else f+=c}else if(c=='"')q=true;else if(c==','){r.push(f);f=''}else if(c=='\n'||c=='\r'){if(c=='\r'&&t[i+1]=='\n')i++;r.push(f);f='';if(r.length>1||r[0]!=='')R.push(r);r=[]}else f+=c}
if(f!==''||r.length){r.push(f);R.push(r)}const h=R.shift().map(x=>x.trim());return R.map(a=>Object.fromEntries(h.map((k,i)=>[k,a[i]])))}
const day=s=>Date.UTC(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10))/864e5,iso=d=>new Date(d*864e5).toISOString().slice(0,10),mon=d=>d-((d+3)%7);
const pct=x=>(x>=0?'+':'')+(x*100).toFixed(1)+'%',mean=a=>a.reduce((s,x)=>s+x,0)/a.length;

function csvOut(F){const h=['route','week_of','cost_per_tonne_km','vs_own_history','vs_similar_routes','flagged','matched_note_id','reason'],q=v=>/[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;
return[h.join(','),...F.map(r=>[r.route,r.week_of,r.cost,r.own,r.sim,r.flagged,r.note,r.reason].map(q).join(','))].join('\n')+'\n'}
export { CFG, SAMPLE_NOTES, parseCSV, day, iso, mon, pct, mean, csvOut }
