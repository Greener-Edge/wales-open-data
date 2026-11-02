const andList=a=>a.length<2?a.join(""):a.slice(0,-1).join(", ")+" and "+a[a.length-1];
function makeFindings(L){if(!L.items||!L.items.length)return[];
const it=L.items,useS=L.useSpend,unit=useS?"spend":"ingredients",ukw=FD.ukt[L.key];
const flagged=k=>[...new Set(it.filter(x=>x.fl[k]).map(x=>x.name))];const clean=[...new Set(it.filter(x=>!["w","dr","fl","d"].some(k=>x.fl[k])).map(x=>x.name))];
const F=[];
if(L.topC&&L.topC[1]/L.TW>=.3)F.push(Math.round(L.topC[1]/L.TW*100)+"% of your "+unit+" comes from one country, "+C[L.topC[0]].n+". A poor harvest or disruption there would hit a large share of your purchasing.");
if(flagged("d").length)F.push(andList(flagged("d"))+(flagged("d").length>1?" are":" is")+" linked to deforestation risk at the chosen origin. Traceability to farm or plantation level is the key question for suppliers.");
const ws=L.share("w"),dr=L.share("dr");if(ws>=10)F.push(Math.round(ws)+"% of your "+unit+" comes from origins with high or extremely high water stress on farmland"+(flagged("w").length?" ("+andList(flagged("w"))+")":"")+".");
if(dr>=10)F.push(Math.round(dr)+"% comes from origins with medium-high or high drought risk for farming.");
if(L.tavg!=null)F.push("Your origins are projected to warm by about "+L.tavg.toFixed(1)+"°C on average by the "+L.lab+(ukw!=null?", compared with "+ukw.toFixed(1)+"°C for the UK":"")+".");
if(clean.length)F.push("No major flags for "+andList(clean)+" at the chosen origins.");
return F}
function renderFindings(){const F=makeFindings(last),el=document.getElementById("rfind");if(el)el.innerHTML=F.length?'<h3>Key findings</h3><ul>'+F.map(f=>"<li>"+f+"</li>").join("")+"</ul>":""}
/* Supply chain checker site. Data globals: FD, WG (loaded by load.js). */
const C=FD.c,P=FD.p,FAM=FD.fam,GN=FD.gn,nf=new Intl.NumberFormat("en-GB");
const WL=["Low","Low to medium","Medium to high","High","Extremely high"],DL=["Low","Low to medium","Medium","Medium to high","High"];
const PI={};P.forEach((p,i)=>PI[p.n.toLowerCase()]=i);
const SHORT={"Meat of cattle boneless, fresh or chilled":"Beef (boneless, fresh)","Meat of chickens, fresh or chilled":"Chicken (fresh)","Cheese from whole cow milk":"Cheese","Butter of cow milk":"Butter","Tomatoes, peeled (o/t vinegar)":"Tinned tomatoes","Uncooked pasta, not stuffed or otherwise prepared":"Dried pasta","Chillies and peppers, green (Capsicum spp. and Pimenta spp.)":"Peppers and chillies","Raw cane or beet sugar (centrifugal only)":"Raw sugar","Hen eggs in shell, fresh":"Eggs","Lettuce and chicory":"Lettuce"};
const disp=n=>SHORT[n]?SHORT[n]+" ("+n+")":n;
const dl=document.getElementById("plist");const opts=P.map((p,i)=>[disp(p.n),i]).sort((a,b)=>a[0].localeCompare(b[0]));const DI={};opts.forEach(([t,i])=>{DI[t.toLowerCase()]=i;const o=document.createElement("option");o.value=t;dl.appendChild(o)});
const ctry=Object.keys(C).filter(k=>C[k].w!==undefined||C[k].t).sort((a,b)=>C[a].n.localeCompare(C[b].n));
const KEY="ge-supply-checker-v1";let rows=[];
function load(){try{const s=localStorage.getItem(KEY);if(s)rows=JSON.parse(s)||[]}catch(e){}if(!rows.length)rows=[{p:"",o:"",s:""},{p:"",o:"",s:""},{p:"",o:"",s:""}]}
function save(){try{localStorage.setItem(KEY,JSON.stringify(rows))}catch(e){}}
const tb=document.querySelector("#ing tbody");
function pidx(t){if(!t)return null;const k=t.toLowerCase();if(DI[k]!==undefined)return DI[k];if(PI[k]!==undefined)return PI[k];return null}
function originOpts(i,sel){const p=i!=null?P[i]:null;const sup=p?Object.entries(p.c).sort((a,b)=>b[1]-a[1]).slice(0,8).map(x=>x[0]).filter(k=>C[k]):[];
let h='<option value="">Origin unknown (UK import mix)</option>';if(sup.length)h+='<optgroup label="Main UK suppliers of this food">'+sup.map(k=>'<option value="'+k+'"'+(k===sel?" selected":"")+'>'+C[k].n+'</option>').join("")+'</optgroup>';
h+='<optgroup label="All countries">'+ctry.map(k=>'<option value="'+k+'"'+(k===sel&&!sup.includes(k)?" selected":"")+'>'+C[k].n+'</option>').join("")+'</optgroup>';return h}
function renderRows(){tb.innerHTML=rows.map((r,j)=>{const i=pidx(r.p);return'<tr data-j="'+j+'"><td><input list="plist" class="pin'+(r.p&&i==null?" bad":"")+'" value="'+(r.p||"").replace(/"/g,"&quot;")+'" placeholder="e.g. Cocoa beans" aria-label="Ingredient"></td><td><select class="oin" aria-label="Origin">'+originOpts(i,r.o)+'</select></td><td><input class="sin" type="number" min="0" step="100" inputmode="numeric" value="'+(r.s||"")+'" placeholder="e.g. 25000" aria-label="Annual spend"></td><td><button class="rm" type="button" aria-label="Remove ingredient">×</button></td></tr>'}).join("");
tb.querySelectorAll("tr").forEach(tr=>{const j=+tr.dataset.j,pin=tr.querySelector(".pin"),oin=tr.querySelector(".oin"),sin=tr.querySelector(".sin");
pin.addEventListener("change",()=>{rows[j].p=pin.value;const i=pidx(pin.value);pin.classList.toggle("bad",!!pin.value&&i==null);oin.innerHTML=originOpts(i,rows[j].o);save();compute()});
oin.addEventListener("change",()=>{rows[j].o=oin.value;save();compute()});sin.addEventListener("input",()=>{rows[j].s=sin.value;save();compute()});
tr.querySelector(".rm").onclick=()=>{rows.splice(j,1);if(!rows.length)rows.push({p:"",o:"",s:""});save();renderRows();compute()}});
const bad=rows.filter(r=>r.p&&pidx(r.p)==null).length;document.getElementById("rowmsg").textContent=bad?bad+" ingredient"+(bad>1?"s aren't":" isn't")+" recognised. Pick a name from the list as you type.":""}
document.getElementById("addrow").onclick=()=>{rows.push({p:"",o:"",s:""});save();renderRows();tb.querySelector("tr:last-child .pin").focus()};
document.getElementById("clearall").onclick=()=>{rows=[{p:"",o:"",s:""}];save();renderRows();compute()};
document.getElementById("example").onclick=()=>{rows=[["Cocoa beans","CIV",30000],["Cocoa beans","GHA",12000],["Cocoa butter, fat and oil","CIV",8000],["Raw cane or beet sugar (centrifugal only)","",18000],["Whole milk powder","IRL",15000],["Hazelnuts, shelled","TUR",12000],["Palm oil","IDN",6000],["Almonds, shelled","USA",9000],["Vanilla, raw","MDG",3000]].map(([p,o,s])=>({p:PI[p.toLowerCase()]!=null?disp(P[PI[p.toLowerCase()]].n):p,o,s:String(s)}));save();renderRows();compute()};
function mixRisk(i,key){const p=P[i],t=Object.values(p.c).reduce((a,b)=>a+b,0);let w=0,w5=0,dr=0,fl=0,tw=0,twd=0,known=0;for(const k in p.c){const v=p.c[k],c=C[k];if(!c)continue;known+=v;if(c.w>=3)w+=v;if(c.wf&&c.wf[key]>=3)w5+=v;if(c.dr>=3)dr+=v;if(c.fl>=3)fl+=v;if(c.t&&c.t[key]!==undefined){tw+=v*c.t[key];twd+=v}}
const f=p.f,dh=f?Object.values(FAM[f]||{}).reduce((a,b)=>a+b,0):0;return{mix:true,w:w/t,w5:w5/t,dr:dr/t,fl:fl/t,tw:twd?tw/twd:null,dh,f}}
function oneRisk(i,k,key){const c=C[k]||{},p=P[i],f=p.f,dh=f&&FAM[f]?FAM[f][k]||0:0;return{mix:false,wc:c.w,w5c:c.wf?c.wf[key]:undefined,drc:c.dr,flc:c.fl,tw:c.t&&c.t[key]!==undefined?c.t[key]:null,dh,f,share:(P[i].c[k]||0)/Object.values(P[i].c).reduce((a,b)=>a+b,0)}}
function flags(r){if(r.mix)return{w:r.w>.5,w5:r.w5>.5,dr:r.dr>.5,fl:r.fl>.5,d:r.dh>500};return{w:r.wc>=3,w5:r.w5c>=3,dr:r.drc>=3,fl:r.flc>=3,d:r.dh>=10}}
const pill=(lvl,t)=>'<span class="pill p'+lvl+'">'+t+'</span>';
function wpill(c,arr){if(c==null)return'<span class="pill pn">No data</span>';return pill(c>=3?2:c>=2?1:0,arr[c])}
function mpill(sh){return pill(sh>.5?2:sh>.25?1:0,Math.round(sh*100)+"% of UK supply")}
function money(v){return"£"+nf.format(Math.round(v))}
let last=[];
const NS="http://www.w3.org/2000/svg",om=document.getElementById("omap"),sk=document.getElementById("sankey");
const RISKC=[["d","Deforestation","#B23B26"],["w","Water stress","#2F78A8"],["dr","Drought","#C68A1E"],["fl","River flooding","#6F5FC7"]],NONE="#5E9A72",UNK="#A9AEAA";
const LV=["#3E8C5A","#C68A1E","#B23B26"],LVN=["Low","Medium","High"];
const mainRisk=fl=>{for(const [k,l,c] of RISKC)if(fl[k])return[k,l,c];return[null,"No major flags",NONE]};
const esc=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;");
const kmoney=v=>v>=1e6?"£"+(v/1e6).toFixed(1)+"m":v>=1e3?"£"+Math.round(v/1e3)+"k":"£"+nf.format(Math.round(v));
function nflags(f){return ["w","dr","fl","d"].filter(k=>f[k]).length+(f.w5&&!f.w?1:0)}
function rating(f){const n=nflags(f);return n>=3?2:n>=1?1:0}
let HL=null,OPEN=new Set(),SORT="risk";
function compute(){const yr=document.getElementById("horizon").value,sc=document.getElementById("scen").value,key=yr+sc,lab=yr+"s, "+document.getElementById("scen").selectedOptions[0].text.toLowerCase();
const items=rows.map(r=>({r,i:pidx(r.p)})).filter(x=>x.i!=null).map((x,j)=>{const risk=x.r.o?oneRisk(x.i,x.r.o,key):mixRisk(x.i,key);const fl=flags(risk);return{id:j,name:SHORT[P[x.i].n]||P[x.i].n,full:P[x.i].n,o:x.r.o,spend:parseFloat(x.r.s)||0,risk,fl,rt:rating(fl),mr:mainRisk(fl)}});
last={items,key,lab,yr};const S=document.getElementById("rsumm"),R=document.getElementById("res"),A=document.getElementById("asks");
if(!items.length){S.innerHTML='<p class="empty">Add at least one recognised ingredient, or load the example, to see your results.</p>';const rf=document.getElementById("rfind");if(rf)rf.innerHTML="";R.innerHTML='<tr><td class="empty">Your ingredient table appears here.</td></tr>';A.innerHTML="";drawMap([]);return}
const useSpend=items.every(x=>x.spend>0),wt=x=>useSpend?x.spend:1,TW=items.reduce((a,x)=>a+wt(x),0),unit=useSpend?"spend":"ingredients";
const share=f=>items.reduce((a,x)=>a+(x.risk.mix?(f==="w"?x.risk.w:f==="w5"?x.risk.w5:f==="dr"?x.risk.dr:x.risk.fl):(x.fl[f]?1:0))*wt(x),0)/TW*100;
const twv=items.filter(x=>x.risk.tw!=null),tavg=twv.length?twv.reduce((a,x)=>a+x.risk.tw*wt(x),0)/twv.reduce((a,x)=>a+wt(x),0):null;
const byC={};items.filter(x=>x.o).forEach(x=>byC[x.o]=(byC[x.o]||0)+wt(x));const topC=Object.entries(byC).sort((a,b)=>b[1]-a[1])[0];
const nd=items.filter(x=>x.fl.d).length,dshare=items.filter(x=>x.fl.d).reduce((a,x)=>a+wt(x),0)/TW*100;
// overall rating: spend-weighted average of ingredient ratings (Low 0, Medium 1, High 2)
const avg=items.reduce((a,x)=>a+x.rt*wt(x),0)/TW,overall=avg<.5?0:avg<1.25?1:2,nrisky=items.filter(x=>x.rt>0).length;
const conc=topC?topC[1]/TW*100:0,ukw=FD.ukt[key];
const lvl=(v,a,b)=>v>=b?2:v>=a?1:0;
const gauges=[
["Water stress",share("w"),lvl(share("w"),25,50),Math.round(share("w"))+"%","of your "+unit+" comes from origins where farms already face high water stress. "+Math.round(share("w5"))+"% by the "+lab+"."],
["Drought",share("dr"),lvl(share("dr"),25,50),Math.round(share("dr"))+"%","comes from origins with medium-high or high drought risk for farming."],
["Deforestation",dshare,lvl(dshare,25,50),Math.round(dshare)+"%","of your "+unit+" is linked to deforestation risk ("+nd+" of "+items.length+" ingredients)."],
["One country",conc,lvl(conc,30,50),topC?Math.round(conc)+"%":"–",topC?"comes from your biggest origin, "+C[topC[0]].n+".":"Set origins to see how concentrated your sourcing is."],
["Warming",tavg!=null?Math.min(100,tavg/4*100):0,tavg==null?0:lvl(tavg,1.5,2.5),tavg!=null?"+"+tavg.toFixed(1)+"°C":"–","average warming at your origins by the "+lab+(ukw!=null?", against +"+ukw.toFixed(1)+"°C for the UK.":".")]];
S.innerHTML='<div class="sc-top"><div class="sc-badge l'+overall+'"><span>Overall</span><b>'+LVN[overall]+' risk</b></div><p class="sc-verdict">'+
(nrisky?'<b>'+nrisky+' of '+items.length+' ingredients</b> carry at least one major risk'+(items.filter(x=>x.rt===2).length?', and <b>'+items.filter(x=>x.rt===2).length+'</b> carry three or more':'')+'.':'None of your ingredients carry a major risk at the chosen origins.')+
(topC&&conc>=30?' <b>'+Math.round(conc)+'%</b> of your '+unit+' relies on '+C[topC[0]].n+'.':'')+'</p></div>'+
'<div class="sc-g">'+gauges.map(([n,v,l,txt,line])=>'<div class="g"><div class="gh"><span>'+n+'</span><b style="color:'+LV[l]+'">'+txt+'</b></div><div class="gb"><i style="width:'+Math.max(2,Math.min(100,v))+'%;background:'+LV[l]+'"></i></div><p>'+line+'</p></div>').join("")+'</div>';
// per-ingredient questions
function qs(x){const q=[],f=x.fl;if(!x.o)q.push("Which country, and ideally which region, does this come from? The rating uses the UK's average import mix until you know.");
if(f.w||f.w5)q.push("Where exactly is it grown, and what water does the farm rely on? How did recent dry years affect supply?");
if(f.dr)q.push("What happened to volumes and prices in the last drought? Are there alternative growing regions or stock buffers?");
if(f.d)q.push("Can it be traced to farm or plantation level, and is it verified deforestation-free? Against what cut-off date?");
if(f.fl)q.push("Have floods disrupted harvests, processing or transport routes?");
if(x.risk.tw!=null&&x.risk.tw>=2.5)q.push("How is the grower adapting to rising heat: varieties, shade, irrigation, harvest timing?");
if(!q.length)q.push("No major flags. It's still worth confirming traceability and how the supplier is preparing for a changing climate.");return q}
// heatmap
const cell=(l,t)=>'<td><span class="hc h'+l+'">'+t+'</span></td>',na='<td><span class="hc hn">n/a</span></td>';
const catCell=(c,arr)=>c==null?na:cell(c>=3?2:c>=2?1:0,arr[c]);
const mixCell=v=>cell(v>.5?2:v>.25?1:0,Math.round(v*100)+"% of mix");
function heatRow(x,interactive){const r=x.risk;const dcell=!r.f?'<td><span class="hc hn">Not assessed</span></td>':r.mix?cell(r.dh>500?2:r.dh>0?1:0,nf.format(Math.round(r.dh))+" ha (all UK)"):cell(r.dh>=100?2:r.dh>=10?1:0,r.dh>=1?nf.format(Math.round(r.dh))+" ha":"None");
return'<tr class="hr'+(interactive?'" data-id="'+x.id+'" tabindex="0" aria-expanded="'+OPEN.has(x.id):'')+'"><td class="ing"><b>'+esc(x.name)+'</b><small>'+(x.o?esc(C[x.o].n):"Origin unknown (UK mix)")+(useSpend?" · "+kmoney(x.spend):"")+'</small></td>'+
(r.mix?mixCell(r.w):catCell(r.wc,WL))+(r.mix?mixCell(r.w5):catCell(r.w5c,WL))+(r.mix?mixCell(r.dr):catCell(r.drc,DL))+(r.mix?mixCell(r.fl):catCell(r.flc,WL))+
(r.tw!=null?cell(r.tw>=2.5?2:r.tw>=1.5?1:0,"+"+r.tw.toFixed(1)+"°C"):na)+dcell+'<td><span class="hc ov h'+x.rt+'">'+LVN[x.rt]+'</span></td></tr>'+
(interactive&&OPEN.has(x.id)?'<tr class="hd"><td colspan="8"><b>Questions for this supplier</b><ul>'+qs(x).map(q=>'<li>'+q+'</li>').join("")+'</ul></td></tr>':'')}
const sorted=items.slice().sort(SORT==="spend"?(a,b)=>wt(b)-wt(a):SORT==="name"?(a,b)=>a.name.localeCompare(b.name):(a,b)=>b.rt-a.rt||nflags(b.fl)-nflags(a.fl)||wt(b)-wt(a));
const head='<thead><tr><th>Ingredient</th><th>Water stress</th><th>Water, '+yr+'s</th><th>Drought</th><th>Flooding</th><th>Warming, '+yr+'s</th><th>Deforestation</th><th>Overall</th></tr></thead>';
R.innerHTML=head+'<tbody>'+sorted.map(x=>heatRow(x,true)).join("")+'</tbody>';
last.heatPrint='<table class="heat">'+head+'<tbody>'+sorted.map(x=>heatRow(x,false)).join("")+'</tbody></table>';
R.querySelectorAll("tr.hr").forEach(tr=>{const id=+tr.dataset.id;const tog=()=>{OPEN.has(id)?OPEN.delete(id):OPEN.add(id);const x=items[id];setHL(OPEN.has(id)?{t:"i",k:x.full}:null,true);compute()};tr.onclick=tog;tr.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();tog()}}});
// supplier questions (overall)
const asks=[];const any=k=>[...new Set(items.filter(x=>x.fl[k]).map(x=>x.name))];
if(any("w").length)asks.push(["Water stress: "+andList(any("w")),"Where exactly is it grown, and what water does the farm rely on? Is there a water management plan or certification? How did recent dry years affect supply?"]);
if(any("dr").length)asks.push(["Drought: "+andList(any("dr")),"What happened to volumes and prices in the last drought? Do you have alternative growing regions or stock buffers?"]);
if(any("d").length)asks.push(["Deforestation: "+andList(any("d")),"Can you trace this to farm or plantation level? Is it verified deforestation-free, and against what cut-off date? This will matter more as due diligence rules tighten."]);
if(topC&&topC[1]/TW>=.4)asks.push(["Concentration: "+C[topC[0]].n,"40% or more of your "+unit+" comes from one country. Is there a second source you could qualify, in case of a poor harvest or disruption?"]);
if(tavg!=null&&tavg>=2)asks.push(["Rising heat","Your origins are projected to warm by over 2°C. Ask suppliers how they're adapting: heat-tolerant varieties, shade, irrigation, changed harvest timing."]);
if(any("fl").length)asks.push(["River flooding: "+andList(any("fl")),"Have floods disrupted harvests, processing or transport? How resilient are routes to port?"]);
A.innerHTML=asks.length?asks.map(([t,q])=>'<div class="ask"><b>'+t+'</b><p>'+q+'</p></div>').join(""):'<p class="note">No major flags for these origins. It\'s still worth asking suppliers about traceability and climate resilience.</p>';
last.useSpend=useSpend;last.TW=TW;last.share=share;last.tavg=tavg;last.topC=topC;last.byC=byC;last.asks=asks;last.nd=nd;last.wt=wt;last.overall=overall;
drawMap(items,wt);renderFindings();applyHL()}
// ---------- linked highlighting ----------
function setHL(h,quiet){HL=h&&HL&&h.t===HL.t&&h.k===HL.k&&!quiet?null:h;applyHL()}
function match(x){if(!HL)return true;if(HL.t==="i")return x.full===HL.k;if(HL.t==="c")return (x.o||"_unk")===HL.k;if(HL.t==="r")return (x.o?(x.mr[0]||"none"):"_m"+(x.mr[0]||"none"))===HL.k;return true}
function applyHL(){const items=(last&&last.items)||[];const on=new Set(items.filter(match).map(x=>x.id));
document.querySelectorAll("#res tr.hr").forEach(tr=>tr.classList.toggle("dim",!!HL&&!on.has(+tr.dataset.id)));
sk.querySelectorAll("[data-ids]").forEach(el=>{const ids=el.dataset.ids.split(",").map(Number);el.classList.toggle("dim",!!HL&&!ids.some(i=>on.has(i)))});
om.querySelectorAll("[data-c]").forEach(el=>{const c=el.dataset.c;el.classList.toggle("dim",!!HL&&!items.some(x=>on.has(x.id)&&x.o===c))});
const cb=document.getElementById("hlclear");if(cb){cb.hidden=!HL;cb.textContent=HL?"Clear selection: "+(HL.t==="c"?(HL.k==="_unk"?"Unknown origin":C[HL.k].n):HL.t==="i"?(items.find(x=>x.full===HL.k)||{}).name:HL.label||"risk")+" ×":""}}
// ---------- origins map: zooms to fit, countries shaded by spend, risk rings ----------
const base=document.createElementNS(NS,"g"),pathOf={};for(const iso in WG.p){const p=document.createElementNS(NS,"path");p.setAttribute("d",WG.p[iso].d);p.setAttribute("fill","#E7EAE7");p.setAttribute("stroke","#FFFFFF");p.setAttribute("stroke-width",".6");p.setAttribute("vector-effect","non-scaling-stroke");base.appendChild(p);pathOf[iso]=p}om.appendChild(base);
const over=document.createElementNS(NS,"g");om.appendChild(over);const SH=["#DCE7E4","#B9D1CC","#8DB3AC","#5F8E87","#3A6862"];
const arcD=(r,j,rad)=>{const a0=j*Math.PI/2+.12,a1=(j+1)*Math.PI/2-.12;return"M"+(rad*Math.sin(a0))+","+(-rad*Math.cos(a0))+"A"+rad+","+rad+" 0 0 1 "+(rad*Math.sin(a1))+","+(-rad*Math.cos(a1))};
function drawMap(items,wt){over.innerHTML="";sk.innerHTML="";for(const iso in pathOf){pathOf[iso].setAttribute("fill","#E7EAE7");pathOf[iso].removeAttribute("data-c");pathOf[iso].style.cursor=""}
const L=document.getElementById("olegend");if(!items||!items.length){L.innerHTML="";om.setAttribute("viewBox","0 20 "+WG.w+" "+Math.round(WG.h*.78));sk.setAttribute("viewBox","0 0 1000 60");return}
wt=wt||(()=>1);const TW=items.reduce((a,x)=>a+wt(x),0),useS=items.every(x=>x.spend>0);
const agg={};items.filter(x=>x.o).forEach(x=>{const a=agg[x.o]=agg[x.o]||{v:0,names:[],fl:{},ids:[]};a.v+=wt(x);a.names.push(x.name);a.ids.push(x.id);RISKC.forEach(([k])=>{if(x.fl[k])a.fl[k]=1})});
const ent=Object.entries(agg).filter(([k])=>WG.p[k]).sort((a,b)=>b[1].v-a[1].v),mx=ent.length?ent[0][1].v:1,[ux,uy]=WG.uk;
// fit view to origins and the UK, at a 2:1 shape
let x0=ux,x1=ux,y0=uy,y1=uy;ent.forEach(([k])=>{const p=WG.p[k];x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y)});
let w=Math.max(260,(x1-x0)*1.35+120),h=Math.max(130,(y1-y0)*1.35+90);if(w/h<2)w=h*2;else h=w/2;w=Math.min(w,WG.w);h=Math.min(h,WG.h);
const cx=(x0+x1)/2,cy=(y0+y1)/2,vx=Math.max(0,Math.min(WG.w-w,cx-w/2)),vy=Math.max(0,Math.min(WG.h-h,cy-h/2));om.setAttribute("viewBox",vx.toFixed(1)+" "+vy.toFixed(1)+" "+w.toFixed(1)+" "+h.toFixed(1));
const k=w/960;
ent.forEach(([c,a])=>{const p=pathOf[c];if(p){p.setAttribute("fill",SH[Math.min(4,Math.floor(Math.sqrt(a.v/mx)*4.99))]);p.dataset.c=c;p.style.cursor="pointer";p.onclick=()=>setHL({t:"c",k:c})}});
ent.slice().reverse().forEach(([c,a])=>{const p=WG.p[c],col=mainRisk(a.fl)[2],arc=GE.arc(p,WG.uk);if(arc.dist<4)return;
const l=document.createElementNS(NS,"path");l.setAttribute("d",arc.d);l.setAttribute("fill","none");l.setAttribute("stroke",col);l.setAttribute("stroke-opacity",".75");l.setAttribute("stroke-linecap","round");l.setAttribute("vector-effect","non-scaling-stroke");l.setAttribute("stroke-width",(1.5+6*Math.sqrt(a.v/mx)).toFixed(1));l.dataset.c=c;l.classList.add("ln");over.appendChild(l)});
const placed=[];
ent.forEach(([c,a],j)=>{const p=WG.p[c],g=document.createElementNS(NS,"g");g.setAttribute("transform","translate("+p.x+","+p.y+")");g.dataset.c=c;g.classList.add("pin");g.style.cursor="pointer";
const R0=(6+5*Math.sqrt(a.v/mx))*k;let h_='<circle r="'+R0+'" fill="#FFFFFF" stroke="#1C2B2D" stroke-width="'+(1.2*k)+'"/>';
RISKC.forEach(([kk,ln,cl],q)=>{h_+='<path d="'+arcD(0,q,R0+3*k)+'" fill="none" stroke="'+(a.fl[kk]?cl:"#D3D8D4")+'" stroke-width="'+(3.2*k)+'" stroke-linecap="round"/>'});
g.innerHTML=h_+'<title>'+esc(C[c].n)+': '+a.names.join(", ")+' ('+Math.round(a.v/TW*100)+'%)</title>';g.onclick=()=>setHL({t:"c",k:c});over.appendChild(g);
if(j<8){let lx=p.x+R0+6*k,ly=p.y+4*k,anc="start";if(lx>vx+w-120*k){lx=p.x-R0-6*k;anc="end"}while(placed.some(q=>Math.abs(q[1]-ly)<14*k&&Math.abs(q[0]-lx)<130*k))ly+=14*k;placed.push([lx,ly]);
const t=document.createElementNS(NS,"text");t.setAttribute("x",lx);t.setAttribute("y",ly);t.setAttribute("text-anchor",anc);t.setAttribute("font-size",(12.5*k).toFixed(2));t.setAttribute("font-weight","600");t.setAttribute("fill","#1C2B2D");t.setAttribute("paint-order","stroke");t.setAttribute("stroke","#FFFFFF");t.setAttribute("stroke-width",(3.5*k).toFixed(2));t.setAttribute("pointer-events","none");t.dataset.c=c;
t.textContent=C[c].n+" "+Math.round(a.v/TW*100)+"%"+(useS?" · "+kmoney(a.v):"");over.appendChild(t)}});
const u=document.createElementNS(NS,"g");u.setAttribute("transform","translate("+ux+","+uy+")");u.innerHTML='<circle r="'+(5*k)+'" fill="#1C2B2D"/><text x="'+(-8*k)+'" y="'+(-7*k)+'" text-anchor="end" font-size="'+(11*k)+'" font-weight="700" fill="#1C2B2D" paint-order="stroke" stroke="#fff" stroke-width="'+(3*k)+'">UK</text>';over.appendChild(u);
// three-stage flow: ingredient, origin, main risk
const W=1000,padT=8,gap=10,nodeW=12,X=[230,490,715];
const left=[],lI={},mid=[],mI={},right=[],rI={};
items.forEach(x=>{const lk=x.full,mk=x.o||"_unk",rk=x.o?(x.mr[0]||"none"):"_m"+(x.mr[0]||"none");
if(lI[lk]==null){lI[lk]=left.length;left.push({k:lk,name:x.name,v:0,ids:[]})}left[lI[lk]].v+=wt(x);left[lI[lk]].ids.push(x.id);
if(mI[mk]==null){mI[mk]=mid.length;mid.push({k:mk,name:x.o?C[x.o].n:"Unknown origin",v:0,ids:[]})}mid[mI[mk]].v+=wt(x);mid[mI[mk]].ids.push(x.id);
if(rI[rk]==null){const base_=x.mr;rI[rk]=right.length;right.push({k:rk,name:x.o?base_[1]:(base_[0]?base_[1]+" (UK mix)":"No major flags (UK mix)"),col:x.o?base_[2]:UNK,v:0,ids:[]})}right[rI[rk]].v+=wt(x);right[rI[rk]].ids.push(x.id)});
const ord=["d","w","dr","fl","none"];right.sort((a,b)=>{const ia=ord.indexOf(a.k.replace("_m","")),ib=ord.indexOf(b.k.replace("_m",""));return (a.k.startsWith("_m")-b.k.startsWith("_m"))||ia-ib});right.forEach((r,i)=>rI[r.k]=i);
mid.sort((a,b)=>(a.k==="_unk")-(b.k==="_unk")||b.v-a.v);mid.forEach((m,i)=>mI[m.k]=i);
left.sort((a,b)=>Math.min(...items.filter(x=>x.full===a.k).map(x=>mI[x.o||"_unk"]))-Math.min(...items.filter(x=>x.full===b.k).map(x=>mI[x.o||"_unk"]))||b.v-a.v);left.forEach((l,i)=>lI[l.k]=i);
const n=Math.max(left.length,mid.length,right.length),Hh=Math.max(200,Math.min(52*n,600)),sc=(Hh-padT*2-gap*(n-1))/TW;
const lay=(arr)=>{let y=padT;arr.forEach(o=>{o.h=Math.max(4,o.v*sc);o.y=y;o.f=0;o.f2=0;y+=o.h+gap});return y-gap};
const lh=lay(left),mh=lay(mid),rh=lay(right),Hs=Math.max(lh,mh,rh)+padT,oL=(Hs-lh)/2,oM=(Hs-mh)/2,oR=(Hs-rh)/2;sk.setAttribute("viewBox","0 0 "+W+" "+Hs);
const band=(xa,ya,xb,yb,hh,col,ids,tip,hl)=>{const c_=(xa+xb)/2;return'<path class="band" data-ids="'+ids.join(",")+'" data-hl="'+hl+'" d="M'+xa+','+ya+' C'+c_+','+ya+' '+c_+','+yb+' '+xb+','+yb+' L'+xb+','+(yb+hh)+' C'+c_+','+(yb+hh)+' '+c_+','+(ya+hh)+' '+xa+','+(ya+hh)+' Z" fill="'+col+'" fill-opacity=".62"><title>'+tip+'</title></path>'};
let svg="";const s1={},s2={};
items.slice().sort((a,b)=>mI[a.o||"_unk"]-mI[b.o||"_unk"]).forEach(x=>{const l=left[lI[x.full]],m=mid[mI[x.o||"_unk"]],hh=Math.max(1.5,wt(x)*sc);
svg+=band(X[0]+nodeW,l.y+oL+l.f,X[1],m.y+oM+m.f,hh,x.o?x.mr[2]:UNK,[x.id],esc(x.name)+" from "+esc(m.name)+": "+(useS?kmoney(wt(x))+" ":"")+"("+Math.round(wt(x)/TW*100)+"%)","i:"+x.full);l.f+=hh;m.f+=hh});
items.slice().sort((a,b)=>rI[a.o?(a.mr[0]||"none"):"_m"+(a.mr[0]||"none")]-rI[b.o?(b.mr[0]||"none"):"_m"+(b.mr[0]||"none")]).forEach(x=>{const m=mid[mI[x.o||"_unk"]],r=right[rI[x.o?(x.mr[0]||"none"):"_m"+(x.mr[0]||"none")]],hh=Math.max(1.5,wt(x)*sc);
svg+=band(X[1]+nodeW,m.y+oM+m.f2,X[2],r.y+oR+r.f,hh,r.col,[x.id],esc(m.name)+" to "+esc(r.name)+": "+esc(x.name),"r:"+r.k);m.f2+=hh;r.f+=hh});
const node=(o,x,off,lbl,anchor,dx,hl,col)=>'<g class="nd" data-ids="'+o.ids.join(",")+'" data-hl="'+hl+'" style="cursor:pointer"><rect x="'+x+'" y="'+(o.y+off)+'" width="'+nodeW+'" height="'+o.h+'" rx="3" fill="'+(col||"#1C2B2D")+'"/><text x="'+(x+dx)+'" y="'+(o.y+off+o.h/2)+'" dy="0.35em" text-anchor="'+anchor+'" font-size="13" font-weight="600" fill="#1C2B2D" paint-order="stroke" stroke="#F6F7F4" stroke-width="3">'+lbl+'</text></g>';
left.forEach(o=>svg+=node(o,X[0],oL,esc(o.name)+(useS?' <tspan font-weight="400" fill="#5A6A6C">'+kmoney(o.v)+'</tspan>':''),"end",-8,"i:"+o.k));
mid.forEach(o=>svg+=node(o,X[1],oM,esc(o.name)+' <tspan font-weight="400" fill="#5A6A6C">'+Math.round(o.v/TW*100)+'%</tspan>',"start",nodeW+6,"c:"+o.k));
right.forEach(o=>svg+=node(o,X[2],oR,esc(o.name)+' <tspan font-weight="400" fill="#5A6A6C">'+(useS?kmoney(o.v):Math.round(o.v/TW*100)+"%")+'</tspan>',"start",nodeW+8,"r:"+o.k,o.col));
svg+='<text x="'+(X[0]+6)+'" y="'+(Hs+0)+'" font-size="0"></text>';
sk.innerHTML='<g class="cols"><text x="'+X[0]+'" y="-6" text-anchor="end" font-size="12" fill="#7B8889">Ingredient</text><text x="'+X[1]+'" y="-6" font-size="12" fill="#7B8889">Origin</text><text x="'+X[2]+'" y="-6" font-size="12" fill="#7B8889">Main risk</text></g>'+svg;
sk.setAttribute("viewBox","0 -22 "+W+" "+(Hs+22));
sk.querySelectorAll("[data-hl]").forEach(el=>el.addEventListener("click",()=>{const [t,k_]=el.dataset.hl.split(/:(.+)/);setHL({t,k:k_,label:t==="r"?(right.find(r=>r.k===k_)||{}).name:null})}));
L.innerHTML='Thickness shows your '+(useS?"spend":"number of ingredients")+'. Colour shows the main risk: '+RISKC.map(([k_,l,c])=>'<i style="background:'+c+'"></i>'+l).join(" ")+' <i style="background:'+NONE+'"></i>No major flags <i style="background:'+UNK+'"></i>Unknown origin. On the map, darker countries take more of your '+(useS?"spend":"ingredients")+', and each ring lights up the risks found there. Select a country, ingredient or risk to highlight it everywhere.'}

