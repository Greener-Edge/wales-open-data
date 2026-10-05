/* commercial-epc page. Data globals: E, G (loaded by load.js). */
const LA=E.la,BN=E.bands;
const BC=["#0F6E56","#1D9E75","#97C459","#E6CF9F","#D9A55B","#D85A30","#A32D2D","#6B1A1A"];
const RAMP=["#F1EDE2","#E6CF9F","#D9A55B","#B86B2E","#7E3A1E"];
const nf=new Intl.NumberFormat("en-GB");
let st={m:"bigPct",g:"all",sel:"CRF"};
const MIN=10;
const sum=a=>a.reduce((x,y)=>x+y,0),below=a=>sum(a.slice(3));
function stat(c){const d=LA[c][st.g];
if(st.m==="bigPct"){const n=sum(d.big);return n<MIN?null:below(d.big)/n*100}
if(st.m==="bigN")return below(d.big);
if(st.m==="allPct"){const n=sum(d.all);return n<MIN?null:below(d.all)/n*100}
return d.all[6]+d.all[7]}
const isPct=()=>st.m.endsWith("Pct");
function fmt(v){return v===null?"Not enough data":isPct()?Math.round(v)+"%":nf.format(v)}
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
function mix(s,t){t=Math.max(0,Math.min(1,t));const p=t*(s.length-1),i=Math.min(s.length-2,Math.floor(p)),f=p-i,a=hex(s[i]),b=hex(s[i+1]);return"rgb("+a.map((v,k)=>Math.round(v+(b[k]-v)*f)).join(",")+")"}
function range(){const v=Object.keys(LA).map(stat).filter(x=>x!==null);return{mn:Math.min(...v),mx:Math.max(...v)}}
const map=document.getElementById("map"),tip=document.getElementById("tip"),NS="http://www.w3.org/2000/svg";
map.setAttribute("viewBox","0 0 "+G.w+" "+G.h);
const LBL=["ANG","GWY","CNW","DEN","FLN","WRX","CER","POW","PEM","CMN","SWA","NPT","RCT","MON","BGE","VGL","CRF","NWP"],pathEl={};
for(const c in G.p){const p=document.createElementNS(NS,"path");p.setAttribute("d",G.p[c].d);p.setAttribute("tabindex","0");p.setAttribute("role","button");
p.addEventListener("click",()=>{st.sel=c;draw()});p.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();st.sel=c;draw()}});
p.addEventListener("mousemove",e=>{const r=map.parentNode.getBoundingClientRect();tip.style.left=(e.clientX-r.left)+"px";tip.style.top=(e.clientY-r.top)+"px";tip.textContent=LA[c].name+": "+fmt(stat(c));tip.style.display="block"});
p.addEventListener("mouseleave",()=>tip.style.display="none");map.appendChild(p);pathEl[c]=p}
LBL.forEach(c=>{const t=document.createElementNS(NS,"text");t.setAttribute("x",G.p[c].cx);t.setAttribute("y",G.p[c].cy);t.setAttribute("text-anchor","middle");t.setAttribute("dominant-baseline","middle");t.textContent=c;map.appendChild(t)});
const pick=document.getElementById("pick");Object.keys(LA).sort((a,b)=>LA[a].name.localeCompare(LA[b].name)).forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=LA[c].name;pick.appendChild(o)});
pick.onchange=()=>{st.sel=pick.value;draw()};
function bands(id,kid,a){const n=sum(a),el=document.getElementById(id);
if(!n){el.innerHTML="";document.getElementById(kid).textContent="No buildings";return}
el.innerHTML=a.map((v,i)=>v?'<span title="'+BN[i]+": "+v+'" style="width:'+(v/n*100)+'%;background:'+BC[i]+'"></span>':"").join("");
document.getElementById(kid).innerHTML="<span>"+nf.format(n-below(a))+" at B or above</span><span>"+nf.format(below(a))+" below B</span>"}
const GN={all:"All types",ret:"Retail",off:"Offices",hos:"Hospitality and leisure",ind:"Industrial and warehouses",oth:"Public, health and other"};
const MN={bigPct:"of large buildings below B",bigN:"large buildings below B",allPct:"of all buildings below B",fg:"buildings rated F or G"};
function panel(){const c=st.sel,d=LA[c][st.g],v=stat(c);
document.getElementById("pname").textContent=LA[c].name;document.getElementById("pval").textContent=fmt(v);
const all=Object.keys(LA).map(k=>[k,stat(k)]).filter(x=>x[1]!==null).sort((a,b)=>b[1]-a[1]),rk=all.findIndex(x=>x[0]===c)+1;
document.getElementById("pmeta").textContent=(v===null?"":MN[st.m]+". ")+GN[st.g]+(rk?". Ranked "+rk+" of "+all.length+" in Wales (highest first).":"");
bands("bBig","kBig",d.big);bands("bAll","kAll",d.all);
const bl=d.bigLet,nl=sum(bl);document.getElementById("pnote").textContent=nl?nf.format(below(bl))+" of the "+nf.format(nl)+" large buildings last certified for letting are below B.":""}
function legend(r){document.getElementById("legend").innerHTML='<i style="background:'+RAMP[0]+'"></i>'+(isPct()?Math.round(r.mn)+"%":nf.format(r.mn))+' <i style="background:'+RAMP[2]+'"></i> <i style="background:'+RAMP[4]+'"></i>'+(isPct()?Math.round(r.mx)+"%":nf.format(r.mx))+' <i style="background:#C9CFCB"></i>Not enough data'}
function draw(){const r=range();
for(const c in pathEl){const v=stat(c),p=pathEl[c];p.style.fill=v===null?"#C9CFCB":mix(RAMP,(v-r.mn)/((r.mx-r.mn)||1));p.classList.toggle("sel",c===st.sel);p.setAttribute("aria-label",LA[c].name+": "+fmt(v));p.setAttribute("aria-pressed",c===st.sel)}
const sp=pathEl[st.sel];map.insertBefore(sp,map.querySelector("text"));pick.value=st.sel;legend(r);panel()}
document.getElementById("measure").onchange=e=>{st.m=e.target.value;draw()};
document.getElementById("grp").onchange=e=>{st.g=e.target.value;draw()};
draw();
(function(){const T=document.getElementById("types"),rows=Object.entries(E.grpBig).map(([g,a])=>[g,a,below(a)/sum(a)]).sort((x,y)=>y[2]-x[2]);
T.innerHTML=rows.map(([g,a,p])=>{const n=sum(a);let x=0,mark=0;const segs=a.map((v,i)=>{const w=v/n*100;if(i===3)mark=x;x+=w;return'<span title="'+BN[i]+": "+v+'" style="width:'+w+'%;background:'+BC[i]+'"></span>'}).join("");
return'<div class="grow"><span>'+GN[g]+'</span><div style="position:relative"><div class="bands" style="margin:0">'+segs+'</div><span style="position:absolute;left:'+mark+'%;top:-4px;bottom:-4px;border-left:2px solid var(--ink)"></span></div><b>'+Math.round(p*100)+'%</b></div>'}).join("")+
'<div class="legend">'+BN.map((b,i)=>'<i style="background:'+BC[i]+'"></i>'+b).join(" ")+'</div>'})();
(function(){const F=document.getElementById("fuel"),ent=Object.entries(E.fuel),n=sum(ent.map(e=>e[1])),mx=Math.max(...ent.map(e=>e[1]));
F.innerHTML=ent.map(([k,v])=>'<div class="grow"><span>'+k+'</span><div class="bands" style="margin:0;background:none"><span style="width:'+(v/mx*100)+'%;background:'+(k==="Mains gas"?RAMP[3]:"#8A9A9C")+'"></span></div><b>'+Math.round(v/n*100)+'%</b></div>').join("")})();
