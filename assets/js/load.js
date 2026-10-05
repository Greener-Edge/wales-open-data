/* Loads a page's data files, then its script. Data become globals named by the keys of the map. */
(function(){
function addScript(src){return new Promise(function(res,rej){var s=document.createElement("script");s.src=src;s.onload=res;s.onerror=function(){rej(new Error("Could not load "+src))};document.body.appendChild(s)})}
window.runPage=function(data,script){
  Promise.all(Object.keys(data).map(function(k){return fetch(data[k]).then(function(r){if(!r.ok)throw new Error("Could not load "+data[k]);return r.json()}).then(function(j){window[k]=j})}))
  .then(function(){return addScript(script)})
  .catch(function(e){var p=document.createElement("p");p.className="note";p.style.padding="16px 20px";p.textContent="Sorry, part of this page couldn't load. Please refresh, or try again later. ("+e.message+")";document.querySelector("main").prepend(p);console.error(e)});
};
})();
