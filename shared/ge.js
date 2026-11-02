/* Greener Edge open data: shared behaviour. Sticky section menu (highlight and smooth jumps) and small helpers. */
window.GE=(function(){
const reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function navEl(){return document.getElementById("snav")}
function target(t){return t.closest("section")||t}
function jumpTo(el){const nav=navEl(),off=nav?nav.offsetHeight+10:10;const top=el.getBoundingClientRect().top+window.scrollY-off;window.scrollTo({top,behavior:reduce?"auto":"smooth"});
/* charts further down can finish drawing during the scroll and shift the target; correct once it settles */
[700,1300].forEach(ms=>setTimeout(()=>{const d=el.getBoundingClientRect().top-off;const max=document.documentElement.scrollHeight-window.innerHeight;if(Math.abs(d)>4&&!(d>0&&window.scrollY>=max-2))window.scrollTo({top:window.scrollY+d,behavior:"auto"})},ms))}
function jump(id){const t=document.getElementById(id);if(t)jumpTo(target(t))}
function initNav(){const nav=navEl();if(!nav)return;const box=nav.querySelector(".links"),links=[...box.querySelectorAll("a[href^='#']")];
const pairs=links.map(a=>{const t=document.getElementById(a.getAttribute("href").slice(1));return t?[a,target(t)]:null}).filter(Boolean);
let ticking=false,lastOn=null;
function current(){if(window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4){const vis=pairs.filter(([a,s])=>s.offsetParent);if(vis.length)return vis[vis.length-1][0]}const y=nav.getBoundingClientRect().bottom+12;let cur=null;pairs.forEach(([a,s])=>{if(!s.offsetParent)return;if(s.getBoundingClientRect().top<=y+window.innerHeight*.25)cur=a});return cur}
function upd(){ticking=false;const on=current();if(on===lastOn)return;lastOn=on;links.forEach(a=>a.classList.toggle("on",a===on));
if(on){const l=on.offsetLeft,r=l+on.offsetWidth;if(l<box.scrollLeft)box.scrollLeft=l-8;else if(r>box.scrollLeft+box.clientWidth)box.scrollLeft=r-box.clientWidth+8}}
window.addEventListener("scroll",()=>{if(!ticking){ticking=true;requestAnimationFrame(upd)}},{passive:true});upd();
document.querySelectorAll("a[href^='#']").forEach(a=>{const id=a.getAttribute("href").slice(1);if(!id||id.includes("=")||a.dataset.go)return;
a.addEventListener("click",e=>{const t=document.getElementById(id);if(!t)return;e.preventDefault();jumpTo(target(t))})})}
/* Curved supply line from a point to the UK, as used on the food map and the checker */
function arc(p,uk){const dx=uk[0]-p.x,dy=uk[1]-p.y,dist=Math.hypot(dx,dy);return{d:"M"+p.x+","+p.y+" Q"+((p.x+uk[0])/2-dy*.22)+","+((p.y+uk[1])/2+dx*.22-dist*.12)+" "+uk[0]+","+uk[1],dist}}
function initTop(){const c=document.querySelector('.geswitch [aria-current="page"]');if(c){const sw=c.parentNode;sw.scrollLeft=Math.max(0,c.offsetLeft-sw.clientWidth/2+c.offsetWidth/2)}}
function init(){initNav();initTop()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
return{jump,jumpTo,arc,reduce,nf:new Intl.NumberFormat("en-GB")};
})();
