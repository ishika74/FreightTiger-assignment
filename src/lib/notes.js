import {CFG,day,iso,mon} from './shared.js'
/* ---- notes -> structured facts (fails closed) ---- */
const MO='jan feb mar apr may jun jul aug sep oct nov dec'.split(' '),norm=s=>s.replace(/[\s\u2013\u2014]+/g,' ').trim().toLowerCase();
const NOIMP=[/not significantly affected/,/no significant/,/no major disruption/,/without a rate change/,/returned to normal/,/remained normal/,/remained stable/,/improved road conditions/,/no rate change/,/not affected/];
const POS=[/surcharge/,/pushing up/,/higher (trip )?costs?/,/prices? rose/,/costs? (rose|increased)/,/rate (hike|increase)/];
function parseNote(r){const nd=day(r.date),t=r.note.trim(),low=t.toLowerCase(),y=new Date(nd*864e5).getUTCFullYear();let s,e,kind='single_week',m;
if((m=t.match(/from ([A-Za-z]{3,9})\.? (\d{1,2}) (?:to|until|through|-) ([A-Za-z]{3,9})\.? (\d{1,2})/))&&MO.includes(m[1].slice(0,3).toLowerCase())&&MO.includes(m[3].slice(0,3).toLowerCase())){
s=Date.UTC(y,MO.indexOf(m[1].slice(0,3).toLowerCase()),+m[2])/864e5;e=Date.UTC(y,MO.indexOf(m[3].slice(0,3).toLowerCase()),+m[4])/864e5;if(e<s)e=Date.UTC(y+1,MO.indexOf(m[3].slice(0,3).toLowerCase()),+m[4])/864e5;kind='explicit'}
else if(/starting this week|from this week/i.test(t)){s=mon(nd);e=s+CFG.BASE*7-1;kind='open_ended'}
else if((m=t.match(/for (?:about |around )?(a|one|two|three|\d+) weeks?/i))){s=nd;e=nd+({a:1,one:1,two:2,three:3}[m[1].toLowerCase()]||+m[1])*7-1;kind='duration'}
else{s=mon(nd);e=s+6}
const mg=t.match(/(\d+(?:\.\d+)?)\s*[-\u2013]\s*(\d+(?:\.\d+)?)\s*%/);
return{id:r.note_id.trim(),date:r.date,applies:r.applies_to.trim(),text:t.replace(/\s+/g,' '),s,e,kind,
scope:/not part of this dataset|not in this dataset/.test(low)?new Set():new Set(r.applies_to.split(/[;,]/).map(norm).filter(Boolean)),
raises:POS.some(p=>p.test(low))&&!NOIMP.some(p=>p.test(low)),mag:mg?[+mg[1]/100,+mg[2]/100]:null}}
const covers=(n,r)=>n.scope.has('all routes')||n.scope.has(r.toLowerCase());
const gap=(n,w)=>n.s<=w+6&&w<=n.e?0:w>n.e?w-n.e:n.s-(w+6),first=n=>n.text.split(/(?<=\.)\s/)[0].replace(/[.;, ]+$/,'');
export { MO, norm, parseNote, covers, gap, first }