document.getElementById("horizon").onchange=compute;document.getElementById("scen").onchange=compute;
document.getElementById("csv").onclick=()=>{const {items,lab}=last;if(!items||!items.length)return;const esc=v=>{v=v==null?"":String(v);return/[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
const rows_=[["Ingredient","FAOSTAT product","Origin","Annual spend (£)","Water stress today","Water stress ("+lab+")","Drought risk","River flood risk","Projected warming ("+lab+", °C)","Deforestation linked (ha, UK imports of this crop from this origin)","Flags"]];
items.forEach(x=>{const r=x.risk,f=x.fl;rows_.push([x.name,x.full,x.o?C[x.o].n:"UK import mix",x.spend||"",r.mix?Math.round(r.w*100)+"% of mix":(r.wc!=null?WL[r.wc]:""),r.mix?Math.round(r.w5*100)+"% of mix":(r.w5c!=null?WL[r.w5c]:""),r.mix?Math.round(r.dr*100)+"% of mix":(r.drc!=null?DL[r.drc]:""),r.mix?Math.round(r.fl*100)+"% of mix":(r.flc!=null?WL[r.flc]:""),r.tw!=null?r.tw.toFixed(2):"",r.dh?Math.round(r.dh):0,["w","dr","fl","d"].filter(k=>f[k]).map(k=>({w:"water stress",dr:"drought",fl:"flooding",d:"deforestation"})[k]).join("; ")])});
rows_.push([]);rows_.push(["Screening results from Greener Edge's supply chain checker. Country averages, not farm-level assessments. Sources: WRI Aqueduct 4.0, World Bank CCKP, Singh et al. 2026, FAOSTAT 2024."]);
const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+rows_.map(r=>r.map(esc).join(",")).join("\n")],{type:"text/csv;charset=utf-8"}));a.download="supply-chain-check.csv";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)};
load();renderRows();compute();

