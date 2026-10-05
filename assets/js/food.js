/* Food page (imports, grown in the UK, Wales tabs). Data globals: FD, WG, GLOBE, FB, A (loaded by load.js). */
const _initHash=location.hash;
const C=FD.c,P=FD.p,FAM=FD.fam,GN=FD.gn;
const LAB={tw:["Under 1°C","1 to 2°C","2 to 3°C","3 to 4°C","4°C or more"],w:["Low","Low to medium","Medium to high","High","Extremely high"],dr:["Low","Low to medium","Medium","Medium to high","High"],fl:["Low","Low to medium","Medium to high","High","Extremely high"]};
const RAMP={tw:["#FCEFE3","#F6C9A0","#EE9A5E","#D9622B","#9E2F12"],w:["#E3EEF3","#B9D6E3","#7FB3CF","#3F84AE","#1B4F7A"],dr:["#FBF3DC","#F3DC9A","#E3B85B","#B98A2E","#7A5A1C"],fl:["#EEEDFE","#CECBF6","#AFA9EC","#7F77DD","#534AB7"],d:["#F1EDE2","#E6CF9F","#D9A55B","#B86B2E","#7E3A1E"]};
const NOD="#D5D9D6",nf=new Intl.NumberFormat("en-GB");
const SCN={opt:"optimistic",bau:"business as usual",pes:"pessimistic"};
let st={q:null,g:"all",lens:"w",yr:"now",sc:"bau",sel:"ESP",dy:18};
const GV={};P.forEach(p=>{for(const k in p.c){GV[k]=GV[k]||{};GV[k][p.g]=(GV[k][p.g]||0)+p.c[k];GV[k].all=(GV[k].all||0)+p.c[k]}});
function writeHash(){const p=new URLSearchParams();if(window._tab&&window._tab!=="imports")p.set("tab",window._tab);if(st.q!==null)p.set("q",P[st.q].n);else if(st.g!=="all")p.set("g",st.g);if(st.lens!=="w")p.set("lens",st.lens);if(st.yr!=="now"){p.set("yr",st.yr);p.set("sc",st.sc)}p.set("c",st.sel);try{history.replaceState(null,"","#"+p.toString())}catch(e){}}
function readHash(){const p=new URLSearchParams(location.hash.slice(1));if(p.get("lens")&&["w","tw","dr","fl","d"].includes(p.get("lens")))st.lens=p.get("lens");if(p.get("yr")&&["2030","2050","2080"].includes(p.get("yr"))){st.yr=p.get("yr");st.sc=["opt","bau","pes"].includes(p.get("sc"))?p.get("sc"):"bau"}if(p.get("g")&&GN[p.get("g")])st.g=p.get("g");if(p.get("c")&&C[p.get("c")])st.sel=p.get("c");return p.get("q")}
const PI={};P.forEach((p,i)=>PI[p.n]=i);
function sv(iso){if(st.q!==null)return P[st.q].c[iso]||0;return(GV[iso]&&GV[iso][st.g])||0}
const isos=()=>Object.keys(C);
const total=()=>isos().reduce((a,k)=>a+sv(k),0);
function wcat(c,yr,sc){if(!c)return null;if(yr==="now")return c.w===undefined?null:c.w;const v=c.wf&&c.wf[yr+sc];return v===undefined?null:v}
function risk(iso){const c=C[iso];if(!c)return null;
if(st.lens==="w")return wcat(c,st.yr,st.sc);
if(st.lens==="tw"){const v=c.t&&c.t[(st.yr==="now"?"2050":st.yr)+st.sc];return v===undefined?null:v}
if(st.lens==="dr")return c.dr===undefined?null:c.dr;
if(st.lens==="fl")return c.fl===undefined?null:c.fl;
const f=st.q!==null&&P[st.q].f;if(f)return(FAM[f]&&FAM[f][iso])||0;const y=FD.dyr[iso];return y?y[st.dy]:0}
function dbin(d){return d<=0?0:d<10?1:d<100?2:d<1000?3:4}
const tbin=v=>v<1?0:v<2?1:v<3?2:v<4?3:4;
function fill(iso){const r=risk(iso);if(r===null)return NOD;return RAMP[st.lens][st.lens==="d"?dbin(r):st.lens==="tw"?tbin(r):r]}
function money(k){const d=k*1000;return d>=1e9?"$"+(d/1e9).toFixed(1)+" billion":d>=1e6?"$"+Math.round(d/1e6)+" million":d>=1e3?"$"+nf.format(Math.round(d/1e3))+" thousand":"under $1 thousand"}
const twLabel=()=>(st.yr==="now"?"2050":st.yr)+"s, "+SCN[st.sc];
const futLabel=()=>st.yr==="now"?"2050, business as usual":st.yr+", "+SCN[st.sc];
const fy=()=>st.yr==="now"?"2050":st.yr,fs=()=>st.yr==="now"?"bau":st.sc;
const gsel=document.getElementById("grp");
[["all","All food"]].concat(Object.entries(GN).filter(([k])=>k!=="oth")).forEach(([k,n])=>{const o=document.createElement("option");o.value=k;o.textContent=n;gsel.appendChild(o)});
const dl=document.getElementById("plist");P.slice().sort((a,b)=>a.n.localeCompare(b.n)).forEach(p=>{const o=document.createElement("option");o.value=p.n;dl.appendChild(o)});
const map=document.getElementById("map"),tip=document.getElementById("tip"),NS="http://www.w3.org/2000/svg";
map.setAttribute("viewBox","0 0 "+WG.w+" "+WG.h);
const vp=document.createElementNS(NS,"g");map.appendChild(vp);
const arcs=document.createElementNS(NS,"g"),harc=document.createElementNS(NS,"g"),pathEl={};
let view={k:1,x:0,y:0},moved=false;
function applyView(){vp.setAttribute("transform","translate("+view.x+","+view.y+") scale("+view.k+")")}
function clampView(v){const k=Math.max(1,Math.min(14,v.k)),mx=0,mnx=WG.w-WG.w*k,mny=WG.h-WG.h*k;return{k,x:Math.min(mx,Math.max(mnx,v.x)),y:Math.min(0,Math.max(mny,v.y))}}
let anim=null;const reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function animateTo(t,dur){t=clampView(t);if(anim)cancelAnimationFrame(anim);if(reduce||!dur){view=t;applyView();return}
const s0={...view},t0=performance.now(),ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
const step=n=>{const u=Math.min(1,(n-t0)/dur),e=ease(u);view={k:s0.k+(t.k-s0.k)*e,x:s0.x+(t.x-s0.x)*e,y:s0.y+(t.y-s0.y)*e};applyView();if(u<1)anim=requestAnimationFrame(step)};anim=requestAnimationFrame(step)}
function svgPt(cx,cy){const r=map.getBoundingClientRect();return[(cx-r.left)/r.width*WG.w,(cy-r.top)/r.height*WG.h]}
function zoomAt(px,py,f,dur){const k=Math.max(1,Math.min(14,view.k*f)),r=k/view.k;animateTo({k,x:px-(px-view.x)*r,y:py-(py-view.y)*r},dur)}
function zoomToBox(b,dur){if(!b)return animateTo({k:1,x:0,y:0},dur);const pad=40,k=Math.max(1,Math.min(10,Math.min(WG.w/(b.width+pad*2),WG.h/(b.height+pad*2))));
animateTo({k,x:WG.w/2-(b.x+b.width/2)*k,y:WG.h/2-(b.y+b.height/2)*k},dur)}
function boxOf(list){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,ok=false;list.forEach(i=>{const p=pathEl[i];if(!p)return;const b=p.getBBox();if(b.width>WG.w*.6)return;ok=true;x0=Math.min(x0,b.x);y0=Math.min(y0,b.y);x1=Math.max(x1,b.x+b.width);y1=Math.max(y1,b.y+b.height)});
if(WG.uk&&ok){x0=Math.min(x0,WG.uk[0]);y0=Math.min(y0,WG.uk[1]);x1=Math.max(x1,WG.uk[0]);y1=Math.max(y1,WG.uk[1])}return ok?{x:x0,y:y0,width:x1-x0,height:y1-y0}:null}
for(const iso in WG.p){const p=document.createElementNS(NS,"path");p.setAttribute("d",WG.p[iso].d);p.setAttribute("class","c");
if(C[iso]){p.setAttribute("tabindex","0");p.setAttribute("role","button");
p.addEventListener("click",()=>{if(moved)return;st.sel=iso;draw()});p.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();st.sel=iso;draw()}})}
p.addEventListener("dblclick",e=>{e.preventDefault();zoomToBox(boxOf([iso]),700)});
p.addEventListener("mousemove",e=>{const r=map.parentNode.getBoundingClientRect(),lx=e.clientX-r.left;tip.style.left=lx+"px";tip.style.transform=lx>r.width-180?"translate(-100%,-115%)":lx<180?"translate(0,-115%)":"translate(-50%,-115%)";tip.style.top=(e.clientY-r.top)+"px";tip.textContent=tipText(iso);tip.style.display="block";if(harc.dataset.iso!==iso){harc.dataset.iso=iso;hoverArc(iso)}});
p.addEventListener("mouseleave",()=>{tip.style.display="none";harc.dataset.iso="";hoverArc(null)});vp.appendChild(p);pathEl[iso]=p}
vp.appendChild(arcs);vp.appendChild(harc);
const ptrs=new Map();let dragStart=null,pinch0=null;
map.addEventListener("pointerdown",e=>{map.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,[e.clientX,e.clientY]);moved=false;if(anim)cancelAnimationFrame(anim);
if(ptrs.size===1)dragStart={cx:e.clientX,cy:e.clientY,x:view.x,y:view.y};
if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch0={d:Math.hypot(a[0]-b[0],a[1]-b[1]),k:view.k,x:view.x,y:view.y,m:svgPt((a[0]+b[0])/2,(a[1]+b[1])/2)}}});
map.addEventListener("pointermove",e=>{if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,[e.clientX,e.clientY]);
if(ptrs.size===2&&pinch0){const [a,b]=[...ptrs.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]),k=Math.max(1,Math.min(14,pinch0.k*d/pinch0.d)),r=k/pinch0.k;view=clampView({k,x:pinch0.m[0]-(pinch0.m[0]-pinch0.x)*r,y:pinch0.m[1]-(pinch0.m[1]-pinch0.y)*r});applyView();moved=true;return}
if(dragStart){const r=map.getBoundingClientRect(),dx=(e.clientX-dragStart.cx)/r.width*WG.w,dy=(e.clientY-dragStart.cy)/r.height*WG.h;if(Math.abs(e.clientX-dragStart.cx)+Math.abs(e.clientY-dragStart.cy)>4){moved=true;map.classList.add("drag");tip.style.display="none"}
if(moved){view=clampView({k:view.k,x:dragStart.x+dx,y:dragStart.y+dy});applyView()}}});
const endPtr=e=>{ptrs.delete(e.pointerId);if(ptrs.size<2)pinch0=null;if(!ptrs.size){dragStart=null;map.classList.remove("drag");setTimeout(()=>moved=false,0)}};
map.addEventListener("pointerup",endPtr);map.addEventListener("pointercancel",endPtr);
map.addEventListener("wheel",e=>{if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();const [px,py]=svgPt(e.clientX,e.clientY);zoomAt(px,py,e.deltaY<0?1.25:0.8,0)},{passive:false});
document.getElementById("zin").onclick=()=>zoomAt(WG.w/2,WG.h/2,1.6,350);
document.getElementById("zout").onclick=()=>zoomAt(WG.w/2,WG.h/2,1/1.6,350);
document.getElementById("zreset").onclick=()=>animateTo({k:1,x:0,y:0},500);
function rlabel(iso){const r=risk(iso);if(r===null)return"no data";if(st.lens==="tw")return"+"+r.toFixed(1)+"°C warmer by the "+twLabel();if(st.lens==="d")return r?nf.format(r)+" ha deforestation risk":"no deforestation risk recorded";return LAB[st.lens][r].toLowerCase()+" "+({w:"water stress",dr:"drought risk",fl:"flood risk"})[st.lens]}
function tipText(iso){const c=C[iso];if(!c)return"No UK food imports recorded";const v=sv(iso);return c.n+": "+(v?money(v):"none sent to the UK")+", "+rlabel(iso)}
const pick=document.getElementById("pick");isos().sort((a,b)=>C[a].n.localeCompare(C[b].n)).forEach(k=>{const o=document.createElement("option");o.value=k;o.textContent=C[k].n;pick.appendChild(o)});
pick.onchange=()=>{st.sel=pick.value;draw()};
function topList(){return isos().map(k=>[k,sv(k)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1])}
function arcPath(p){const [ux,uy]=WG.uk,dx=ux-p.x,dy=uy-p.y,dist=Math.hypot(dx,dy);return dist<8?null:["M"+p.x+","+p.y+" Q"+((p.x+ux)/2-dy*0.22)+","+((p.y+uy)/2+dx*0.22-dist*0.12)+" "+ux+","+uy,dist]}
function hoverArc(iso){harc.innerHTML="";if(!iso)return;const v=sv(iso),p=WG.p[iso];if(!v||!p)return;const ap=arcPath(p);if(!ap)return;const tl=topList(),mx=tl.length?tl[0][1]:1,w=(0.8+5*Math.sqrt(v/mx));
const a=document.createElementNS(NS,"path");a.setAttribute("d",ap[0]);a.setAttribute("class","arc");a.setAttribute("stroke-width",w.toFixed(1));a.style.opacity=.9;a.style.stroke="var(--ink)";a.setAttribute("stroke-width",(w+1.2).toFixed(1));harc.appendChild(a);
const f=document.createElementNS(NS,"path");f.setAttribute("d",ap[0]);f.setAttribute("class","flow");f.setAttribute("stroke-width",Math.max(1.2,w*.55).toFixed(1));harc.appendChild(f)}
function drawArcs(){arcs.innerHTML="";const tl=topList();let list=tl.slice(0,15);const sel=tl.find(x=>x[0]===st.sel);if(sel&&!list.includes(sel))list=list.concat([sel]);const mx=list.length?list[0][1]:1,[ux,uy]=WG.uk;
list.forEach(([k,v])=>{const p=WG.p[k];if(!p)return;const dx=ux-p.x,dy=uy-p.y,dist=Math.hypot(dx,dy);if(dist<8)return;
const d="M"+p.x+","+p.y+" Q"+((p.x+ux)/2-dy*0.22)+","+((p.y+uy)/2+dx*0.22-dist*0.12)+" "+ux+","+uy,w=(0.8+5*Math.sqrt(v/mx));
const a=document.createElementNS(NS,"path");a.setAttribute("d",d);a.setAttribute("class","arc");a.setAttribute("stroke-width",w.toFixed(1));a.style.animation=reduce?"":"fadein .6s ease-out both";arcs.appendChild(a);
const f=document.createElementNS(NS,"path");f.setAttribute("d",d);f.setAttribute("class","flow");f.setAttribute("stroke-width",Math.max(1.2,w*.55).toFixed(1));f.style.animationDuration=(1.2+dist/400).toFixed(2)+"s";arcs.appendChild(f)});
const sp=WG.p[st.sel];if(sp){const ring=document.createElementNS(NS,"circle");ring.setAttribute("cx",sp.x);ring.setAttribute("cy",sp.y);ring.setAttribute("r",9/view.k*1.2);ring.setAttribute("class","ring");ring.setAttribute("stroke-width","2");arcs.appendChild(ring)}
const dot=document.createElementNS(NS,"circle");dot.setAttribute("cx",ux);dot.setAttribute("cy",uy);dot.setAttribute("r",4);dot.setAttribute("fill","var(--ink)");arcs.appendChild(dot)}
function legend(){const L=document.getElementById("legend"),R=RAMP[st.lens];if(st.lens==="tw"){L.innerHTML="Projected warming by the "+twLabel()+": "+LAB.tw.map((l,i)=>'<i style="background:'+R[i]+'"></i>'+l).join(" ")+' <i style="background:'+NOD+'"></i>No data';return}
if(st.lens==="d"){L.innerHTML=["None","Under 10 ha","10 to 100","100 to 1,000","Over 1,000 ha"].map((l,i)=>'<i style="background:'+R[i]+'"></i>'+l).join(" ")+' <i style="background:'+NOD+'"></i>No data';return}
L.innerHTML=LAB[st.lens].map((l,i)=>'<i style="background:'+R[i]+'"></i>'+l).join(" ")+' <i style="background:'+NOD+'"></i>No data'}
function shareWhere(test){const T=total();if(!T)return 0;return isos().reduce((a,k)=>a+(test(C[k])?sv(k):0),0)/T*100}
function deforSel(){if(st.q===null&&st.g==="all")return[isos().reduce((a,k)=>a+(FD.dyr[k]?FD.dyr[k][st.dy]:0),0),null];if(st.q!==null){const f=P[st.q].f;return f?[Object.values(FAM[f]||{}).reduce((a,b)=>a+b,0),f]:[null,null]}
if(st.g==="all")return[isos().reduce((a,k)=>a+(C[k].d||0),0),null];
const fams=new Set(P.filter(p=>p.g===st.g&&p.f).map(p=>p.f));let s=0;fams.forEach(f=>s+=Object.values(FAM[f]||{}).reduce((a,b)=>a+b,0));return[s,null]}
function moneyParts(k){const d=k*1000;return d>=1e9?[d/1e9,1,"$"," billion"]:d>=1e6?[d/1e6,0,"$"," million"]:[d/1e3,0,"$"," thousand"]}
const N=(v,dec,pre,suf)=>'<span class="cu" data-to="'+v+'" data-dec="'+dec+'" data-pre="'+pre+'" data-suf="'+suf+'">'+pre+(+v).toFixed(dec)+suf+'</span>';
const lastNums={};
function countUp(root){root.querySelectorAll(".cu").forEach((el,i)=>{const to=+el.dataset.to,dec=+el.dataset.dec,pre=el.dataset.pre,suf=el.dataset.suf,key=root.id+i,from=lastNums[key]!==undefined?lastNums[key]:0;lastNums[key]=to;
if(reduce||from===to){el.textContent=pre+(dec?to.toFixed(dec):nf.format(Math.round(to)))+suf;return}const t0=performance.now(),D=700;
const st_=n=>{const u=Math.min(1,(n-t0)/D),e=1-Math.pow(1-u,3),v=from+(to-from)*e;el.textContent=pre+(dec?v.toFixed(dec):nf.format(Math.round(v)))+suf;if(u<1)requestAnimationFrame(st_)};requestAnimationFrame(st_)})}
function summary(){const T=total(),tl=topList(),top=tl[0],nm=st.q!==null?P[st.q].n:(st.g==="all"?"All food":GN[st.g]);
const conc=top?top[1]/T*100:0,wn=shareWhere(c=>c.w>=3),wf=shareWhere(c=>wcat(c,fy(),fs())>=3),dr=shareWhere(c=>c.dr>=3),[dh,fam]=deforSel(),mp=moneyParts(T);
const el=document.getElementById("summ");
el.innerHTML='<div><b>'+N(mp[0],mp[1],mp[2],mp[3])+'</b><span>'+nm+', UK imports 2024</span></div>'+
'<div><b>'+(top?N(Math.round(conc),0,"","%"):'–')+'</b><span>from the biggest supplier'+(top?', '+C[top[0]].n:'')+'</span></div>'+
'<div><b>'+N(Math.round(wn),0,"","%")+' → '+N(Math.round(wf),0,"","%")+'</b><span>from water-stressed countries, today and '+futLabel()+'</span></div>'+
'<div><b>'+N(Math.round(dr),0,"","%")+'</b><span>from drought-risk countries</span></div>'+
(function(){const key=(st.yr==="now"?"2050":st.yr)+st.sc;let n=0,dd=0;for(const k of isos()){const v=sv(k),t=C[k].t&&C[k].t[key];if(v&&t!==undefined){n+=v*t;dd+=v}}const w=dd?n/dd:0,uk=FD.ukt[key];return '<div><b>'+N(w,1,"+","°C")+'</b><span>average warming where it\'s grown, by the '+twLabel()+'. UK: +'+(uk||0).toFixed(1)+'°C</span></div>'})()+'<div><b>'+(dh===null?'None linked':N(Math.round(dh),0,""," ha"))+'</b><span>deforestation risk, 2023'+(fam?' (whole '+fam.toLowerCase()+' crop)':'')+'</span></div>';countUp(el)}
function panel(){const c=C[st.sel],v=sv(st.sel),T=total();
document.getElementById("pname").textContent=c.n;
document.getElementById("pval").textContent=v?money(v):"None";
const what=st.q!==null?P[st.q].n.toLowerCase():st.g==="all"?"food":GN[st.g].toLowerCase();
document.getElementById("pmeta").textContent=v?"of "+what+" sent to the UK in 2024, "+(v/T*100<0.1?"under 0.1":(v/T*100).toFixed(1))+"% of UK imports.":"No "+what+" sent to the UK in 2024.";
document.getElementById("pw0").textContent=c.w===undefined?"No data":LAB.w[c.w];
document.getElementById("pwyl").textContent=futLabel();const f=wcat(c,fy(),fs());
document.getElementById("pw5").textContent=f===null?"No data":LAB.w[f]+(c.w!==undefined&&f>c.w?" (worse)":c.w!==undefined&&f<c.w?" (better)":"");
document.getElementById("pdr").textContent=c.dr===undefined?"No data":LAB.dr[c.dr];{const key=(st.yr==="now"?"2050":st.yr)+st.sc,t=c.t&&c.t[key];document.getElementById("ptw").textContent=t===undefined?"No data":"+"+t.toFixed(1)+"°C";document.getElementById("ptwl").textContent="the "+twLabel()}
document.getElementById("pfl").textContent=c.fl===undefined?"No data":LAB.fl[c.fl];
const dv=FD.dyr[st.sel]?FD.dyr[st.sel][st.dy]:0;document.getElementById("pd").textContent=dv?nf.format(dv)+" ha"+(st.dy<18?" ("+FD.dyrs[st.dy]+")":""):"None recorded";
const tops=P.map(p=>[p.n,p.c[st.sel]||0]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,4);
document.getElementById("ptop").innerHTML=tops.map(([n,x])=>'<p class="kv">'+n+': <b>'+money(x)+'</b></p>').join("")||'<p class="kv">None recorded</p>';
document.getElementById("pdtl").style.display=c.dt?"block":"none";
document.getElementById("pdt").innerHTML=(c.dt||[]).map(([n,x])=>'<p class="kv">'+n+': <b>'+nf.format(x)+' ha</b></p>').join("")}
function types(){const rows=Object.keys(GN).filter(g=>g!=="oth").map(g=>{let t=0,a=0,b=0;for(const k in C){const v=(GV[k]&&GV[k][g])||0;t+=v;if(C[k].w>=3)a+=v;if(wcat(C[k],fy(),fs())>=3)b+=v}return[g,a/t*100,b/t*100]}).sort((x,y)=>y[1]-x[1]);
document.getElementById("tylab").textContent=futLabel();
document.getElementById("types").innerHTML=rows.map(([g,a,b])=>'<div class="grow"><span>'+GN[g]+'</span><div class="track"><span style="width:'+a+'%;background:'+RAMP.w[3]+'"></span><i style="left:'+b+'%"></i></div><b>'+Math.round(a)+'% → '+Math.round(b)+'%</b></div>').join("")+'<div class="legend"><i style="background:'+RAMP.w[3]+'"></i>Today <span style="display:inline-block;width:2px;height:12px;background:var(--ink);margin:0 6px 0 10px"></span>'+futLabel()+'</div>'}
function draw(){for(const iso in pathEl){pathEl[iso].style.fill=fill(iso);pathEl[iso].classList.toggle("sel",iso===st.sel)}
const spe=pathEl[st.sel];if(spe)vp.insertBefore(spe,arcs);pick.value=st.sel;
const fut=document.getElementById("fut");fut.style.display=st.lens==="w"||st.lens==="tw"?"inline-flex":"none";document.querySelector('#yrs button[data-y="now"]').disabled=st.lens==="tw";document.getElementById("futnote").style.display=st.lens==="w"||st.lens==="d"||st.lens==="tw"?"none":"inline";document.getElementById("dtl").style.display=st.lens==="d"&&st.q===null?"inline-flex":"none";document.getElementById("dyout").textContent=FD.dyrs[st.dy];
document.querySelectorAll("#scs button").forEach(b=>b.disabled=st.yr==="now"&&st.lens!=="tw");
document.getElementById("grpl").style.opacity=st.q!==null?.45:1;
drawArcs();legend();summary();panel();types();writeHash()}
function setQ(i){st.q=i;document.getElementById("q").value=i===null?"":P[i].n;if(i!==null){const t=topList();if(t.length&&!(P[i].c[st.sel]))st.sel=t[0][0]}draw()}
const qi=document.getElementById("q");qi.addEventListener("input",()=>{if(PI[qi.value]!==undefined)setQ(PI[qi.value])});
qi.addEventListener("keydown",e=>{if(e.key==="Enter"){const v=qi.value.toLowerCase();const hit=P.findIndex(p=>p.n.toLowerCase().startsWith(v))>=0?P.findIndex(p=>p.n.toLowerCase().startsWith(v)):P.findIndex(p=>p.n.toLowerCase().includes(v));if(hit>=0)setQ(hit)}});
document.getElementById("qclear").onclick=()=>setQ(null);
document.getElementById("lens").onchange=e=>{st.lens=e.target.value;if(st.lens==="tw"&&st.yr==="now"){st.yr="2050";document.querySelectorAll("#yrs button").forEach(x=>x.setAttribute("aria-pressed",x.dataset.y==="2050"))}draw()};
gsel.onchange=e=>{st.g=e.target.value;st.q=null;qi.value="";draw()};
document.querySelectorAll("#yrs button").forEach(b=>b.onclick=()=>{st.yr=b.dataset.y;document.querySelectorAll("#yrs button").forEach(x=>x.setAttribute("aria-pressed",x===b));draw()});
document.querySelectorAll("#scs button").forEach(b=>b.onclick=()=>{st.sc=b.dataset.s;document.querySelectorAll("#scs button").forEach(x=>x.setAttribute("aria-pressed",x===b));draw()});
(function(){const q=readHash();document.getElementById("lens").value=st.lens;gsel.value=st.g;document.querySelectorAll("#yrs button").forEach(x=>x.setAttribute("aria-pressed",x.dataset.y===st.yr));document.querySelectorAll("#scs button").forEach(x=>x.setAttribute("aria-pressed",x.dataset.s===st.sc));if(q&&PI[q]!==undefined){const keep=st.sel;st.q=PI[q];qi.value=q;if(!P[st.q].c[keep]){const t=topList();if(t.length)st.sel=t[0][0]}}})();
draw();
(function(){if(typeof d3==="undefined"){document.getElementById("bub").outerHTML='<p class="note" style="padding:20px">The chart library could not load on this network.</p>';return}
const SHORT={"Food preparations n.e.c.":"Food preparations","Chocolate products nes":"Chocolate","Cheese from whole cow milk":"Cheese","Poultry meat preparations":"Poultry products","Other non-alcoholic caloric beverages":"Soft drinks","Meat of chickens, fresh or chilled":"Chicken","Meat of cattle boneless, fresh or chilled":"Beef","Potatoes, frozen":"Frozen potatoes","Sugar confectionery":"Sweets","Sausages and similar products of meat, offal or blood of pig":"Sausages","Cake of soya beans":"Soy feed","Pig meat, cuts, salted, dried or smoked (bacon and ham)":"Bacon and ham","Fruit prepared n.e.c.":"Prepared fruit","Maize (corn)":"Maize","Coffee, green":"Coffee beans","Meat of pig boneless, fresh or chilled":"Pork","Cocoa butter, fat and oil":"Cocoa butter","Coffee, decaffeinated or roasted":"Roasted coffee","Pig meat preparations":"Pork products","Chillies and peppers, green (Capsicum spp. and Pimenta spp.)":"Peppers","Coffee extracts":"Instant coffee","Vegetables preserved nes (o/t vinegar)":"Preserved veg","Ice cream and other edible ice":"Ice cream","Beer of barley, malted":"Beer","Uncooked pasta, not stuffed or otherwise prepared":"Pasta","Yoghurt, with additives":"Yoghurt","Meat of pig with the bone, fresh or chilled":"Pork, bone-in","Mixes and doughs for the preparation of bakers' wares":"Doughs","Tangerines, mandarins, clementines":"Easy peelers","Meat of sheep, fresh or chilled":"Lamb","Vegetables frozen":"Frozen veg","Tomatoes, peeled (o/t vinegar)":"Tinned tomatoes","Rape or colza seed":"Rapeseed","Paste of tomatoes":"Tomato paste","Butter of cow milk":"Butter","Tea leaves":"Tea","Rice, milled":"Rice","Food preparations of flour, meal or malt extract":"Flour preparations","Cucumbers and gherkins":"Cucumbers","Onions and shallots, dry (excluding dehydrated)":"Onions","Cauliflowers and broccoli":"Cauliflower, broccoli","Beef and veal preparations nes":"Beef products","Mushrooms and truffles":"Mushrooms","Juice of fruits n.e.c.":"Fruit juice","Raw cane or beet sugar (centrifugal only)":"Raw sugar","Mangoes, guavas and mangosteens":"Mangoes","Green corn (maize)":"Sweetcorn","Sunflower-seed oil, crude":"Sunflower oil","Cider and other fermented beverages":"Cider","Lettuce and chicory":"Lettuce","Husked rice":"Brown rice"};
const SP="Undenatured ethyl alcohol";const short=n=>SHORT[n]||(n.startsWith(SP)?"Spirits":n.split(",")[0]);window._short=short;
const RK=[["w","Water stress","#2F78A8"],["dr","Drought","#C68A1E"],["c","One main supplier","#6F5FC7"],["d","Deforestation","#B23B26"]];
const GC={fru:"#D2604A",veg:"#5E9447",mt:"#9C4A3E",dai:"#D9AE4E",cer:"#B98E52",oil:"#8F9A3A",cof:"#6E4B35",drk:"#7D4F86",feed:"#7F8C82",spi:"#C56E2E",oth:"#8A8A8A"};
const tint=(c,t)=>d3.interpolateRgb("#FFFFFF",c)(t);
const tv=p=>Object.values(p.c).reduce((a,b)=>a+b,0);
const top=P.map((p,i)=>({i,p,t:tv(p)})).sort((a,b)=>b.t-a.t).slice(0,70);
top.forEach(o=>{let w=0,dr=0,mx=0,mk=null;for(const k in o.p.c){const v=o.p.c[k];if(C[k]&&C[k].w>=3)w+=v;if(C[k]&&C[k].dr>=3)dr+=v;if(v>mx){mx=v;mk=k}}
o.ws=w/o.t;o.ds=dr/o.t;o.cs=mx/o.t;o.top=mk;o.dh=o.p.f?Object.values(FAM[o.p.f]||{}).reduce((a,b)=>a+b,0):0;o.fl={w:o.ws>.5,dr:o.ds>.5,c:o.cs>.5,d:o.dh>500};o.n=Object.values(o.fl).filter(Boolean).length;o.name=short(o.p.n);o.col=GC[o.p.g]||"#888"});
const W=960,H=640,svg=d3.select("#bub"),tip=document.getElementById("btip"),wrap=document.querySelector(".bubwrap");
svg.append("rect").attr("class","bg").attr("width",W).attr("height",H).attr("fill","transparent");
const world=svg.append("g");
const groups=[...new Set(top.map(d=>d.p.g))];
const root=d3.hierarchy({children:groups.map(g=>({g,children:top.filter(d=>d.p.g===g).map(d=>({d}))}))}).sum(x=>x.d?Math.max(x.d.t,60000):0).sort((a,b)=>b.value-a.value);
d3.pack().size([H-30,H-30]).padding(n=>n.depth===0?44:4)(root);
const SX=1.5,cx0=(H-30)/2,stretch=x=>W/2+(x-cx0)*SX;
const gnodes=root.children.map(n=>({g:n.data.g,x:stretch(n.x),y:n.y+18,r:n.r,col:GC[n.data.g],items:n.leaves().map(l=>l.data.d)}));
root.children.forEach((n,k)=>n.leaves().forEach(l=>{const d=l.data.d;d.r=l.r;d.px=gnodes[k].x+(l.x-n.x);d.py=l.y+18}));
const mx={l:78,r:30,t:44,b:58},xs=d3.scaleLinear().domain([0,1]).range([mx.l,W-mx.r]),ys=d3.scaleLinear().domain([0,1]).range([H-mx.b,mx.t]);
const ax=world.append("g").attr("class","ax").style("opacity",0).style("pointer-events","none");
ax.append("rect").attr("x",xs(.5)).attr("y",ys(1)).attr("width",xs(1)-xs(.5)).attr("height",ys(.5)-ys(1)).attr("fill","#B23B26").attr("opacity",.06).attr("rx",6);
[0,.25,.5,.75,1].forEach(v=>{ax.append("line").attr("x1",xs(v)).attr("x2",xs(v)).attr("y1",ys(0)).attr("y2",ys(1)).attr("stroke","var(--rule)").attr("stroke-dasharray",v===.5?"":"2 5");
ax.append("line").attr("y1",ys(v)).attr("y2",ys(v)).attr("x1",xs(0)).attr("x2",xs(1)).attr("stroke","var(--rule)").attr("stroke-dasharray",v===.5?"":"2 5");
ax.append("text").attr("x",xs(v)).attr("y",H-mx.b+20).attr("text-anchor","middle").text(Math.round(v*100)+"%");ax.append("text").attr("x",mx.l-10).attr("y",ys(v)+4).attr("text-anchor","end").text(Math.round(v*100)+"%")});
ax.append("text").attr("x",(xs(0)+xs(1))/2).attr("y",H-14).attr("text-anchor","middle").text("Share from water-stressed countries →");
ax.append("text").attr("transform","translate(20,"+((ys(0)+ys(1))/2)+") rotate(-90)").attr("text-anchor","middle").text("Share from the single biggest supplier →");
ax.append("text").attr("class","ql").attr("x",xs(1)-12).attr("y",ys(1)+24).attr("text-anchor","end").text("Exposed and dependent");
ax.append("text").attr("class","ql").attr("x",xs(0)+12).attr("y",ys(0)-14).attr("text-anchor","start").text("Spread out, lower stress");
const gl=world.append("g").attr("class","glayer");
const gcirc=gl.selectAll("g").data(gnodes).join("g").attr("class","gnode").attr("tabindex",0).attr("role","button").attr("aria-label",n=>"Zoom into "+GN[n.g]);
gcirc.append("circle").attr("cx",n=>n.x).attr("cy",n=>n.y).attr("r",n=>n.r+6).attr("fill",n=>tint(n.col,.09)).attr("stroke",n=>tint(n.col,.45)).attr("stroke-width",1.2);
const GLL=[];const glab=gcirc.append("text").attr("class","gl").attr("x",n=>n.x).attr("y",n=>n.y-n.r-28).attr("fill",n=>d3.color(n.col).darker(1.2)).text(n=>GN[n.g]);
const gsub=gcirc.append("text").attr("class","gs").attr("x",n=>n.x).attr("y",n=>n.y-n.r-13).attr("fill",n=>d3.color(n.col).darker(.6)).text(n=>money(d3.sum(n.items,d=>d.t)));
const arc=d3.arc();
const nodes=world.append("g").selectAll("g").data(top).join("g").attr("class","node").attr("tabindex",-1).attr("role","button").attr("aria-label",d=>d.p.n+", "+money(d.t)+", "+d.n+" of 4 risks");
nodes.append("circle").attr("class","core").attr("r",d=>d.r).attr("fill",d=>tint(d.col,.22+d.n*.19)).attr("stroke","#FFFFFF").attr("stroke-width",1.2);
let K=1;const th=()=>Math.max(2.2,4.5/K);
const ringD=(r,j)=>arc({innerRadius:r+1.5/K,outerRadius:r+1.5/K+th(),startAngle:j*Math.PI/2+0.1,endAngle:(j+1)*Math.PI/2-0.1});
top.forEach(d=>d.cr=d.r);
nodes.each(function(d){const g=d3.select(this);RK.forEach(([k,lab,col],j)=>{g.append("path").attr("class","seg seg-"+k).attr("data-j",j).attr("d",ringD(d.r,j)).attr("fill",d.fl[k]?col:"#D9DDD9").attr("opacity",d.fl[k]?1:.7)})});
const glayer2=world.append("g").attr("class","glabels").style("pointer-events","none");glab.each(function(){glayer2.node().appendChild(this)});gsub.each(function(){glayer2.node().appendChild(this)});
const lb=nodes.append("text").attr("class","lb").attr("text-anchor","middle");
const lb2=nodes.append("text").attr("class","lb2").attr("dy","0.35em").style("text-anchor","start").style("paint-order","stroke").style("stroke","var(--card)").style("stroke-width","3px").style("opacity",0).text(d=>d.name);
function fitLines(d,px){const avail=px*1.72;for(let fs=Math.max(9,Math.min(14,px/3));fs>=8.5;fs-=0.5){const cw=fs*0.56;const words=d.name.split(" ");let lines=[],cur="";
words.forEach(w=>{const t=cur?cur+" "+w:w;if(t.length*cw<=avail)cur=t;else{if(cur)lines.push(cur);cur=w}});if(cur)lines.push(cur);
if(!(lines.some(l=>l.length*cw>avail)||lines.length*fs*1.15>px*1.35||lines.length>3))return{lines,fs}}return null}
function drawLabels(){lb.each(function(d){const t=d3.select(this);t.selectAll("tspan").remove();if(mode==="matrix")return;const px=d.cr*K;if(px<17)return;const f=fitLines(d,px);if(!f)return;
const fs=f.fs/K,n=f.lines.length,showV=K>1.2&&px>34;const tot=n+(showV?1:0);t.attr("fill",d.n>=3?"#FFFFFF":d3.color(d.col).darker(2.2)).style("font-size",fs+"px");
f.lines.forEach((l,i)=>t.append("tspan").attr("x",0).attr("y",(i-(tot-1)/2)*fs*1.15).attr("dy","0.35em").style("font-weight",600).text(l));
if(showV)t.append("tspan").attr("x",0).attr("y",(n-(tot-1)/2)*fs*1.15).attr("dy","0.35em").style("font-weight",400).style("font-size",(fs*0.9)+"px").text(money(d.t))})}
const outside=d=>d.n>=3||(d.ws>.5&&d.cs>.5)||d.t>2.5e6||d.cs>.7;
let mode="cluster",focus=null;const reduce_=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function resize(scale,dur){top.forEach(d=>{d._from=d.cr;d.cr=d.r*scale});
nodes.select("circle.core").transition().duration(dur).attr("r",d=>d.cr);
nodes.selectAll("path.seg").transition().duration(dur).attrTween("d",function(){const d=d3.select(this.parentNode).datum(),j=+this.dataset.j,i=d3.interpolate(d._from,d.cr);return t=>ringD(i(t),j)});
lb2.transition().duration(dur).style("opacity",d=>scale<1&&outside(d)?1:0)}
function rings(){nodes.selectAll("path.seg").attr("d",function(){const d=d3.select(this.parentNode).datum();return ringD(d.cr,+this.dataset.j)})}
function placeLabels(){if(mode!=="matrix")return;const L=[];nodes.each(function(d){if(!outside(d))return;const t=d3.select(this).select("text.lb2"),right=d.x>W-190;t.attr("x",right?-(d.cr+8):d.cr+8).style("text-anchor",right?"end":"start");const w=d.name.length*6.8;L.push({d,t,x0:right?d.x-d.cr-8-w:d.x+d.cr+8,x1:right?d.x-d.cr-8:d.x+d.cr+8+w,y:d.y})});
L.sort((a,b)=>a.y-b.y);for(let it=0;it<4;it++)for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const a=L[i],b=L[j];if(a.x1<b.x0||b.x1<a.x0)continue;if(Math.abs(b.y-a.y)<14)b.y=a.y+14}
L.forEach(l=>l.t.attr("y",l.y-l.d.y))}
const sim=d3.forceSimulation(top).alphaDecay(0.035).velocityDecay(0.34).on("end",placeLabels).on("tick",()=>{if(mode==="matrix")top.forEach(d=>{d.x=Math.max(d.cr+6,Math.min(W-d.cr-6,d.x));d.y=Math.max(d.cr+6,Math.min(H-d.cr-6,d.y))});nodes.attr("transform",d=>"translate("+d.x+","+d.y+")")}).stop();
function zoomTo(n,dur){focus=n;let k=1,tx=0,ty=0;if(n){k=Math.min(W,H)*0.86/(2*(n.r+6));tx=W/2-n.x*k;ty=H/2-n.y*k+10}
const t0=K;world.transition().duration(reduce_?0:dur).ease(d3.easeCubicInOut).attr("transform","translate("+tx+","+ty+") scale("+k+")").tween("k",()=>{const i=d3.interpolate(t0,k);return t=>{K=i(t);rings();glab.style("font-size",(15/K)+"px").attr("y",g=>g.y-g.r-6-22/K);gsub.style("font-size",(12/K)+"px").attr("y",g=>g.y-g.r-6-7/K)}}).on("end",()=>{drawLabels()});
gcirc.transition().duration(dur).style("opacity",g=>!n||g===n?1:.25);glab.transition().duration(dur).style("opacity",g=>!n||g===n?1:.25);gsub.transition().duration(dur).style("opacity",g=>!n||g===n?1:.25);nodes.transition().duration(dur).style("opacity",d=>!n||d.p.g===n.g?1:.15);
nodes.attr("tabindex",d=>n&&d.p.g===n.g?0:-1);
crumb.innerHTML=n?'<button type="button" class="crumbbtn" id="zback">← All foods</button><span>'+GN[n.g]+': '+n.items.length+' foods, '+money(d3.sum(n.items,d=>d.t))+'</span>':'<span>Select a food group to zoom in</span>';
if(n)document.getElementById("zback").onclick=()=>{hideCard();zoomTo(null,750)};lb.selectAll("tspan").remove()}
const crumb=document.createElement("div");crumb.className="crumb";wrap.appendChild(crumb);
const card=document.createElement("div");card.className="bcard";card.style.display="none";wrap.appendChild(card);
function hideCard(){card.style.display="none"}
function showCard(d){const bar=(lab,v,col,txt)=>'<div class="cb"><span>'+lab+'</span><div class="cbt"><i style="width:'+Math.round(v*100)+'%;background:'+col+'"></i></div><b>'+txt+'</b></div>';
card.innerHTML='<button type="button" class="cx" aria-label="Close">×</button><p class="ck" style="color:'+d3.color(d.col).darker(1)+'">'+GN[d.p.g]+'</p><h4>'+d.p.n+'</h4><p class="cv">'+money(d.t)+' a year</p>'+
bar("Water stress",d.ws,RK[0][2],Math.round(d.ws*100)+"%")+bar("Drought",d.ds,RK[1][2],Math.round(d.ds*100)+"%")+bar("Biggest supplier",d.cs,RK[2][2],Math.round(d.cs*100)+"%")+
'<p class="cs">Biggest supplier: '+(C[d.top]?C[d.top].n:"")+'</p><p class="cs">Deforestation risk: <b>'+(d.dh?nf.format(Math.round(d.dh))+' ha':'none linked')+'</b>'+(d.p.f&&d.dh?' (whole '+d.p.f.toLowerCase()+' crop)':'')+'</p><button type="button" class="cgo">Open on the map</button>';
card.style.display="block";card.querySelector(".cx").onclick=hideCard;card.querySelector(".cgo").onclick=()=>{setQ(d.i);window._jump("ex")}}
function showTip(e,d){const b=wrap.getBoundingClientRect();tip.style.left=(e.clientX-b.left+wrap.scrollLeft)+"px";tip.style.top=(e.clientY-b.top)+"px";tip.style.display="block";tip.innerHTML="<b>"+d.name+"</b>, "+money(d.t)+(d.n?" · "+d.n+" of 4 risks":"")}
nodes.on("mousemove",showTip).on("mouseleave",()=>tip.style.display="none").on("click",(e,d)=>{e.stopPropagation();tip.style.display="none";if(mode==="cluster"&&(!focus||focus.g!==d.p.g)){zoomTo(gnodes.find(g=>g.g===d.p.g),750);showCard(d);return}showCard(d)})
.on("keydown",(e,d)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();showCard(d)}});
gcirc.on("click",(e,n)=>{e.stopPropagation();if(mode!=="cluster")return;hideCard();zoomTo(focus===n?null:n,750)}).on("keydown",(e,n)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();hideCard();zoomTo(focus===n?null:n,750)}});
svg.select("rect.bg").on("click",()=>{if(focus){hideCard();zoomTo(null,750)}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&focus){hideCard();zoomTo(null,750)}});
function setMode(m){mode=m;const cl=m==="cluster";hideCard();if(focus)zoomTo(null,500);
resize(cl?1:0.5,700);
sim.force("x",d3.forceX(d=>cl?d.px:xs(d.ws)).strength(cl?0.4:0.6)).force("y",d3.forceY(d=>cl?d.py:ys(d.cs)).strength(cl?0.4:0.6)).force("collide",d3.forceCollide(d=>(cl?d.r:d.r*0.5)+2.5).strength(0.85).iterations(2));
ax.transition().duration(600).style("opacity",cl?0:1);gl.transition().duration(500).style("opacity",cl?1:0).style("pointer-events",cl?"auto":"none");glayer2.transition().duration(500).style("opacity",cl?1:0);
crumb.style.visibility=cl?"visible":"hidden";lb.selectAll("tspan").remove();
nodes.select("circle.core").transition("fill").duration(600).attr("fill",d=>cl?tint(d.col,.22+d.n*.19):d.col).attr("stroke",cl?"#FFFFFF":"var(--card)");
const done=()=>{placeLabels();if(cl)drawLabels()};
if(reduce_){sim.alpha(1);for(let k=0;k<300;k++)sim.tick();sim.on("tick")();done()}else{sim.alpha(0.9).restart();setTimeout(done,1700)}}
document.querySelectorAll("#bmode button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#bmode button").forEach(x=>x.setAttribute("aria-pressed",x===b));setMode(b.dataset.v)});
const KE=document.getElementById("rkeys");let hi=null;
KE.innerHTML=RK.map(([k,l,c])=>'<button class="rkey" data-k="'+k+'" aria-pressed="false" style="--c:'+c+'"><i></i>'+l+'</button>').join("");
KE.querySelectorAll(".rkey").forEach(b=>b.onclick=()=>{hi=hi===b.dataset.k?null:b.dataset.k;KE.querySelectorAll(".rkey").forEach(x=>x.setAttribute("aria-pressed",x.dataset.k===hi));
nodes.select("circle.core").style("opacity",d=>!hi||d.fl[hi]?1:.2);nodes.select("text.lb").style("opacity",d=>!hi||d.fl[hi]?1:.25);
nodes.selectAll(".seg").style("opacity",function(){const k=[...this.classList].find(c=>c.startsWith("seg-")).slice(4),d=d3.select(this.parentNode).datum();if(!hi)return d.fl[k]?1:.7;return d.fl[hi]?(d.fl[k]?1:.7):.12})});
document.getElementById("gkeys").innerHTML=groups.map(g=>'<span style="--c:'+GC[g]+'">'+GN[g]+'</span>').join("");
top.forEach(d=>{d.x=W/2+(Math.random()-.5)*80;d.y=H/2+(Math.random()-.5)*80});nodes.attr("transform",d=>"translate("+d.x+","+d.y+")");
zoomTo(null,0);
const start=()=>setMode("cluster");
if("IntersectionObserver" in window){const io=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){start();io.disconnect()}},{threshold:.2});io.observe(document.getElementById("bub"))}else start()})();
(function(){const D=document.getElementById("dcom"),mx=FD.dcom[0][1];
D.innerHTML=FD.dcom.map(([n,v])=>'<div class="grow"><span>'+n+'</span><div class="track" style="background:none"><span style="width:'+(v/mx*100)+'%;background:'+(n==="Other"?"#8A9A9C":RAMP.d[3])+'"></span></div><b>'+nf.format(v)+' ha</b></div>').join("")})();
(function(){const s=document.getElementById("dtrend"),ys=Object.keys(FD.dtrend).map(Number).sort(),vs=ys.map(y=>FD.dtrend[y]),W=760,H=240,pl=56,pr=20,pt=12,pb=28,mx=Math.ceil(Math.max(...vs)/10000)*10000;
const sx=i=>pl+i*(W-pl-pr)/(ys.length-1),sy=v=>pt+(mx-v)/mx*(H-pt-pb);let h="";
for(let g=0;g<=mx;g+=10000)h+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+sy(g)+'" y2="'+sy(g)+'" stroke="var(--rule)"/><text x="'+(pl-8)+'" y="'+(sy(g)+4)+'" text-anchor="end">'+nf.format(g)+'</text>';
ys.forEach((y,i)=>{if(y%3===2||i===ys.length-1)h+='<text x="'+sx(i)+'" y="'+(H-8)+'" text-anchor="middle">'+y+'</text>'});
h+='<polyline points="'+vs.map((v,i)=>sx(i)+","+sy(v)).join(" ")+'" fill="none" stroke="'+RAMP.d[3]+'" stroke-width="2.5"/>';s.innerHTML=h})();

