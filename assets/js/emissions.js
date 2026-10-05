/* emissions page. Data globals: D, G (loaded by load.js). */
const Y=D.years,LA=D.la;
const POS={ANG:[1,0],GWY:[1,1],CNW:[2,1],DEN:[3,1],FLN:[4,1],CER:[1,2],POW:[2,2,2,2],WRX:[4,2],PEM:[0,3],CMN:[1,3],SWA:[1,4],NPT:[2,4],RCT:[3,4],MER:[4,4],BGW:[5,4],TOF:[6,4],MON:[7,4],BGE:[2,5],VGL:[3,5],CRF:[4,5],CAE:[5,5],NWP:[6,5]};
const SEC=[["tra","Transport","#2F5D8A"],["dom","Homes","#D9A55B"],["ind","Industry","#5E6B73"],["agr","Agriculture","#6E8B3D"],["com","Commercial","#8C7FB0"],["pub","Public sector","#B08FA8"],["was","Waste","#A0705A"]];
const SNAME={all:"All sectors",lul:"Land use and forestry"};SEC.forEach(s=>SNAME[s[0]]=s[1]);
const RAMP=["#F1EDE2","#E6CF9F","#D9A55B","#B86B2E","#7E3A1E"],SINK=["#E3F1EE","#A9D3CB","#3E8C84"];
let st={m:"pc",s:"all",y:19,sel:"NPT"},timer=null;
const nf0=new Intl.NumberFormat("en-GB",{maximumFractionDigits:0}),nf1=new Intl.NumberFormat("en-GB",{minimumFractionDigits:1,maximumFractionDigits:1});
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
function mix(stops,t){t=Math.max(0,Math.min(1,t));const p=t*(stops.length-1),i=Math.min(stops.length-2,Math.floor(p)),f=p-i,a=hex(stops[i]),b=hex(stops[i+1]);return"rgb("+a.map((v,k)=>Math.round(v+(b[k]-v)*f)).join(",")+")"}
function raw(c,s,yi){const d=LA[c];return s==="all"?d.tot[yi]:d[s][yi]}
function val(c,yi){const r=raw(c,st.s,yi);if(st.m==="tot")return r;if(st.m==="pc")return r/LA[c].pop[yi];if(st.s==="lul")return null;const b=raw(c,st.s,0);return b>0?(r/b-1)*100:null}
function fmt(v){if(v===null)return"n/a";if(st.m==="tot")return nf0.format(v)+" kt";if(st.m==="pc")return nf1.format(v)+" t";return(v>0?"+":v<0?"−":"")+nf0.format(Math.abs(v))+"%"}
function short(v){if(v===null)return"–";if(st.m==="tot")return v>=1000?nf1.format(v/1000)+"Mt":nf0.format(v);if(st.m==="pc")return nf1.format(v);return(v>0?"+":v<0?"−":"")+nf0.format(Math.abs(v))+"%"}
function range(){let mn=0,pos=[];for(const c in LA)for(let i=0;i<Y.length;i++){const v=val(c,i);if(v===null)continue;if(v>0)pos.push(v);mn=Math.min(mn,v)}pos.sort((a,b)=>a-b);const mx=pos.length?pos[Math.floor(pos.length*0.92)]:1;return{mx,mn}}
function color(v,r){if(v===null)return{bg:"#C9CFCB",fg:"#1C2B2D"};
if(st.m==="chg"){if(v<=0){const t=Math.min(1,-v/Math.max(1,-r.mn));return{bg:mix(SINK,t),fg:t>.65?"#FFFFFF":"#1C2B2D"}}const t=Math.min(1,v/Math.max(1,r.mx));return{bg:mix(RAMP.slice(1),t),fg:t>.55?"#FFFFFF":"#1C2B2D"}}
if(v<0){const t=Math.min(1,-v/Math.max(1e-9,-r.mn));return{bg:mix(SINK,.25+.75*t),fg:t>.6?"#FFFFFF":"#1C2B2D"}}
const t=Math.min(1,v/Math.max(1e-9,r.mx));return{bg:mix(RAMP,t),fg:t>.62?"#FFFFFF":"#1C2B2D"}}
const map=document.getElementById("map"),tip=document.getElementById("tip"),NS="http://www.w3.org/2000/svg";
map.setAttribute("viewBox","0 0 "+G.w+" "+G.h);
const LBL=["ANG","GWY","CNW","DEN","FLN","WRX","CER","POW","PEM","CMN","SWA","NPT","RCT","MON","BGE","VGL","CRF","NWP"];
const pathEl={};
for(const c in G.p){const p=document.createElementNS(NS,"path");p.setAttribute("d",G.p[c].d);p.setAttribute("tabindex","0");p.setAttribute("role","button");p.dataset.c=c;
p.addEventListener("click",()=>{st.sel=c;draw()});p.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();st.sel=c;draw()}});
p.addEventListener("mousemove",e=>{const r=map.parentNode.getBoundingClientRect();tip.style.left=(e.clientX-r.left)+"px";tip.style.top=(e.clientY-r.top)+"px";tip.textContent=LA[c].name+": "+fmt(val(c,st.y));tip.style.display="block"});
p.addEventListener("mouseleave",()=>tip.style.display="none");
map.appendChild(p);pathEl[c]=p}
LBL.forEach(c=>{const t=document.createElementNS(NS,"text");t.setAttribute("x",G.p[c].cx);t.setAttribute("y",G.p[c].cy);t.setAttribute("text-anchor","middle");t.setAttribute("dominant-baseline","middle");t.textContent=c;map.appendChild(t)});
const pick=document.getElementById("pick");Object.keys(LA).sort((a,b)=>LA[a].name.localeCompare(LA[b].name)).forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=LA[c].name;pick.appendChild(o)});
pick.onchange=()=>{st.sel=pick.value;draw()};
function legend(r){const L=document.getElementById("legend");if(st.m==="chg"){L.innerHTML='<i style="background:'+SINK[2]+'"></i>Bigger fall <i style="background:'+SINK[0]+'"></i>Small fall <i style="background:'+RAMP[3]+'"></i>Increase';return}
L.innerHTML='<i style="background:'+RAMP[0]+'"></i>Lower <i style="background:'+RAMP[2]+'"></i> <i style="background:'+RAMP[4]+'"></i>Higher'+(r.mn<0?' <i style="background:'+SINK[2]+'"></i>Net carbon sink':'')+' <span>Scale fixed across all years. The very highest values share the darkest shade.</span>'}
function panel(){const c=st.sel,d=LA[c],yi=st.y,v=val(c,yi);
document.getElementById("pname").textContent=d.name;document.getElementById("pval").textContent=fmt(v);
const all=Object.keys(LA).map(k=>[k,val(k,yi)]).filter(x=>x[1]!==null).sort((a,b)=>b[1]-a[1]);const rk=all.findIndex(x=>x[0]===c)+1;
const mlab={tot:"total emissions",pc:"emissions per person",chg:"change since 2005"}[st.m];
document.getElementById("pmeta").textContent=SNAME[st.s]+", "+mlab+", "+Y[yi]+(rk?". Ranked "+rk+" of "+all.length+" in Wales (highest first).":"");
document.getElementById("pyr").textContent=Y[yi];
const parts=SEC.map(s=>[s,Math.max(0,d[s[0]][yi])]),sum=parts.reduce((a,b)=>a+b[1],0);
document.getElementById("pstack").innerHTML=parts.map(p=>'<span title="'+p[0][1]+'" style="width:'+(p[1]/sum*100)+'%;background:'+p[0][2]+'"></span>').join("");
const lu=d.lul[yi];
document.getElementById("pkeys").innerHTML=parts.map(p=>'<span style="--c:'+p[0][2]+'">'+p[0][1]+' '+Math.round(p[1]/sum*100)+'%</span>').join("")+'<span style="--c:'+(lu<0?SINK[2]:RAMP[3])+'">Land use '+(lu<0?"absorbs ":"adds ")+nf0.format(Math.abs(lu))+' kt</span>';
trend(c)}
function trend(c){const s=document.getElementById("ptrend"),W=360,H=120,pl=34,pr=8,pt=8,pb=20;
let ser=Y.map((y,i)=>{const r=raw(c,st.s,i);return st.m==="pc"?r/LA[c].pop[i]:r});
const unit=st.m==="pc"?"t per person":"kt CO₂e";document.getElementById("ptrendl").textContent="Trend, 2005 to 2024 ("+unit+")";
const mx=Math.max(...ser,0),mn=Math.min(...ser,0),sx=i=>pl+i*(W-pl-pr)/(Y.length-1),sy=v=>pt+(mx-v)/((mx-mn)||1)*(H-pt-pb);
const pts=ser.map((v,i)=>sx(i)+","+sy(v)).join(" ");
s.innerHTML='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+sy(0)+'" y2="'+sy(0)+'" stroke="var(--rule)"/>'+
'<text x="'+(pl-6)+'" y="'+(sy(mx)+4)+'" text-anchor="end">'+short2(mx)+'</text><text x="'+(pl-6)+'" y="'+(sy(0)+4)+'" text-anchor="end">0</text>'+
'<text x="'+pl+'" y="'+(H-4)+'">2005</text><text x="'+(W-pr)+'" y="'+(H-4)+'" text-anchor="end">2024</text>'+
'<polyline points="'+pts+'" fill="none" stroke="var(--ink)" stroke-width="2"/>'+
'<circle cx="'+sx(st.y)+'" cy="'+sy(ser[st.y])+'" r="4" fill="'+RAMP[3]+'"/>'}
function short2(v){return Math.abs(v)>=100?nf0.format(v):nf1.format(v)}
function draw(){const r=range();
for(const c in pathEl){const p=pathEl[c],v=val(c,st.y),k=color(v,r);p.style.fill=k.bg;p.classList.toggle("sel",c===st.sel);p.setAttribute("aria-label",LA[c].name+": "+fmt(v));p.setAttribute("aria-pressed",c===st.sel)}
const sp=pathEl[st.sel];if(sp)map.insertBefore(sp,map.querySelector("text"));pick.value=st.sel;
document.getElementById("yrout").textContent=Y[st.y];legend(r);panel();document.getElementById("agrilink").style.display=st.s==="agr"?"block":"none"}
document.querySelectorAll(".seg button").forEach(b=>b.onclick=()=>{st.m=b.dataset.m;document.querySelectorAll(".seg button").forEach(x=>x.setAttribute("aria-pressed",x===b));draw()});
document.getElementById("sector").onchange=e=>{st.s=e.target.value;draw()};
const yr=document.getElementById("year");yr.oninput=()=>{st.y=+yr.value;draw()};
const pb=document.getElementById("play");pb.onclick=()=>{if(timer){clearInterval(timer);timer=null;pb.textContent="Play";return}
if(st.y>=19)st.y=0;pb.textContent="Pause";timer=setInterval(()=>{st.y++;yr.value=st.y;draw();if(st.y>=19){clearInterval(timer);timer=null;pb.textContent="Play"}},420);yr.value=st.y;draw()};
draw();
(function(){const s=document.getElementById("drv"),ent=Object.entries(D.drv).map(([k,v])=>[k,v[v.length-1]-v[0]]).sort((a,b)=>a[1]-b[1]);
const tot=ent.reduce((a,b)=>a+b[1],0),W=760,lab=210,rr=150,x0=lab+ (W-lab-rr)*0.92,sc=(W-lab-rr)*0.92/7600,rh=34;
let h='<line x1="'+x0+'" x2="'+x0+'" y1="0" y2="'+(ent.length*rh)+'" stroke="var(--ink3)"/>';
ent.forEach(([k,v],i)=>{const y=i*rh+6,w=Math.abs(v)*sc,x=v<0?x0-w:x0,col=v<0?SINK[2]:RAMP[3];
h+='<text x="0" y="'+(y+15)+'" style="font-size:13px;fill:var(--ink)">'+k+'</text><rect x="'+x+'" y="'+y+'" width="'+Math.max(1,w)+'" height="20" rx="3" fill="'+col+'"/>'+
'<text x="'+(Math.max(x0,x+w)+8)+'" y="'+(y+15)+'">'+(v<0?"−":"+")+nf1.format(Math.abs(v)/1000)+' Mt'+(Math.abs(v)>400?' ('+Math.round(v/tot*100)+'%)':'')+'</text>'});
s.setAttribute("viewBox","0 0 "+W+" "+(ent.length*rh+10));s.innerHTML=h})();
(function(){const s=document.getElementById("npt"),W=760,H=300,pl=48,pr=150,pt=10,pb=28;
const wal=Y.map((y,i)=>Object.values(LA).reduce((a,d)=>a+d.tot[i],0)/1000),np=LA.NPT.tot.map(v=>v/1000),ex=wal.map((v,i)=>v-np[i]);
const mx=50,sx=i=>pl+i*(W-pl-pr)/(Y.length-1),sy=v=>pt+(mx-v)/mx*(H-pt-pb);
let h='';[0,10,20,30,40,50].forEach(g=>{h+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+sy(g)+'" y2="'+sy(g)+'" stroke="var(--rule)"/><text x="'+(pl-8)+'" y="'+(sy(g)+4)+'" text-anchor="end">'+g+'</text>'});
[0,5,10,15,19].forEach(i=>h+='<text x="'+sx(i)+'" y="'+(H-8)+'" text-anchor="middle">'+Y[i]+'</text>');
h+='<text x="'+pl+'" y="'+(pt+2)+'" dx="6" dy="10" style="fill:var(--ink3)">Mt CO₂e</text>';
[[wal,"var(--ink)","Wales total"],[ex,"#8A9A9C","Wales without NPT"],[np,RAMP[3],"Neath Port Talbot"]].forEach(([a,c,l])=>{h+='<polyline points="'+a.map((v,i)=>sx(i)+","+sy(v)).join(" ")+'" fill="none" stroke="'+c+'" stroke-width="2.5"/><text x="'+(W-pr+8)+'" y="'+(sy(a[19])+4)+'" style="fill:'+c+';font-size:13px">'+l+'</text>'});
s.innerHTML=h})();
