/* supply-chain-checker page. Data globals: FD, WG (loaded by load.js). */
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
function compute(){const yr=document.getElementById("horizon").value,sc=document.getElementById("scen").value,key=yr+sc,lab=yr+"s, "+document.getElementById("scen").selectedOptions[0].text.toLowerCase();
const items=rows.map(r=>({r,i:pidx(r.p)})).filter(x=>x.i!=null).map(x=>{const risk=x.r.o?oneRisk(x.i,x.r.o,key):mixRisk(x.i,key);return{name:SHORT[P[x.i].n]||P[x.i].n,full:P[x.i].n,o:x.r.o,spend:parseFloat(x.r.s)||0,risk,fl:flags(risk)}});
last={items,key,lab,yr};const S=document.getElementById("rsumm"),R=document.getElementById("res"),A=document.getElementById("asks");
if(!items.length){S.innerHTML="";R.innerHTML='<tr><td class="empty">Add at least one recognised ingredient to see results, or load the example.</td></tr>';A.innerHTML="";drawMap([]);return}
const useSpend=items.every(x=>x.spend>0),wt=x=>useSpend?x.spend:1,TW=items.reduce((a,x)=>a+wt(x),0);
const share=f=>items.reduce((a,x)=>a+(x.risk.mix?(f==="w"?x.risk.w:f==="w5"?x.risk.w5:f==="dr"?x.risk.dr:x.risk.fl):(x.fl[f]?1:0))*wt(x),0)/TW*100;
const twv=items.filter(x=>x.risk.tw!=null),tavg=twv.length?twv.reduce((a,x)=>a+x.risk.tw*wt(x),0)/twv.reduce((a,x)=>a+wt(x),0):null;
const byC={};items.filter(x=>x.o).forEach(x=>byC[x.o]=(byC[x.o]||0)+wt(x));const topC=Object.entries(byC).sort((a,b)=>b[1]-a[1])[0];
const nd=items.filter(x=>x.fl.d).length;
S.innerHTML='<div><b>'+Math.round(share("w"))+'%</b><span>of your '+(useSpend?"spend":"ingredients")+' from water-stressed origins today, '+Math.round(share("w5"))+'% by the '+lab+'</span></div>'+
'<div><b>'+Math.round(share("dr"))+'%</b><span>from origins with drought risk for farming</span></div>'+
'<div><b>'+(tavg!=null?"+"+tavg.toFixed(1)+"°C":"–")+'</b><span>average warming at your origins by the '+lab+'</span></div>'+
'<div><b>'+nd+' of '+items.length+'</b><span>ingredients linked to deforestation risk</span></div>'+
'<div><b>'+(topC?Math.round(topC[1]/TW*100)+"%":"–")+'</b><span>'+(topC?"of your "+(useSpend?"spend":"ingredients")+" from one country, "+C[topC[0]].n:"set origins to see country concentration")+'</span></div>';
R.innerHTML='<tr><th>Ingredient</th><th>Origin</th>'+(useSpend?'<th>Spend</th>':'')+'<th>Water stress</th><th>Water stress, '+yr+'s</th><th>Drought</th><th>River flooding</th><th>Warming, '+yr+'s</th><th>Deforestation</th><th>Overall</th></tr>'+
items.map(x=>{const r=x.risk,f=x.fl,n=["w","dr","fl","d"].filter(k=>f[k]).length+(f.w5&&!f.w?1:0);const ov=n>=3?pill(2,"High"):n>=1?pill(1,"Medium"):pill(0,"Low");
const pc=v=>pill(v>.5?2:v>.25?1:0,Math.round(v*100)+"% of mix");
return'<tr><td><b>'+x.name+'</b></td><td>'+(x.o?C[x.o].n+(r.share>0?'<br>'+mpill(r.share).replace("of UK supply","of UK imports"):""):'UK import mix')+'</td>'+(useSpend?'<td>'+money(x.spend)+'</td>':'')+
'<td>'+(r.mix?pc(r.w):wpill(r.wc,WL))+'</td><td>'+(r.mix?pc(r.w5):wpill(r.w5c,WL))+'</td><td>'+(r.mix?pc(r.dr):wpill(r.drc,DL))+'</td><td>'+(r.mix?pc(r.fl):wpill(r.flc,WL))+'</td>'+
'<td>'+(r.tw!=null?pill(r.tw>=3?2:r.tw>=2?1:0,"+"+r.tw.toFixed(1)+"°C"):'<span class="pill pn">No data</span>')+'</td>'+
'<td>'+(r.f?(r.mix?pill(r.dh>500?2:r.dh>0?1:0,nf.format(Math.round(r.dh))+" ha, all UK "+r.f.toLowerCase()):pill(r.dh>=100?2:r.dh>=10?1:0,r.dh>=1?nf.format(Math.round(r.dh))+" ha linked":"None linked")):'<span class="pill pn">Not assessed</span>')+'</td><td class="rating">'+ov+'</td></tr>'}).join("");
const asks=[];const any=k=>items.filter(x=>x.fl[k]).map(x=>x.name);
if(any("w").length)asks.push(["Water stress: "+any("w").join(", "),"Where exactly is it grown, and what water does the farm rely on? Is there a water management plan or certification? How did recent dry years affect supply?"]);
if(any("dr").length)asks.push(["Drought: "+any("dr").join(", "),"What happened to volumes and prices in the last drought? Do you have alternative growing regions or stock buffers?"]);
if(any("d").length)asks.push(["Deforestation: "+any("d").join(", "),"Can you trace this to farm or plantation level? Is it verified deforestation-free, and against what cut-off date? This will matter more as due diligence rules tighten."]);
if(topC&&topC[1]/TW>=.4)asks.push(["Concentration: "+C[topC[0]].n,"40% or more of your "+(useSpend?"spend":"ingredients")+" comes from one country. Is there a second source you could qualify, in case of a poor harvest or disruption?"]);
if(tavg!=null&&tavg>=2)asks.push(["Rising heat","Your origins are projected to warm by over 2°C. Ask suppliers how they're adapting: heat-tolerant varieties, shade, irrigation, changed harvest timing."]);
if(any("fl").length)asks.push(["River flooding: "+any("fl").join(", "),"Have floods disrupted harvests, processing or transport? How resilient are routes to port?"]);
A.innerHTML=asks.length?asks.map(([t,q])=>'<div class="ask"><b>'+t+'</b><p>'+q+'</p></div>').join(""):'<p class="note">No major flags for these origins. It\'s still worth asking suppliers about traceability and climate resilience.</p>';
last.useSpend=useSpend;last.TW=TW;last.share=share;last.tavg=tavg;last.topC=topC;last.byC=byC;last.asks=asks;last.nd=nd;last.wt=wt;
drawMap(items,wt)}
const NS="http://www.w3.org/2000/svg",om=document.getElementById("omap"),sk=document.getElementById("sankey");
const RISKC=[["d","Deforestation","#B23B26"],["w","Water stress","#2F78A8"],["dr","Drought","#C68A1E"],["fl","River flooding","#6F5FC7"]],NONE="#7FA88B",UNK="#B4B8B4";
const mainRisk=fl=>{for(const [k,l,c] of RISKC)if(fl[k])return[k,l,c];return[null,"No major flags",NONE]};
const esc=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;");
// compact supply lines map: crop to the populated band of the world
const MW=WG.w,MH=Math.round(WG.h*0.78);om.setAttribute("viewBox","0 20 "+MW+" "+MH);
const base=document.createElementNS(NS,"g");for(const iso in WG.p){const p=document.createElementNS(NS,"path");p.setAttribute("d",WG.p[iso].d);p.setAttribute("fill","#E6E9E6");p.setAttribute("stroke","#FFFFFF");p.setAttribute("stroke-width",".5");base.appendChild(p)}om.appendChild(base);
const lines=document.createElementNS(NS,"g");om.appendChild(lines);
function drawMap(items,wt){lines.innerHTML="";sk.innerHTML="";const L=document.getElementById("olegend");
if(!items||!items.length){L.innerHTML="";sk.setAttribute("viewBox","0 0 900 60");return}
wt=wt||(()=>1);const TW=items.reduce((a,x)=>a+wt(x),0),useS=items.every(x=>x.spend>0);
// per-origin aggregation for the map
const agg={};items.filter(x=>x.o).forEach(x=>{const a=agg[x.o]=agg[x.o]||{v:0,names:[],fl:{}};a.v+=wt(x);a.names.push(x.name);RISKC.forEach(([k])=>{if(x.fl[k])a.fl[k]=1})});
const ent=Object.entries(agg).sort((a,b)=>b[1].v-a[1].v),mx=ent.length?ent[0][1].v:1,[ux,uy]=WG.uk;
ent.slice().reverse().forEach(([k,a])=>{const p=WG.p[k];if(!p)return;const dx=ux-p.x,dy=uy-p.y,dist=Math.hypot(dx,dy),col=mainRisk(a.fl)[2];
if(dist>6){const l=document.createElementNS(NS,"path");l.setAttribute("d","M"+p.x+","+p.y+" Q"+((p.x+ux)/2-dy*.22)+","+((p.y+uy)/2+dx*.22-dist*.12)+" "+ux+","+uy);l.setAttribute("fill","none");l.setAttribute("stroke",col);l.setAttribute("stroke-opacity",".8");l.setAttribute("stroke-linecap","round");l.setAttribute("stroke-width",(1.2+7*Math.sqrt(a.v/mx)).toFixed(1));
const t=document.createElementNS(NS,"title");t.textContent=C[k].n+": "+a.names.join(", ")+" ("+Math.round(a.v/TW*100)+"% of your "+(useS?"spend":"ingredients")+")";l.appendChild(t);lines.appendChild(l)}
const pin=document.createElementNS(NS,"circle");pin.setAttribute("cx",p.x);pin.setAttribute("cy",p.y);pin.setAttribute("r","4");pin.setAttribute("fill","#FFFFFF");pin.setAttribute("stroke",col);pin.setAttribute("stroke-width","2.5");lines.appendChild(pin)});
const labelled=new Set(ent.slice(0,7).map(e=>e[0]));const placed=[];
ent.forEach(([k,a])=>{if(!labelled.has(k))return;const p=WG.p[k];if(!p)return;let y=p.y+4,x=p.x+8,anchor="start";if(p.x>MW-140){x=p.x-8;anchor="end"}
while(placed.some(q=>Math.abs(q[1]-y)<13&&Math.abs(q[0]-x)<120))y+=13;placed.push([x,y]);
const t=document.createElementNS(NS,"text");t.setAttribute("x",x);t.setAttribute("y",y);t.setAttribute("text-anchor",anchor);t.setAttribute("font-size","12");t.setAttribute("font-weight","600");t.setAttribute("fill","#1C2B2D");t.setAttribute("paint-order","stroke");t.setAttribute("stroke","#FFFFFF");t.setAttribute("stroke-width","3");t.textContent=C[k].n+" "+Math.round(a.v/TW*100)+"%";lines.appendChild(t)});
const u=document.createElementNS(NS,"circle");u.setAttribute("cx",ux);u.setAttribute("cy",uy);u.setAttribute("r","5");u.setAttribute("fill","#1C2B2D");lines.appendChild(u);
// Sankey: ingredients (left) to origins (right); repeated ingredients merge into one node
const W=900,padT=6,gap=8,nodeW=10,lx=210,rx=W-200;
const right=[],rIdx={};items.forEach(x=>{const k=x.o||"_unk";if(rIdx[k]==null){rIdx[k]=right.length;right.push({k,v:0,name:x.o?C[x.o].n:"Unknown origin"})}right[rIdx[k]].v+=wt(x)});
right.sort((a,b)=>(a.k==="_unk")-(b.k==="_unk")||b.v-a.v);right.forEach((r,i)=>rIdx[r.k]=i);
const left=[],lIdx={};items.forEach((x,i)=>{if(lIdx[x.full]==null){lIdx[x.full]=left.length;left.push({name:x.name,v:0,links:[]})}const L_=left[lIdx[x.full]];L_.v+=wt(x);L_.links.push({x,v:wt(x),r:x.o||"_unk",i})});
left.forEach(l=>{l.rank=Math.min(...l.links.map(k=>rIdx[k.r]));l.links.sort((a,b)=>rIdx[a.r]-rIdx[b.r])});
left.sort((a,b)=>a.rank-b.rank||b.v-a.v);
const n=Math.max(left.length,right.length),H=Math.max(160,Math.min(46*n,560)),avail=H-padT*2-gap*(n-1),sc=avail/TW;
let y=padT;left.forEach(l=>{l.h=Math.max(3,l.v*sc);l.y=y;l.fill=0;y+=l.h+gap});const lh=y-gap;
y=padT;right.forEach(r=>{r.h=Math.max(3,r.v*sc);r.y=y;r.fill=0;y+=r.h+gap});const rh=y-gap;
const Hs=Math.max(lh,rh)+padT;sk.setAttribute("viewBox","0 0 "+W+" "+Hs);
const offL=(Hs-lh)/2,offR=(Hs-rh)/2;let svg="";
const links=[];left.forEach(l=>l.links.forEach(k=>links.push([l,k])));
links.sort((p,q)=>rIdx[p[1].r]-rIdx[q[1].r]||p[0].y-q[0].y);
const lfill=new Map(left.map(l=>[l,0]));
left.forEach(l=>l.links.forEach(k=>{k.h=Math.max(1.5,k.v*sc);k.y0=l.y+offL+lfill.get(l);lfill.set(l,lfill.get(l)+k.h)}));
links.forEach(([l,k])=>{const r=right[rIdx[k.r]],y0=k.y0,y1=r.y+offR+r.fill;r.fill+=k.h;const col=k.x.o?mainRisk(k.x.fl)[2]:UNK,x0=lx+nodeW,x1=rx,cx=(x0+x1)/2,h=k.h;
const tip=esc(k.x.name)+" from "+esc(r.name)+": "+(useS?"£"+nf.format(Math.round(k.v))+" ":"")+"("+Math.round(k.v/TW*100)+"%). "+(RISKC.filter(([q])=>k.x.fl[q]).map(z=>z[1]).join(", ")||"No major flags");
svg+='<path class="band" d="M'+x0+','+y0+' C'+cx+','+y0+' '+cx+','+y1+' '+x1+','+y1+' L'+x1+','+(y1+h)+' C'+cx+','+(y1+h)+' '+cx+','+(y0+h)+' '+x0+','+(y0+h)+' Z" fill="'+col+'" fill-opacity=".72"><title>'+tip+'</title></path>'});
left.forEach(l=>{const y0=l.y+offL;svg+='<rect x="'+lx+'" y="'+y0+'" width="'+nodeW+'" height="'+l.h+'" fill="#1C2B2D" rx="2"/><text x="'+(lx-8)+'" y="'+(y0+l.h/2-(useS&&l.h>22?6:0))+'" dy="0.35em" text-anchor="end" font-size="12.5" font-weight="600" fill="#1C2B2D">'+esc(l.name)+'</text>'+(useS&&l.h>22?'<text x="'+(lx-8)+'" y="'+(y0+l.h/2+8)+'" dy="0.35em" text-anchor="end" font-size="11" fill="#5A6A6C">£'+nf.format(Math.round(l.v))+'</text>':'')});
right.forEach(r=>{const y0=r.y+offR;svg+='<rect x="'+rx+'" y="'+y0+'" width="'+nodeW+'" height="'+r.h+'" fill="#1C2B2D" rx="2"/><text x="'+(rx+nodeW+8)+'" y="'+(y0+r.h/2)+'" dy="0.35em" font-size="12.5" font-weight="600" fill="#1C2B2D">'+esc(r.name)+' <tspan font-weight="400" fill="#5A6A6C">'+Math.round(r.v/TW*100)+'%</tspan></text>'});
sk.innerHTML=svg;
sk.querySelectorAll(".band").forEach(bd=>{bd.addEventListener("mouseenter",()=>{sk.classList.add("hl");sk.querySelectorAll(".band").forEach(o=>o.classList.toggle("on",o===bd))});bd.addEventListener("mouseleave",()=>{sk.classList.remove("hl");sk.querySelectorAll(".band.on").forEach(o=>o.classList.remove("on"))})});
L.innerHTML='Line and band thickness show your '+(useS?"spend":"number of ingredients")+'. Colour shows the main risk at that origin: '+RISKC.map(([k,l,c])=>'<i style="background:'+c+'"></i>'+l).join(" ")+' <i style="background:'+NONE+'"></i>No major flags <i style="background:'+UNK+'"></i>Origin unknown. Where several risks apply, deforestation is shown first, then water stress, drought and flooding.'}
document.getElementById("horizon").onchange=compute;document.getElementById("scen").onchange=compute;
document.getElementById("csv").onclick=()=>{const {items,lab}=last;if(!items||!items.length)return;const esc=v=>{v=v==null?"":String(v);return/[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
const rows_=[["Ingredient","FAOSTAT product","Origin","Annual spend (£)","Water stress today","Water stress ("+lab+")","Drought risk","River flood risk","Projected warming ("+lab+", °C)","Deforestation linked (ha, UK imports of this crop from this origin)","Flags"]];
items.forEach(x=>{const r=x.risk,f=x.fl;rows_.push([x.name,x.full,x.o?C[x.o].n:"UK import mix",x.spend||"",r.mix?Math.round(r.w*100)+"% of mix":(r.wc!=null?WL[r.wc]:""),r.mix?Math.round(r.w5*100)+"% of mix":(r.w5c!=null?WL[r.w5c]:""),r.mix?Math.round(r.dr*100)+"% of mix":(r.drc!=null?DL[r.drc]:""),r.mix?Math.round(r.fl*100)+"% of mix":(r.flc!=null?WL[r.flc]:""),r.tw!=null?r.tw.toFixed(2):"",r.dh?Math.round(r.dh):0,["w","dr","fl","d"].filter(k=>f[k]).map(k=>({w:"water stress",dr:"drought",fl:"flooding",d:"deforestation"})[k]).join("; ")])});
rows_.push([]);rows_.push(["Screening results from Greener Edge's supply chain checker. Country averages, not farm-level assessments. Sources: WRI Aqueduct 4.0, World Bank CCKP, Singh et al. 2026, FAOSTAT 2024."]);
const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+rows_.map(r=>r.map(esc).join(",")).join("\n")],{type:"text/csv;charset=utf-8"}));a.download="supply-chain-check.csv";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)};
load();renderRows();compute();