(function(){const btn=document.getElementById("fplay");let t=null;const seq=["now","2030","2050","2080"];
function setYr(y){st.yr=y;document.querySelectorAll("#yrs button").forEach(x=>x.setAttribute("aria-pressed",x.dataset.y===y));draw()}
btn.onclick=()=>{if(t){clearInterval(t);t=null;btn.textContent="Play the future";return}
if(st.lens!=="w"&&st.lens!=="tw"){st.lens="w";document.getElementById("lens").value="w"}const seqL=st.lens==="tw"?["2030","2050","2080"]:seq;let i=0;setYr(seqL[0]);btn.textContent="Pause";
t=setInterval(()=>{i++;if(i>=seqL.length){clearInterval(t);t=null;btn.textContent="Play the future";return}setYr(seqL[i])},1400)};window._setYr=setYr})();
(function(){const S=[
{t:"Olive oil is the most exposed food we import",x:"99% of UK olive oil imports come from water-stressed countries, and 93% from drought-risk countries. Two-thirds comes from Spain alone.",q:"Olive oil",lens:"w",yr:"now",sel:"ESP",z:["ESP","ITA","GRC","PRT"]},
{t:"Lettuce: one country, one risk",x:"88% of the UK's imported lettuce and chicory comes from Spain, where water stress on irrigated farmland is extremely high.",q:"Lettuce and chicory",lens:"w",yr:"now",sel:"ESP",z:["ESP","PRT","FRA","MAR"]},
{t:"Avocados come a long way, from dry places",x:"Peru, Israel and South Africa supply 61% of UK avocado imports. 83% of the total comes from water-stressed countries.",q:"Avocados",lens:"w",yr:"now",sel:"PER",z:["PER","ISR","ZAF","CHL","COL"]},
{t:"Cocoa: three risks at once",x:"82% of UK cocoa bean imports come from Côte d'Ivoire. 95% come from drought-risk countries, and cocoa carries more deforestation risk than any other UK food import.",q:"Cocoa beans",lens:"d",yr:"now",sel:"CIV",z:["CIV","GHA","LBR","NGA","CMR"]},
{t:"Brazilian beef and South American soy",x:"Beef from Brazil accounts for about a fifth of the deforestation risk linked to UK food imports. Soy from Paraguay, Brazil and Argentina adds more.",q:null,g:"all",lens:"d",yr:"now",sel:"BRA",z:["BRA","PRY","ARG","BOL"]},
{t:"Not everything is at risk",x:"None of the UK's imported bananas come from water-stressed countries. Colombia and Costa Rica supply nearly half.",q:"Bananas",lens:"w",yr:"now",sel:"COL",z:["COL","CRI","DOM","ECU","PAN"]},
{t:"The places that grow our food are warming faster",x:"By the 2080s under business as usual, the countries the UK imports food from are projected to warm by about 3.2°C on average, against about 2.5°C for the UK itself. Hotter summers mean more heat stress on crops, livestock and farm workers.",q:null,g:"all",lens:"tw",yr:"2080",sc:"bau",sel:"ESP",z:null},
{t:"The future: the risk is already here",x:"By 2080 under the pessimistic scenario, water stress worsens in suppliers such as Türkiye, Kenya and Canada. But the UK's overall exposure only rises from 36% to about 38%, because its main suppliers are already in the top bands.",q:null,g:"all",lens:"w",yr:"2080",sc:"pes",sel:"KEN",z:null}];
let i=-1;const T=document.getElementById("tt"),X=document.getElementById("tx"),dots=document.getElementById("tdots"),nx=document.getElementById("tnext"),pv=document.getElementById("tprev");
dots.innerHTML=S.map(()=>"<i></i>").join("");
function intro(){T.textContent="Take the tour: "+S.length+" findings";X.textContent="Step through what the data shows, or explore the map yourself below.";nx.textContent="Start the tour";pv.style.visibility="hidden";dots.querySelectorAll("i").forEach(d=>d.classList.remove("on"))}
function go(n){i=n;const s=S[i];T.textContent=s.t;X.textContent=s.x;nx.textContent=i===S.length-1?"Back to start":"Next finding";pv.style.visibility="visible";
dots.querySelectorAll("i").forEach((d,j)=>d.classList.toggle("on",j<=i));
st.lens=s.lens;document.getElementById("lens").value=s.lens;if(s.g){st.g=s.g;gsel.value=s.g}
st.sc=s.sc||"bau";document.querySelectorAll("#scs button").forEach(x=>x.setAttribute("aria-pressed",x.dataset.s===st.sc));
st.yr=s.yr;document.querySelectorAll("#yrs button").forEach(x=>x.setAttribute("aria-pressed",x.dataset.y===st.yr));
st.sel=s.sel;setQ(s.q?PI[s.q]:null);st.sel=s.sel;draw();zoomToBox(s.z?boxOf(s.z):null,900)}
nx.onclick=()=>{if(i>=S.length-1){i=-1;intro();setQ(null);animateTo({k:1,x:0,y:0},600);return}go(i+1)};
pv.onclick=()=>{if(i<=0){i=-1;intro();return}go(i-1)};intro()})();