function buildReport(){const L=last;if(!L.items||!L.items.length){alert("Add at least one recognised ingredient first.");return}
const biz=document.getElementById("bizname").value.trim()||"Your business",today=new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
const it=L.items,useS=L.useSpend,unit=useS?"spend":"ingredients",ukw=FD.ukt[L.key];
const flagged=k=>[...new Set(it.filter(x=>x.fl[k]).map(x=>x.name))];const clean=[...new Set(it.filter(x=>!["w","dr","fl","d"].some(k=>x.fl[k])).map(x=>x.name))];
const F=makeFindings(L);
const cards=document.getElementById("rsumm").innerHTML;
const rows=document.getElementById("res").innerHTML;
const svg=document.getElementById("omap").outerHTML,flow=document.getElementById("sankey").outerHTML.replace(' class="hl"',"");
const byC=Object.entries(L.byC||{}).sort((a,b)=>b[1]-a[1]),unk=it.filter(x=>!x.o).reduce((a,x)=>a+L.wt(x),0);
const bars=byC.map(([k,v])=>'<div class="bar"><span>'+C[k].n+'</span><span class="tr"><i style="width:'+(v/L.TW*100)+'%"></i></span><span>'+Math.round(v/L.TW*100)+'%'+(useS?" (£"+nf.format(Math.round(v))+")":"")+'</span></div>').join("")+(unk?'<div class="bar"><span>Origin unknown</span><span class="tr"><i style="width:'+(unk/L.TW*100)+'%;background:#9AA5A0"></i></span><span>'+Math.round(unk/L.TW*100)+'%</span></div>':"");
const stress=useS?byC.slice(0,3).map(([k,v])=>'<tr><td>'+C[k].n+'</td><td>£'+nf.format(Math.round(v*0.3))+'</td><td>'+(v*0.3/L.TW*100).toFixed(1)+'%</td><td>'+[...new Set(it.filter(x=>x.o===k).map(x=>x.name))].join(", ")+'</td></tr>').join(""):"";
const asks=document.getElementById("asks").innerHTML.replace(/class="ask"/g,'class="q"');
document.getElementById("report").innerHTML=
'<section class="rp"><div class="band"><p class="k">Supply Chain Risk Snapshot</p><h1>'+biz.replace(/</g,"&lt;")+'</h1><p>'+today+'. A screening report from Greener Edge Sustainability.</p></div>'+
'<h2>At a glance</h2><div class="scp">'+cards+'</div>'+
'<h2>Key findings</h2><ul class="find">'+F.map(f=>'<li>'+f+'</li>').join("")+'</ul>'+
'<h2>Where your ingredients come from</h2><div class="mapimg">'+svg+'</div><p class="small">'+document.getElementById("olegend").textContent+'</p></section>'+
'<section class="rp"><h2>What comes from where</h2><div class="mapimg">'+flow+'</div>'+
'<h2>Exposure by country</h2><p class="small">Share of your '+unit+' by origin country.</p>'+bars+
(stress?'<h2>Stress test: if a key origin lost 30% of supply</h2><p class="small">Purchasing affected if supply from each of your three largest origins fell by 30%, before switching to other suppliers.</p><table><tr><th>Origin</th><th>Spend affected</th><th>Share of total spend</th><th>Ingredients</th></tr>'+stress+'</table>':'')+'</section>'+
'<section class="rp"><h2>Ingredient by ingredient</h2>'+L.heatPrint+
'<h2>Questions to ask your suppliers</h2>'+asks+
'<h2>Suggested next steps</h2><ul class="find"><li>Confirm the region, not just the country, for your highest-spend ingredients. Risks vary a lot within countries.</li><li>Ask suppliers the questions above and record their answers.</li>'+(flagged("d").length?'<li>For '+andList(flagged("d"))+', request evidence of traceability and deforestation-free sourcing.</li>':'')+(L.topC&&L.topC[1]/L.TW>=.3?'<li>Consider qualifying a second source outside '+C[L.topC[0]].n+'.</li>':'')+'<li>Pair this with a product carbon footprint: the same ingredient list is most of the input.</li></ul>'+
'<h2>How to read this report</h2><p class="small">Scores are country averages from open datasets: WRI Aqueduct 4.0 (water stress, drought and river flooding; CC BY 4.0), the World Bank Climate Change Knowledge Portal (projected warming; ODbL), Singh et al. (2026) (deforestation risk linked to UK imports of each crop from each country; CC BY) and FAOSTAT 2024 (UK import mix, used where origin is unknown). They cannot reflect a specific farm, region or certification. Deforestation flags show risk exposure, not proof. This is a screening tool, not an audit or a compliance assessment.</p>'+
'<div class="foot">Greener Edge Sustainability helps food and drink businesses measure product carbon footprints, map supply chain risks and build reduction plans. Methods: greener-edge.github.io/wales-open-data/methods/</div></section>';
document.body.classList.add("rep");const done=()=>{document.body.classList.remove("rep");window.removeEventListener("afterprint",done)};window.addEventListener("afterprint",done);setTimeout(()=>window.print(),80)}
document.getElementById("mkreport").onclick=buildReport;

document.getElementById("hsort").onchange=e=>{SORT=e.target.value;compute()};
document.getElementById("hlclear").onclick=()=>{HL=null;OPEN.clear();compute()};
