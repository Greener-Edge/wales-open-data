/* what-wales-grows page. Data globals: A (loaded by load.js). */
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