(function(){const sl=document.getElementById("dyr"),btn=document.getElementById("dplay");let t=null;
sl.oninput=()=>{st.dy=+sl.value;draw()};
btn.onclick=()=>{if(t){clearInterval(t);t=null;btn.textContent="Play 2005 to 2023";return}st.dy=0;sl.value=0;draw();btn.textContent="Pause";
t=setInterval(()=>{st.dy++;sl.value=st.dy;draw();if(st.dy>=18){clearInterval(t);t=null;btn.textContent="Play 2005 to 2023"}},650)}})();
(function(){const tv=p=>Object.values(p.c).reduce((a,b)=>a+b,0);const TOT=P.map(tv);
const sup=Object.keys(C).map(k=>[k,P.reduce((a,p)=>a+(p.c[k]||0),0)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,40);
const sel=document.getElementById("skc");sup.forEach(([k])=>{const o=document.createElement("option");o.value=k;o.textContent=C[k].n;sel.appendChild(o)});
const PR=[["ESP",40,"Spain: severe drought"],["CIV",50,"Côte d'Ivoire: cocoa harvest fails"],["NLD",30,"Netherlands: port disruption"],["ITA",30,"Italy: heatwave summer"],["BRA",30,"Brazil: drought"]];
const pr=document.getElementById("presets");pr.innerHTML='<span class="note" style="margin:0">Try a scenario:</span>'+PR.map((x,i)=>'<button class="preset" data-i="'+i+'" aria-pressed="false" type="button">'+x[2]+'</button>').join("");
let cur={c:"ESP",l:40};const lsl=document.getElementById("skl");
function nm(n){return(window._short?window._short(n):n.split(",")[0])}
function run(){sel.value=cur.c;lsl.value=cur.l;document.getElementById("sklo").textContent=cur.l+"%";
const f=cur.l/100;let lost=0;const rows=[];P.forEach((p,i)=>{const v=p.c[cur.c]||0;if(!v)return;lost+=v*f;const t=TOT[i];if(t>=50000)rows.push([i,v*f/t,v*f,t])});
rows.sort((a,b)=>b[1]-a[1]||b[2]-a[2]);const big=rows.filter(r=>r[1]>0.2).length,hard=rows[0];
const total=TOT.reduce((a,b)=>a+b,0);
document.getElementById("sks").innerHTML='<div><b>'+money(lost)+'</b><span>of UK food imports lost, '+(lost/total*100).toFixed(1)+'% of the total</span></div><div><b>'+big+'</b><span>foods would lose more than a fifth of their UK supply</span></div><div><b>'+(hard?Math.round(hard[1]*100)+'%':'–')+'</b><span>'+(hard?'of UK '+nm(P[hard[0]].n).toLowerCase()+' imports gone, the hardest hit':'')+'</span></div>';
const B=document.getElementById("skbars"),top=rows.slice(0,12);
B.innerHTML=top.map(r=>'<div class="skrow"><span>'+nm(P[r[0]].n)+'<small>'+money(r[3])+' a year</small></span><div class="tr"><i style="width:0%"></i></div><b>−'+Math.round(r[1]*100)+'%</b></div>').join("")||'<p class="note">This country supplies none of the larger foods.</p>';
requestAnimationFrame(()=>requestAnimationFrame(()=>B.querySelectorAll(".tr i").forEach((e,j)=>e.style.width=(top[j][1]*100)+"%")));
pr.querySelectorAll(".preset").forEach(x=>x.setAttribute("aria-pressed",PR[+x.dataset.i][0]===cur.c&&PR[+x.dataset.i][1]===cur.l))}
pr.querySelectorAll(".preset").forEach(x=>x.onclick=()=>{const p=PR[+x.dataset.i];cur={c:p[0],l:p[1]};run()});
sel.onchange=()=>{cur.c=sel.value;run()};lsl.oninput=()=>{cur.l=+lsl.value;run()};run()})();
(function(){const btn=document.getElementById("shot");btn.onclick=async()=>{btn.disabled=true;const old=btn.textContent;btn.textContent="Preparing…";
try{const cs=getComputedStyle(document.documentElement),V=n=>cs.getPropertyValue(n).trim();
const svg=document.getElementById("map").cloneNode(true);svg.querySelectorAll(".flow,.ring").forEach(e=>e.remove());
svg.setAttribute("xmlns","http://www.w3.org/2000/svg");svg.setAttribute("width","1100");svg.setAttribute("height",Math.round(1100*WG.h/WG.w));
svg.querySelectorAll("path.c").forEach(p=>{p.setAttribute("stroke",V("--paper")||"#fff");p.setAttribute("stroke-width","0.6")});
svg.querySelectorAll(".arc").forEach(p=>{p.setAttribute("fill","none");p.setAttribute("stroke",V("--ink")||"#1C2B2D");p.setAttribute("opacity","0.55");p.setAttribute("stroke-linecap","round")});
svg.querySelectorAll("circle").forEach(c=>c.setAttribute("fill",V("--ink")||"#1C2B2D"));
let xml=new XMLSerializer().serializeToString(svg).replace(/var\(--[a-z0-9-]+\)/g,"#1C2B2D");
const img=new Image();await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(xml)});
const W=1200,H=850,cv=document.createElement("canvas");cv.width=W;cv.height=H;const x=cv.getContext("2d");
x.fillStyle=V("--paper")||"#F6F7F4";x.fillRect(0,0,W,H);x.fillStyle=V("--ink")||"#1C2B2D";
x.font="600 46px 'Source Serif 4', Georgia, serif";const title=(st.q!==null?P[st.q].n:(st.g==="all"?"All UK food imports":GN[st.g]));
x.fillText(title.length>48?title.slice(0,46)+"…":title,50,90);
x.font="400 24px 'Public Sans', Arial, sans-serif";x.fillStyle=V("--ink2")||"#4A5A5C";
const lensName={tw:"Projected warming by the "+twLabel(),w:"Water stress "+(st.yr==="now"?"today":st.yr+", "+SCN[st.sc]),dr:"Drought risk",fl:"River flood risk",d:"Deforestation risk, "+FD.dyrs[st.dy]}[st.lens];x.fillText("Where it comes from, coloured by "+lensName.toLowerCase(),50,130);
x.drawImage(img,50,160,1100,Math.round(1100*WG.h/WG.w));
const all=[...document.querySelectorAll("#summ > div")],pickI=[0,1,st.lens==="d"?5:st.lens==="tw"?4:2,st.lens==="dr"?3:(st.lens==="d"||st.lens==="tw"?2:3)],cards=pickI.map(i=>all[i]).filter(Boolean);const y0=160+Math.round(1100*WG.h/WG.w)+40;
cards.forEach((c,i)=>{const bx=50+i*280;x.fillStyle=V("--ink")||"#1C2B2D";x.font="600 34px 'Source Serif 4', Georgia, serif";x.fillText(c.querySelector("b").textContent,bx,y0+30);
x.fillStyle=V("--ink2")||"#4A5A5C";x.font="400 17px 'Public Sans', Arial, sans-serif";const words=c.querySelector(':scope > span').textContent.split(" ");let line="",ly=y0+62;words.forEach(w=>{const t=line?line+" "+w:w;if(x.measureText(t).width>250){x.fillText(line,bx,ly);line=w;ly+=22}else line=t});x.fillText(line,bx,ly)});
x.fillStyle=V("--ink3")||"#7B8889";x.font="400 16px 'Public Sans', Arial, sans-serif";x.fillText("Greener Edge Sustainability. Data: FAOSTAT, WRI Aqueduct 4.0, Singh et al. (2026). Explore it: greener-edge.github.io/wales-open-data",50,H-34);
const a=document.createElement("a");a.download="greener-edge-food-risk.png";a.href=cv.toDataURL("image/png");document.body.appendChild(a);a.click();a.remove();btn.textContent="Saved"}
catch(e){btn.textContent="Couldn't create the image here"}setTimeout(()=>{btn.textContent=old;btn.disabled=false},2200)}})();