const andList=a=>a.length<2?a.join(""):a.slice(0,-1).join(", ")+" and "+a[a.length-1];
function buildReport(){const L=last;if(!L.items||!L.items.length){alert("Add at least one recognised ingredient first.");return}
const biz=document.getElementById("bizname").value.trim()||"Your business",today=new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
const it=L.items,useS=L.useSpend,unit=useS?"spend":"ingredients",ukw=FD.ukt[L.key];
const flagged=k=>[...new Set(it.filter(x=>x.fl[k]).map(x=>x.name))];const clean=[...new Set(it.filter(x=>!["w","dr","fl","d"].some(k=>x.fl[k])).map(x=>x.name))];
const F=[];
if(L.topC&&L.topC[1]/L.TW>=.3)F.push(Math.round(L.topC[1]/L.TW*100)+"% of your "+unit+" comes from one country, "+C[L.topC[0]].n+". A poor harvest or disruption there would hit a large share of your purchasing.");
if(flagged("d").length)F.push(andList(flagged("d"))+(flagged("d").length>1?" are":" is")+" linked to deforestation risk at the chosen origin. Traceability to farm or plantation level is the key question for suppliers.");
const ws=L.share("w"),dr=L.share("dr");if(ws>=10)F.push(Math.round(ws)+"% of your "+unit+" comes from origins with high or extremely high water stress on farmland"+(flagged("w").length?" ("+andList(flagged("w"))+")":"")+".");
if(dr>=10)F.push(Math.round(dr)+"% comes from origins with medium-high or high drought risk for farming.");
if(L.tavg!=null)F.push("Your origins are projected to warm by about "+L.tavg.toFixed(1)+"°C on average by the "+L.lab+(ukw!=null?", compared with "+ukw.toFixed(1)+"°C for the UK":"")+".");
if(clean.length)F.push("No major flags for "+andList(clean)+" at the chosen origins.");
const cards=document.getElementById("rsumm").innerHTML;
const rows=document.getElementById("res").innerHTML;
const svg=document.getElementById("omap").outerHTML,flow=document.getElementById("sankey").outerHTML.replace(' class="hl"',"");
const byC=Object.entries(L.byC||{}).sort((a,b)=>b[1]-a[1]),unk=it.filter(x=>!x.o).reduce((a,x)=>a+L.wt(x),0);
const bars=byC.map(([k,v])=>'<div class="bar"><span>'+C[k].n+'</span><span class="tr"><i style="width:'+(v/L.TW*100)+'%"></i></span><span>'+Math.round(v/L.TW*100)+'%'+(useS?" (£"+nf.format(Math.round(v))+")":"")+'</span></div>').join("")+(unk?'<div class="bar"><span>Origin unknown</span><span class="tr"><i style="width:'+(unk/L.TW*100)+'%;background:#9AA5A0"></i></span><span>'+Math.round(unk/L.TW*100)+'%</span></div>':"");
const stress=useS?byC.slice(0,3).map(([k,v])=>'<tr><td>'+C[k].n+'</td><td>£'+nf.format(Math.round(v*0.3))+'</td><td>'+(v*0.3/L.TW*100).toFixed(1)+'%</td><td>'+[...new Set(it.filter(x=>x.o===k).map(x=>x.name))].join(", ")+'</td></tr>').join(""):"";
const asks=document.getElementById("asks").innerHTML.replace(/class="ask"/g,'class="q"');
document.getElementById("report").innerHTML=
'<section class="rp"><div class="band"><p class="k">Supply Chain Risk Snapshot</p><h1>'+biz.replace(/</g,"&lt;")+'</h1><p>'+today+'. A screening report from Greener Edge Sustainability.</p></div>'+
'<h2>At a glance</h2><div class="cards">'+cards+'</div>'+
'<h2>Key findings</h2><ul class="find">'+F.map(f=>'<li>'+f+'</li>').join("")+'</ul>'+
'<h2>Where your ingredients come from</h2><div class="mapimg">'+svg+'</div><p class="small">'+document.getElementById("olegend").textContent+'</p></section>'+
'<section class="rp"><h2>What comes from where</h2><div class="mapimg">'+flow+'</div>'+
'<h2>Exposure by country</h2><p class="small">Share of your '+unit+' by origin country.</p>'+bars+
(stress?'<h2>Stress test: if a key origin lost 30% of supply</h2><p class="small">Purchasing affected if supply from each of your three largest origins fell by 30%, before switching to other suppliers.</p><table><tr><th>Origin</th><th>Spend affected</th><th>Share of total spend</th><th>Ingredients</th></tr>'+stress+'</table>':'')+'</section>'+
'<section class="rp"><h2>Ingredient by ingredient</h2><table>'+rows+'</table>'+
'<h2>Questions to ask your suppliers</h2>'+asks+
'<h2>Suggested next steps</h2><ul class="find"><li>Confirm the region, not just the country, for your highest-spend ingredients. Risks vary a lot within countries.</li><li>Ask suppliers the questions above and record their answers.</li>'+(flagged("d").length?'<li>For '+andList(flagged("d"))+', request evidence of traceability and deforestation-free sourcing.</li>':'')+(L.topC&&L.topC[1]/L.TW>=.3?'<li>Consider qualifying a second source outside '+C[L.topC[0]].n+'.</li>':'')+'<li>Pair this with a product carbon footprint: the same ingredient list is most of the input.</li></ul>'+
'<h2>How to read this report</h2><p class="small">Scores are country averages from open datasets: WRI Aqueduct 4.0 (water stress, drought and river flooding; CC BY 4.0), the World Bank Climate Change Knowledge Portal (projected warming; ODbL), Singh et al. (2026) (deforestation risk linked to UK imports of each crop from each country; CC BY) and FAOSTAT 2024 (UK import mix, used where origin is unknown). They cannot reflect a specific farm, region or certification. Deforestation flags show risk exposure, not proof. This is a screening tool, not an audit or a compliance assessment.</p>'+
'<div class="foot">Greener Edge Sustainability helps food and drink businesses measure product carbon footprints, map supply chain risks and build reduction plans. Methods: greener-edge.github.io/wales-open-data/methods/</div></section>';
document.body.classList.add("rep");const done=()=>{document.body.classList.remove("rep");window.removeEventListener("afterprint",done)};window.addEventListener("afterprint",done);setTimeout(()=>window.print(),80)}
document.getElementById("mkreport").onclick=buildReport;
