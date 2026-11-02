/* Greener Edge open data: shared Wales council map (used by Wales emissions and Commercial EPC).
   GEWales.draw({map, tip, G, names, tipText, onSelect, pick}) draws the 22 councils into the SVG,
   wires hover tips, click and keyboard selection, adds labels, fills the "Find a council" list,
   and returns {pathEl} keyed by council code. Colours are set by each site. */
window.GEWales=(function(){
const NS="http://www.w3.org/2000/svg",LBL=["ANG","GWY","CNW","DEN","FLN","WRX","CER","POW","PEM","CMN","SWA","NPT","RCT","MON","BGE","VGL","CRF","NWP"];
function draw(o){const map=o.map,tip=o.tip,G=o.G,pathEl={};map.setAttribute("viewBox","0 0 "+G.w+" "+G.h);
for(const c in G.p){const p=document.createElementNS(NS,"path");p.setAttribute("d",G.p[c].d);p.setAttribute("tabindex","0");p.setAttribute("role","button");p.dataset.c=c;
p.addEventListener("click",()=>o.onSelect(c));p.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();o.onSelect(c)}});
p.addEventListener("mousemove",e=>{const r=map.parentNode.getBoundingClientRect();tip.style.left=(e.clientX-r.left)+"px";tip.style.top=(e.clientY-r.top)+"px";tip.textContent=o.tipText(c);tip.style.display="block"});
p.addEventListener("mouseleave",()=>tip.style.display="none");map.appendChild(p);pathEl[c]=p}
LBL.forEach(c=>{const t=document.createElementNS(NS,"text");t.setAttribute("x",G.p[c].cx);t.setAttribute("y",G.p[c].cy);t.setAttribute("text-anchor","middle");t.setAttribute("dominant-baseline","middle");t.textContent=c;map.appendChild(t)});
if(o.pick){Object.keys(o.names).sort((a,b)=>o.names[a].localeCompare(o.names[b])).forEach(c=>{const op=document.createElement("option");op.value=c;op.textContent=o.names[c];o.pick.appendChild(op)});o.pick.onchange=()=>o.onSelect(o.pick.value)}
return{pathEl}}
return{draw};
})();