(function(){if(typeof d3==="undefined")return;const svg=d3.select("#globe"),S=520,R=240;svg.classed("globe",true);
const proj=d3.geoOrthographic().scale(R).translate([S/2,S/2]).clipAngle(90).rotate([10,-25]),path=d3.geoPath(proj);
const UK=[-1.5,52.5];
GLOBE.features.forEach(f=>{if(d3.geoArea(f)>2*Math.PI){f.geometry.coordinates.forEach(p=>p.forEach(r=>r.reverse()))}});
svg.append("circle").attr("cx",S/2).attr("cy",S/2).attr("r",R).attr("fill","var(--card)").attr("stroke","var(--rule)");
const grat=svg.append("path").datum(d3.geoGraticule10()).attr("fill","none").attr("stroke","var(--rule)").attr("stroke-width",.5);
const tot=Object.keys(C).map(k=>[k,P.reduce((a,p)=>a+(p.c[k]||0),0)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
const T=tot.reduce((a,b)=>a+b[1],0),top10=tot.slice(0,10),top25=tot.slice(0,25);
const land=svg.append("g").selectAll("path").data(GLOBE.features).join("path").attr("class","land").attr("fill",f=>{const c=C[f.id];return c&&c.w!==undefined?RAMP.w[c.w]:NOD});
const cen=Object.fromEntries(GLOBE.features.map(f=>[f.id,[f.properties.lx,f.properties.ly]]));
const mx=top25[0][1];const arcs=top25.filter(([k])=>cen[k]).map(([k,v])=>({k,v,ls:{type:"LineString",coordinates:[cen[k],UK]}}));
const ag=svg.append("g");const a1=ag.selectAll("path.arcg").data(arcs).join("path").attr("class","arcg").attr("stroke-width",d=>(0.6+4*Math.sqrt(d.v/mx)).toFixed(1));
const a2=ag.selectAll("path.arcf").data(arcs).join("path").attr("class","arcf").attr("stroke-width",d=>Math.max(1,(0.4+2.2*Math.sqrt(d.v/mx))).toFixed(1));
const ukd=svg.append("circle").attr("r",4).attr("fill","var(--ink)");let hl=null;
function render(){land.attr("d",path).attr("stroke",f=>f.id===hl?"var(--ink)":null).attr("stroke-width",f=>f.id===hl?1.6:null);grat.attr("d",path);a1.attr("d",d=>path(d.ls)).style("opacity",d=>hl&&d.k!==hl?.15:null);a2.attr("d",d=>path(d.ls)).style("opacity",d=>hl&&d.k!==hl?0:null);
const p=proj(UK),vis=d3.geoDistance(UK,[-proj.rotate()[0],-proj.rotate()[1]])<Math.PI/2;ukd.attr("cx",p[0]).attr("cy",p[1]).style("opacity",vis?1:0)}
let spin=!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches),last=performance.now(),drag=false,pause=0;
function frame(n){const dt=n-last;last=n;if(spin&&!drag&&n>pause){const r=proj.rotate();proj.rotate([r[0]+dt*0.006,r[1]]);render()}requestAnimationFrame(frame)}
const el=svg.node();let start=null;
el.addEventListener("pointerdown",e=>{drag=true;el.setPointerCapture(e.pointerId);el.classList.add("drag");start={x:e.clientX,y:e.clientY,r:proj.rotate()}});
el.addEventListener("pointermove",e=>{if(!drag)return;const k=75/R;proj.rotate([start.r[0]+(e.clientX-start.x)*k,Math.max(-70,Math.min(70,start.r[1]-(e.clientY-start.y)*k))]);render()});
const end=()=>{drag=false;el.classList.remove("drag");pause=performance.now()+2500};el.addEventListener("pointerup",end);el.addEventListener("pointercancel",end);
function flyTo(k){const c=cen[k];if(!c)return;hl=k;pause=performance.now()+6000;const r0=proj.rotate(),r1=[-c[0],-Math.max(-60,Math.min(60,c[1]))*0.8];const i=d3.interpolate(r0,r1);
d3.transition().duration(1100).tween("r",()=>t=>{proj.rotate(i(t));render()})}
const L=document.getElementById("glist");L.innerHTML=top10.map(([k,v],i)=>'<button class="grow2" data-k="'+k+'" aria-pressed="false" type="button"><span class="rk">'+(i+1)+'</span><span>'+C[k].n+'</span><span class="bt"><i style="width:'+(v/top10[0][1]*100)+'%"></i></span><b>'+(v/T*100).toFixed(1)+'%</b></button>').join("")+'<p class="note">Share of UK food imports by value, 2024. The top ten supply '+Math.round(top10.reduce((a,b)=>a+b[1],0)/T*100)+'% between them.</p>';
L.querySelectorAll(".grow2").forEach(b=>{b.onclick=()=>{L.querySelectorAll(".grow2").forEach(x=>x.setAttribute("aria-pressed",x===b));flyTo(b.dataset.k)};b.onmouseenter=()=>{hl=b.dataset.k;render()};b.onmouseleave=()=>{if(b.getAttribute("aria-pressed")!=="true"){hl=null;render()}}});
render();requestAnimationFrame(frame)})();
(function(){const PI={};P.forEach((p,i)=>PI[p.n]=i);
const M=[["Sunday roast",[["Beef","Meat of cattle boneless, fresh or chilled"],["Potatoes","Potatoes"],["Carrots","Carrots and turnips"],["Peas","Peas, green"],["Flour","Wheat"],["Onion gravy","Onions and shallots, dry (excluding dehydrated)"]]],
["Spaghetti bolognese",[["Pasta","Uncooked pasta, not stuffed or otherwise prepared"],["Beef mince","Meat of cattle boneless, fresh or chilled"],["Tinned tomatoes","Tomatoes, peeled (o/t vinegar)"],["Tomato paste","Paste of tomatoes"],["Onions","Onions and shallots, dry (excluding dehydrated)"],["Garlic","Green garlic"],["Olive oil","Olive oil"],["Cheese","Cheese from whole cow milk"]]],
["Full English",[["Bacon","Pig meat, cuts, salted, dried or smoked (bacon and ham)"],["Sausages","Sausages and similar products of meat, offal or blood of pig"],["Eggs","Hen eggs in shell, fresh"],["Tomatoes","Tomatoes"],["Mushrooms","Mushrooms and truffles"],["Baked beans","Beans, dry"],["Toast","Wheat"],["Tea","Tea leaves"]]],
["Chicken curry",[["Chicken","Meat of chickens, fresh or chilled"],["Rice","Rice, milled"],["Onions","Onions and shallots, dry (excluding dehydrated)"],["Garlic","Green garlic"],["Ginger","Ginger, raw"],["Chillies","Chillies and peppers, green (Capsicum spp. and Pimenta spp.)"],["Tomatoes","Tomatoes, peeled (o/t vinegar)"],["Spices","Anise, badian, coriander, cumin, caraway, fennel and juniper berries, raw"],["Coconut","Coconuts, desiccated"]]],
["Chocolate bar",[["Cocoa beans","Cocoa beans"],["Cocoa butter","Cocoa butter, fat and oil"],["Sugar","Raw cane or beet sugar (centrifugal only)"],["Milk powder","Whole milk powder"],["Palm oil","Palm oil"]]],
["Avocado toast",[["Avocado","Avocados"],["Bread","Wheat"],["Lime","Lemons and limes"],["Chilli","Chillies and peppers, green (Capsicum spp. and Pimenta spp.)"],["Egg","Hen eggs in shell, fresh"]]],
["Summer salad",[["Lettuce","Lettuce and chicory"],["Tomatoes","Tomatoes"],["Cucumber","Cucumbers and gherkins"],["Peppers","Chillies and peppers, green (Capsicum spp. and Pimenta spp.)"],["Olive oil","Olive oil"],["Lemon","Lemons and limes"]]],
["Breakfast bowl",[["Oats","Oats, rolled"],["Banana","Bananas"],["Blueberries","Blueberries"],["Strawberries","Strawberries"],["Coffee","Coffee, green"]]]];
const RK=[["w","#2F78A8"],["dr","#C68A1E"],["c","#6F5FC7"],["d","#B23B26"]];
const GC={fru:"#D2604A",veg:"#5E9447",mt:"#9C4A3E",dai:"#D9AE4E",cer:"#B98E52",oil:"#8F9A3A",cof:"#6E4B35",drk:"#7D4F86",feed:"#7F8C82",spi:"#C56E2E",oth:"#8A8A8A"};
function stats(i){const p=P[i],t=Object.values(p.c).reduce((a,b)=>a+b,0);let w=0,dr=0,mxv=0,mk=null,tw=0;for(const k in p.c){const v=p.c[k];if(C[k]&&C[k].w>=3)w+=v;if(C[k]&&C[k].dr>=3)dr+=v;if(C[k]&&C[k].t&&C[k].t["2080bau"]!==undefined)tw+=v*C[k].t["2080bau"];if(v>mxv){mxv=v;mk=k}}
const dh=p.f?Object.values(FAM[p.f]||{}).reduce((a,b)=>a+b,0):0;const tops=Object.entries(p.c).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>[k,v/t]);
return{t,ws:w/t,ds:dr/t,cs:mxv/t,dh,tw:tw/t,fl:{w:w/t>.5,dr:dr/t>.5,c:mxv/t>.5,d:dh>500},tops,col:GC[p.g]||"#888",g:p.g}}
const tint=(c,a)=>{const h=c.replace("#",""),r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16),m=x=>Math.round(255+(x-255)*a);return"rgb("+m(r)+","+m(g)+","+m(b)+")"};
const NSs="http://www.w3.org/2000/svg",plate=document.getElementById("plate"),bt=document.getElementById("meals");
bt.innerHTML=M.map((m,i)=>'<button class="preset" data-i="'+i+'" aria-pressed="'+(i===0)+'" type="button">'+m[0]+'</button>').join("");
const arcD=(cx,cy,r,a0,a1)=>{const x0=cx+r*Math.sin(a0),y0=cy-r*Math.cos(a0),x1=cx+r*Math.sin(a1),y1=cy-r*Math.cos(a1);return"M"+x0+","+y0+"A"+r+","+r+" 0 0 1 "+x1+","+y1};
function show(mi){const [name,ings]=M[mi];bt.querySelectorAll(".preset").forEach(b=>b.setAttribute("aria-pressed",+b.dataset.i===mi));
const items=ings.filter(x=>PI[x[1]]!==undefined).map(([lab,pn])=>({lab,i:PI[pn],s:stats(PI[pn])}));
let h='<circle cx="220" cy="220" r="205" fill="#FFFFFF" stroke="var(--rule)" stroke-width="2"/><circle cx="220" cy="220" r="168" fill="none" stroke="#EEF0EE" stroke-width="1.5"/><text x="220" y="216" style="font-family:var(--serif);font-size:19px;font-weight:600" fill="#1F2E30">'+name+'</text><text x="220" y="238" style="font-size:12px" fill="#7B8889">'+ings.length+' ingredients</text>';
const n=items.length,rr=n>7?44:n>5?50:56,ring=n>1?130-(n>7?6:0):0;
items.forEach((it,j)=>{const a=j/n*Math.PI*2,cx=220+ring*Math.sin(a),cy=220-ring*Math.cos(a),nf_=Object.values(it.s.fl).filter(Boolean).length;
let segs="";RK.forEach(([k,col],q)=>{segs+='<path d="'+arcD(0,0,rr+5,q*Math.PI/2+0.12,(q+1)*Math.PI/2-0.12)+'" fill="none" stroke="'+(it.s.fl[k]?col:"#DADFDA")+'" stroke-width="5" stroke-linecap="round"/>'});
const words=it.lab.split(" "),l1=words.length>2?words.slice(0,2).join(" "):it.lab.length>11&&words.length>1?words[0]:it.lab,l2=l1===it.lab?"":it.lab.slice(l1.length+1);
h+='<g class="chip" tabindex="0" role="button" data-i="'+it.i+'" aria-label="'+it.lab+', open on the map" transform="translate('+cx+','+cy+') scale(0)" style="transition:transform .45s cubic-bezier(.3,1.4,.5,1) '+(j*70)+'ms"><circle class="cc" r="'+rr+'" fill="'+tint(it.s.col,.25+nf_*.17)+'" stroke="#FFFFFF" stroke-width="2"/>'+segs+
'<text y="'+(l2?-4:4)+'" style="font-size:'+(rr>48?13:11.5)+'px;font-weight:600" fill="'+(nf_>=3?"#FFFFFF":"#1F2E30")+'">'+l1+'</text>'+(l2?'<text y="11" style="font-size:'+(rr>48?13:11.5)+'px;font-weight:600" fill="'+(nf_>=3?"#FFFFFF":"#1F2E30")+'">'+l2+'</text>':"")+'</g>'});
plate.innerHTML=h;requestAnimationFrame(()=>requestAnimationFrame(()=>plate.querySelectorAll(".chip").forEach((g,j)=>{const a=j/n*Math.PI*2;g.setAttribute("transform","translate("+(220+ring*Math.sin(a))+","+(220-ring*Math.cos(a))+") scale(1)");g.style.transform=""})));
plate.querySelectorAll(".chip").forEach(g=>{const go=()=>{setQ(+g.dataset.i);window._jump("ex")};g.onclick=go;g.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();go()}}});
const nw=items.filter(x=>x.s.fl.w).length,nd=items.filter(x=>x.s.fl.d).length,ctry=new Set();items.forEach(x=>x.s.tops.forEach(([k,sh])=>{if(sh>=.05)ctry.add(k)}));
const tw=items.reduce((a,x)=>a+x.s.tw,0)/items.length;
document.getElementById("mname").textContent=name;
document.getElementById("msumm").innerHTML='<div><b>'+nw+' of '+items.length+'</b><span>ingredients mostly from water-stressed countries</span></div><div><b>'+ctry.size+'</b><span>countries supplying at least 5% of an ingredient</span></div><div><b>+'+tw.toFixed(1)+'°C</b><span>average warming where they\'re grown, by the 2080s, business as usual</span></div><div><b>'+nd+'</b><span>'+(nd===1?'ingredient':'ingredients')+' linked to over 500 ha of deforestation risk</span></div>';
document.getElementById("mlist").innerHTML=items.map(x=>'<div class="mitem"><b>'+x.lab+'</b><span class="chips">'+RK.map(([k,col])=>'<i style="background:'+(x.s.fl[k]?col:"var(--rule)")+'"></i>').join("")+'</span><span class="orig">'+x.s.tops.map(([k,sh])=>C[k].n+' '+Math.round(sh*100)+'%').join(", ")+'</span></div>').join("")+'<div class="legend" style="margin-top:10px"><i style="background:#2F78A8;border-radius:50%"></i>Water stress <i style="background:#C68A1E;border-radius:50%"></i>Drought <i style="background:#6F5FC7;border-radius:50%"></i>One main supplier <i style="background:#B23B26;border-radius:50%"></i>Deforestation</div><p class="note">Select an ingredient on the plate to open it on the map.</p>'}
bt.querySelectorAll(".preset").forEach(b=>b.onclick=()=>show(+b.dataset.i));
let shown=false;const startM=()=>{if(!shown){shown=true;show(0)}};
if("IntersectionObserver" in window){const io=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){startM();io.disconnect()}},{threshold:.2});io.observe(plate)}else startM()})();

(function(){const nav=document.getElementById("snav"),box=nav.querySelector(".links"),links=[...box.querySelectorAll("a[href^='#']")];
const pairs=links.map(a=>{const t=document.getElementById(a.getAttribute("href").slice(1));return t?[a,t.closest("section")||t]:null}).filter(Boolean);
function current(){const y=nav.getBoundingClientRect().bottom+12;let cur=null;pairs.forEach(([a,s])=>{if(!s.offsetParent||a.hidden)return;if(s.getBoundingClientRect().top<=y+window.innerHeight*0.25)cur=a});return cur}
let ticking=false,lastOn=null;function upd(){ticking=false;const on=current();if(on===lastOn)return;lastOn=on;links.forEach(a=>a.classList.toggle("on",a===on));
if(on){const l=on.offsetLeft,r=l+on.offsetWidth;if(l<box.scrollLeft)box.scrollLeft=l-8;else if(r>box.scrollLeft+box.clientWidth)box.scrollLeft=r-box.clientWidth+8}}
window.addEventListener("scroll",()=>{if(!ticking){ticking=true;requestAnimationFrame(upd)}},{passive:true});upd();
function jump(t){const top=t.getBoundingClientRect().top+window.scrollY-nav.offsetHeight-10;window.scrollTo({top,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})}
document.querySelectorAll("a[href^='#']").forEach(a=>{const id=a.getAttribute("href").slice(1);if(!id||id.includes("=")||a.dataset.tabgo)return;a.addEventListener("click",e=>{const t=document.getElementById(id);if(!t)return;e.preventDefault();jump(t.closest("section")||t);
if(a.dataset.play)setTimeout(()=>document.getElementById("fplay").click(),700)})});
window._jump=id=>{const t=document.getElementById(id);if(t){const tp=t.closest('.tabpanel');if(tp&&tp.hidden&&window._showTab)window._showTab(tp.dataset.tab);jump(t.closest("section")||t)}};window._navUpd=()=>{lastOn=null;upd()}})();
(function(){const tv=p=>Object.values(p.c).reduce((a,b)=>a+b,0),PI={};P.forEach((p,i)=>PI[p.n]=i);
function topOf(n){const p=P[PI[n]],t=tv(p),e=Object.entries(p.c).sort((a,b)=>b[1]-a[1]);return{k:e[0][0],sh:e[0][1]/t}}
const T=isos().reduce((a,k)=>a+((GV[k]&&GV[k].all)||0),0),W=isos().reduce((a,k)=>a+(C[k].w>=3?((GV[k]&&GV[k].all)||0):0),0);
const L=topOf("Lettuce and chicory"),Cb=topOf("Cocoa beans"),Av=topOf("Avocados");const dTop=FD.dcom[0];
const Q=[
{q:"Where does most of the UK's imported lettuce come from?",o:["Netherlands","Spain","Italy","Morocco"],a:C[L.k].n,x:C[L.k].n+" supplies "+Math.round(L.sh*100)+"% of the UK's imported lettuce and chicory, from farmland with extremely high water stress.",go:{q:"Lettuce and chicory",lens:"w"}},
{q:"What share of the UK's food imports comes from water-stressed countries?",o:["16%","36%","56%","76%"],a:Math.round(W/T*100)+"%",x:"About "+Math.round(W/T*100)+"% by value, or roughly $"+Math.round(W/1e6)+" billion a year. For fruit and nuts it's two-thirds.",go:{q:null,lens:"w"}},
{q:"Which UK food import carries the most deforestation risk?",o:["Beef","Cocoa","Soy","Palm oil"],a:dTop[0].startsWith("Cocoa")?"Cocoa":dTop[0],x:"Cocoa beans carry about "+nf.format(dTop[1])+" hectares of deforestation risk in UK imports, more than Brazilian beef. Most comes from Côte d'Ivoire and Ghana.",go:{q:"Cocoa beans",lens:"d"}},
{q:"Which country supplies most of the UK's cocoa beans?",o:["Ghana","Côte d'Ivoire","Ecuador","Nigeria"],a:C[Cb.k].n,x:C[Cb.k].n+" supplies "+Math.round(Cb.sh*100)+"% of UK cocoa bean imports. One country, one crop, three risks.",go:{q:"Cocoa beans",lens:"dr"}},
{q:"Where do most of the UK's avocados come from?",o:["Mexico","Spain","Peru","Kenya"],a:C[Av.k].n,x:C[Av.k].n+" is the biggest supplier, at "+Math.round(Av.sh*100)+"%. Overall, 83% of UK avocado imports come from water-stressed countries.",go:{q:"Avocados",lens:"w"}}];
Q.forEach(x=>{if(!x.o.includes(x.a))x.o[0]=x.a});
let i=0,score=0;const B=document.getElementById("qbody"),PR=document.getElementById("qprog");
function goMap(g){st.lens=g.lens;document.getElementById("lens").value=g.lens;setQ(g.q?PI[g.q]:null);window._jump("ex")}
function ask(){if(i>=Q.length)return done();const x=Q[i];PR.textContent="Question "+(i+1)+" of "+Q.length;
B.innerHTML='<p class="qq">'+x.q+'</p><div class="qopts">'+x.o.map(o=>'<button class="qopt" type="button">'+o+'</button>').join("")+'</div><div id="qafter"></div>';
B.querySelectorAll(".qopt").forEach(btn=>btn.onclick=()=>{const ok=btn.textContent===x.a;if(ok)score++;B.querySelectorAll(".qopt").forEach(b=>{b.disabled=true;if(b.textContent===x.a)b.classList.add("right");else if(b===btn)b.classList.add("wrong")});
document.getElementById("qafter").innerHTML='<p class="qexp"><b>'+(ok?"Right.":"Not quite.")+'</b> '+x.x+'</p><div class="qnav"><button class="primary" type="button" id="qn">'+(i===Q.length-1?"See my score":"Next question")+'</button><button type="button" id="qm">See it on the map</button></div>';
document.getElementById("qn").onclick=()=>{i++;ask()};document.getElementById("qm").onclick=()=>goMap(x.go)})}
function done(){PR.textContent="";const msg=score===5?"Top marks.":score>=3?"Not bad at all.":"Most people are surprised too.";
B.innerHTML='<p class="qscore">'+score+' out of '+Q.length+'</p><p class="qexp">'+msg+' Share it and see how your network does.</p><div class="qnav"><button class="primary" type="button" id="qcopy">Copy a share message</button><button type="button" id="qagain">Try again</button></div>';
document.getElementById("qagain").onclick=()=>{i=0;score=0;ask()};
document.getElementById("qcopy").onclick=async e=>{const t="I scored "+score+" out of "+Q.length+" on Greener Edge's quiz about where the UK's food comes from, and the climate risks it faces. Try it: "+location.href.split("#")[0];
try{await navigator.clipboard.writeText(t);e.target.textContent="Copied"}catch(err){e.target.textContent="Couldn't copy here"}}}
ask()})();
(function(){function dl(name,rows){const esc=v=>{v=v==null?"":String(v);return/[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};const csv=rows.map(r=>r.map(esc).join(",")).join("\n");
const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
const lab=(arr,v)=>v==null?"":arr[v];
document.getElementById("csvview").onclick=()=>{const key=(st.yr==="now"?"2050":st.yr)+st.sc,fk=fy()+fs(),what=st.q!==null?P[st.q].n:(st.g==="all"?"All food":GN[st.g]),T=total();
const rows=[["Selection","Country","ISO3","UK imports 2024 (US$ thousand)","Share of UK imports (%)","Water stress today","Water stress "+futLabel(),"Drought risk","River flood risk (population-weighted)","Projected warming "+twLabel()+" (°C)","Deforestation risk in UK imports "+FD.dyrs[st.dy]+" (ha)"]];
isos().map(k=>[k,sv(k)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>{const c=C[k];rows.push([what,c.n,k,Math.round(v),(v/T*100).toFixed(2),lab(LAB.w,c.w),lab(LAB.w,wcat(c,fy(),fs())),lab(LAB.dr,c.dr),lab(LAB.fl,c.fl),c.t&&c.t[key]!==undefined?c.t[key]:"",FD.dyr[k]?FD.dyr[k][st.dy]:0])});
rows.push([]);rows.push(["Sources: FAOSTAT Detailed Trade Matrix 2024; WRI Aqueduct 4.0 (CC BY 4.0); World Bank CCKP CMIP6 (ODbL); Singh et al. 2026 v2.1 (CC BY). Compiled by Greener Edge Sustainability."]);
dl("greener-edge-food-risk-"+what.toLowerCase().replace(/[^a-z0-9]+/g,"-")+".csv",rows)};
document.getElementById("csvall").onclick=()=>{const rows=[["Food","Food group","Country","ISO3","UK imports 2024 (US$ thousand)","Water stress today","Drought risk","Warming 2050s business as usual (°C)"]];
P.forEach(p=>Object.entries(p.c).forEach(([k,v])=>{const c=C[k]||{};rows.push([p.n,GN[p.g]||"",c.n||k,k,Math.round(v),lab(LAB.w,c.w),lab(LAB.dr,c.dr),c.t&&c.t["2050bau"]!==undefined?c.t["2050bau"]:""])}));
rows.push([]);rows.push(["Sources: FAOSTAT Detailed Trade Matrix 2024; WRI Aqueduct 4.0 (CC BY 4.0); World Bank CCKP CMIP6 (ODbL). Compiled by Greener Edge Sustainability. Non-food items removed; see the Methods page."]);
dl("greener-edge-uk-food-imports-2024.csv",rows)}})();

(function(){const tabs=[...document.querySelectorAll('.tabs [role="tab"]')],panels=[...document.querySelectorAll('.tabpanel')],navl=[...document.querySelectorAll('#snav .links a[data-t]')];
function showTab(t,push){window._tab=t;tabs.forEach(b=>b.setAttribute("aria-selected",b.dataset.tab===t));panels.forEach(p=>p.hidden=p.dataset.tab!==t);navl.forEach(a=>a.hidden=a.dataset.t!==t);
if(typeof writeHash==="function")writeHash();if(window._navUpd)window._navUpd();window.dispatchEvent(new Event("resize"))}
window._showTab=showTab;
tabs.forEach(b=>b.onclick=()=>{showTab(b.dataset.tab);const tp=document.getElementById("tp-"+b.dataset.tab);const top=tp.getBoundingClientRect().top+window.scrollY-70;if(window.scrollY>top)window.scrollTo({top})});
tabs.forEach((b,i)=>b.addEventListener("keydown",e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){const j=(i+(e.key==="ArrowRight"?1:tabs.length-1))%tabs.length;tabs[j].focus();tabs[j].click()}}));
document.querySelectorAll("[data-tabgo]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();showTab(a.dataset.tabgo);if(a.dataset.q&&typeof PI!=="undefined"){}const q=a.dataset.q;if(q){const i=P.findIndex(p=>p.n===q);if(i>=0)setQ(i)}window._jump("ex")}));
const t0=new URLSearchParams(_initHash.slice(1)).get("tab");showTab(["imports","grown","wales"].includes(t0)?t0:"imports")})();
(function(){if(typeof FB==="undefined")return;const R=FB.rows,NS="http://www.w3.org/2000/svg",GCOL={fru:"#D2604A",veg:"#5E9447",mt:"#9C4A3E",dai:"#D9AE4E",cer:"#B98E52",oil:"#8F9A3A",cof:"#6E4B35",drk:"#7D4F86",spi:"#C56E2E",fish:"#3E7C9A",oth:"#8A8A8A"};
const GNm=Object.assign({},GN,{fish:"Fish and seafood"});
document.querySelectorAll(".fbyrs").forEach(e=>e.textContent=FB.years[0]+" to "+FB.years[FB.years.length-1]);
const by=n=>R.find(r=>r.n===n),pc=v=>Math.round(v*100)+"%";
const F=[["Tomatoes","of the tomatoes it eats"],["Apples","of its apples"],["Wheat","of its wheat"],["Lamb and mutton","of the lamb it eats, so it exports the rest"]].map(([n,t])=>{const r=by(n);return r?'<div class="fact"><b>'+pc(r.ss)+'</b><span>'+t+'</span></div>':""}).join("");
document.getElementById("gfacts").innerHTML=F;
// scatter
const svg=document.getElementById("gscatter"),W=960,H=560,m={l:70,r:30,t:30,b:60},xmax=1.3,X=v=>m.l+Math.min(v,xmax)/xmax*(W-m.l-m.r),Y=v=>H-m.b-v*(H-m.t-m.b);
const pts=R.filter(r=>r.ws!=null&&r.ss!=null&&r.g!=="fish"),mxd=Math.max(...pts.map(r=>r.dom)),rad=d=>4+26*Math.sqrt(d/mxd);
let h='<rect x="'+m.l+'" y="'+m.t+'" width="'+(X(.5)-m.l)+'" height="'+(Y(.5)-m.t)+'" fill="#B23B26" opacity=".06" rx="6"/>';
[0,.25,.5,.75,1].forEach(v=>{h+='<line x1="'+m.l+'" x2="'+(W-m.r)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="var(--rule)"'+(v===.5?'':' stroke-dasharray="2 5"')+'/><text x="'+(m.l-10)+'" y="'+(Y(v)+4)+'" text-anchor="end" font-size="12" fill="var(--ink3)">'+pc(v)+'</text>'});
[0,.25,.5,.75,1,1.25].forEach(v=>{h+='<line x1="'+X(v)+'" x2="'+X(v)+'" y1="'+m.t+'" y2="'+(H-m.b)+'" stroke="'+(v===1?"var(--ink3)":"var(--rule)")+'"'+(v===1?' stroke-width="1.5"':' stroke-dasharray="2 5"')+'/><text x="'+X(v)+'" y="'+(H-m.b+20)+'" text-anchor="middle" font-size="12" fill="var(--ink3)">'+(v>=1.25?"125%+":pc(v))+'</text>'});
h+='<text x="'+(X(1)+6)+'" y="'+(m.t+14)+'" font-size="12" fill="var(--ink3)">Grows all it uses</text>';
h+='<text x="'+((m.l+W-m.r)/2)+'" y="'+(H-14)+'" text-anchor="middle" font-size="12.5" fill="var(--ink2)">How much the UK grows of what it uses →</text><text transform="translate(18,'+((m.t+H-m.b)/2)+') rotate(-90)" text-anchor="middle" font-size="12.5" fill="var(--ink2)">Imports from water-stressed countries →</text>';
h+='<text x="'+X(.3)+'" y="'+(m.t+20)+'" text-anchor="middle" font-family="var(--serif)" font-size="15" font-weight="600" fill="var(--ink2)">Mostly imported, from stressed places</text>';
pts.slice().sort((a,b)=>b.dom-a.dom).forEach(r=>{const x=X(r.ss),y=Y(r.ws),rr=rad(r.dom);h+='<g class="gd" data-n="'+r.n+'" tabindex="0" role="img" aria-label="'+r.n+': UK grows '+pc(r.ss)+', '+pc(r.ws)+' of imports from water-stressed countries"><circle cx="'+x+'" cy="'+y+'" r="'+rr+'" fill="'+(GCOL[r.g]||"#888")+'" fill-opacity=".7" stroke="#fff" stroke-width="1.5"/></g>'});
const lab=pts.filter(r=>r.dom>600||(r.ss<.35&&r.ws>.55)||r.ss>1.05);const placed=[];
lab.forEach(r=>{const x=X(r.ss),y=Y(r.ws),rr=rad(r.dom);let ly=y+4,lx=x+rr+5,anc="start";if(lx>W-150){lx=x-rr-5;anc="end"}while(placed.some(p=>Math.abs(p[1]-ly)<13&&Math.abs(p[0]-lx)<110))ly+=13;placed.push([lx,ly]);
h+='<text x="'+lx+'" y="'+ly+'" text-anchor="'+anc+'" font-size="12" font-weight="600" fill="#1C2B2D" paint-order="stroke" stroke="#FFFFFF" stroke-width="3" pointer-events="none">'+r.n+'</text>'});
svg.innerHTML=h;const tip=document.getElementById("gtip"),wrap=svg.parentNode;
svg.querySelectorAll(".gd").forEach(g=>{const r=R.find(x=>x.n===g.dataset.n);g.addEventListener("mousemove",e=>{const b=wrap.getBoundingClientRect();tip.style.left=(e.clientX-b.left+wrap.scrollLeft)+"px";tip.style.top=(e.clientY-b.top)+"px";tip.style.display="block";tip.style.whiteSpace="normal";tip.style.maxWidth="260px";
tip.innerHTML="<b>"+r.n+"</b><br>UK grows "+pc(r.ss)+" of what it uses<br>Uses "+nf.format(r.dom)+" thousand tonnes a year<br>Imports from water-stressed countries: "+pc(r.ws)});g.addEventListener("mouseleave",()=>tip.style.display="none")});
document.getElementById("glegend").innerHTML='Bubble size shows how much the UK uses. Fish is left off this chart, as its import origins aren\'t in the trade data. '+[...new Set(pts.map(r=>r.g))].map(g=>'<i style="background:'+GCOL[g]+';border-radius:50%"></i>'+GNm[g]).join(" ");
// bars
const gs=document.getElementById("ggrp");[["all","All foods"]].concat([...new Set(R.map(r=>r.g))].map(g=>[g,GNm[g]||g])).forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;gs.appendChild(o)});
function bars(){const so=document.getElementById("gsort").value,gr=gs.value;let rows=R.filter(r=>r.ss!=null&&(gr==="all"||r.g===gr));
rows.sort(so==="dom"?(a,b)=>b.dom-a.dom:so==="lo"?(a,b)=>a.ss-b.ss:so==="hi"?(a,b)=>b.ss-a.ss:(a,b)=>(b.ws??-1)-(a.ws??-1));
const B=document.getElementById("gbars"),scale=1.3;
B.innerHTML=rows.map(r=>{const w=Math.min(r.ss,scale)/scale*100;return'<div class="gbar"><span>'+r.n+'<small>'+nf.format(r.dom)+' thousand tonnes used'+(r.ws!=null?", "+pc(r.ws)+" of imports from water-stressed countries":"")+'</small></span><div class="tr"><i style="width:0%;background:'+(GCOL[r.g]||"#888")+'"></i><span class="hund" style="left:'+(1/scale*100)+'%"></span></div><b>'+(r.ss>1?pc(r.ss)+", net exporter":pc(r.ss))+'</b></div>'}).join("");
requestAnimationFrame(()=>requestAnimationFrame(()=>B.querySelectorAll(".tr i").forEach((e,j)=>e.style.width=(Math.min(rows[j].ss,scale)/scale*100)+"%")))}
document.getElementById("gsort").onchange=bars;gs.onchange=bars;bars()})();
(function(){
const nf=new Intl.NumberFormat("en-GB"),reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
(function(){const lu=A.lu,T=lu["TOTAL AREA ON FARMS"];
const grass=lu["Grassland under 5 years old"]+lu["Grassland over 5 years old"]+lu["Sole-rights rough grazing"];
const hort=lu["Vegetables & Salad grown in the open"]+lu["Commercial orchards"]+lu["Other orchards & small fruit"]+lu["Glasshouse"];
const arable=["Wheat","Winter barley","Spring barley","Other cereals for combining","Potatoes","Maize","Crops for stockfeeding","Oil seed rape (winter & spring)","Other crops","Bare fallow"].reduce((a,k)=>a+lu[k],0);
const wood=lu["Woodland"];
const cats=[["Grass and grazing",grass,"#7FA35B"],["Arable crops",arable,"#D9A55B"],["Farm woodland",wood,"#2F5D3A"],["Fruit, vegetables and glasshouses",hort,"#B8453A"],["Other land",T-grass-arable-wood-hort,"#B8B4A8"]];
let n=cats.map(c=>c[1]/T*1000),r=n.map(Math.floor);r[3]=Math.max(1,r[3]);let left=1000-r.reduce((a,b)=>a+b,0);
const order=n.map((v,i)=>[v-Math.floor(v),i]).sort((a,b)=>b[0]-a[0]);for(let j=0;left>0;j++){const i=order[j%order.length][1];if(i!==3){r[i]++;left--}}
const W=document.getElementById("waffle");let cells=[];r.forEach((k,i)=>{for(let j=0;j<k;j++)cells.push(i)});
const seq=[];for(let i=0;i<1000;i++){const e=document.createElement("i");W.appendChild(e);seq.push(e)}
const hortIdx=cells.indexOf(3);
document.getElementById("wkeys").innerHTML=cats.map(c=>'<span style="--c:'+c[2]+'">'+c[0]+': '+(c[1]/T*100<1?(c[1]/T*100).toFixed(2):Math.round(c[1]/T*100))+'% ('+nf.format(Math.round(c[1]))+' ha)</span>').join("");
function fill(){seq.forEach((e,i)=>{const c=cells[i];const go=()=>{e.style.background=cats[c][2];if(i===hortIdx)e.classList.add("hort")};if(reduce)go();else setTimeout(go,Math.floor(i/50)*45+(i%50)*3)})}
if("IntersectionObserver" in window){const io=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){fill();io.disconnect()}},{threshold:.25});io.observe(W)}else fill()})();
(function(){const Y=A.yrs,S={sheep:A.ls.sheep,cattle:A.ls.cattle,pigs:A.ls.pigs,poultry:A.ls.poultry,arable:A.land.arable};
const L={sheep:"sheep and lambs",cattle:"cattle and calves",pigs:"pigs",poultry:"poultry",arable:"hectares of arable crops"};
const COL={sheep:"#5B7F3A",cattle:"#7E3A1E",pigs:"#B08FA8",poultry:"#D9A55B",arable:"#B86B2E"};
const ANN={sheep:[[1999,"1999: peak of 11.8 million"],[2001,"2001: foot-and-mouth"]],arable:[[1943,"1943: wartime ploughing peak"]],poultry:[[2025,"2025: a record 12.1 million"]],pigs:[[1867,"1867: 250,000 pigs"]],cattle:[[1974,"1970s: cattle peak"]]};
let m="sheep",yi=Y.length-1,timer=null;const svg=document.getElementById("hist"),W=760,H=280,pl=64,pr=16,pt=18,pb=26;
const sx=i=>pl+i*(W-pl-pr)/(Y.length-1);
function fmtBig(v){return v>=1e6?(v/1e6).toFixed(1)+" million":nf.format(v)}
function render(){const s=S[m],vals=s.filter(v=>v!=null),mx=Math.max(...vals),step=Math.pow(10,Math.floor(Math.log10(mx))),top=Math.ceil(mx/step)*step,sy=v=>pt+(top-v)/top*(H-pt-pb);
let h="";for(let g=0;g<=top;g+=top/4)h+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+sy(g)+'" y2="'+sy(g)+'" stroke="var(--rule)"/><text x="'+(pl-8)+'" y="'+(sy(g)+4)+'" text-anchor="end">'+(g>=1e6?(g/1e6)+"m":g>=1e3?nf.format(g/1e3)+"k":g)+'</text>';
[1867,1900,1925,1950,1975,2000,2025].forEach(y=>{const i=Y.indexOf(y);if(i>=0)h+='<text x="'+sx(i)+'" y="'+(H-6)+'" text-anchor="middle">'+y+'</text>'});
let d="",pen=false;for(let i=0;i<=yi;i++){const v=s[i];if(v==null){pen=false;continue}d+=(pen?"L":"M")+sx(i).toFixed(1)+","+sy(v).toFixed(1);pen=true}
let full="";pen=false;for(let i=0;i<Y.length;i++){const v=s[i];if(v==null){pen=false;continue}full+=(pen?"L":"M")+sx(i).toFixed(1)+","+sy(v).toFixed(1);pen=true}
h+='<path d="'+full+'" fill="none" stroke="var(--rule)" stroke-width="2"/><path d="'+d+'" fill="none" stroke="'+COL[m]+'" stroke-width="2.6"/>';
(ANN[m]||[]).forEach(([y,t],k)=>{const i=Y.indexOf(y);if(i<0||i>yi||s[i]==null)return;const x=sx(i),yy=sy(s[i]);const anchor=i>Y.length*0.75?"end":"start";const dy=k%2?18:-8;h+='<circle cx="'+x+'" cy="'+yy+'" r="3.5" fill="'+COL[m]+'"/><text class="ann" x="'+(x+(anchor==="end"?-6:6))+'" y="'+(yy+dy)+'" text-anchor="'+anchor+'">'+t+'</text>'});
let ci=yi;while(ci>0&&s[ci]==null)ci--;if(s[ci]!=null)h+='<line x1="'+sx(yi)+'" x2="'+sx(yi)+'" y1="'+pt+'" y2="'+(H-pb)+'" stroke="var(--ink3)" stroke-dasharray="3 3"/><circle cx="'+sx(ci)+'" cy="'+sy(s[ci])+'" r="5" fill="'+COL[m]+'" stroke="var(--paper)" stroke-width="2"/>';
svg.innerHTML=h;document.getElementById("hyout").textContent=Y[yi];
const v=s[yi];document.getElementById("hval").textContent=v==null?"No figure":fmtBig(v);
document.getElementById("hmeta").textContent=L[m]+" in Wales, "+Y[yi]+(v!=null&&s[0]!=null&&yi>0?". "+(v>s[0]?"Up":"Down")+" "+Math.round(Math.abs(v/s[0]-1)*100)+"% on 1867.":".")}
document.querySelectorAll("#metric button").forEach(b=>b.onclick=()=>{m=b.dataset.m;document.querySelectorAll("#metric button").forEach(x=>x.setAttribute("aria-pressed",x===b));render()});
const sl=document.getElementById("hyear");sl.oninput=()=>{yi=+sl.value;render()};
const pb_=document.getElementById("hplay");pb_.onclick=()=>{if(timer){clearInterval(timer);timer=null;pb_.textContent="Play";return}
if(yi>=Y.length-1)yi=0;pb_.textContent="Pause";timer=setInterval(()=>{yi++;sl.value=yi;render();if(yi>=Y.length-1){clearInterval(timer);timer=null;pb_.textContent="Play"}},reduce?0:45)};
render()})();

})();
