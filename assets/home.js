(function(){
"use strict";
const VAL={a:1,e:1,i:1,o:1,u:1,l:1,n:1,s:1,t:1,r:1,d:2,g:2,b:3,c:3,m:3,p:3,f:4,h:4,v:4,w:4,y:4,k:5,j:8,x:8,q:10,z:10};
const WWF={a:1,b:4,c:4,d:2,e:1,f:4,g:3,h:3,i:1,j:10,k:5,l:2,m:4,n:2,o:1,p:4,q:10,r:1,s:1,t:1,u:2,v:5,w:4,x:8,y:3,z:10};
let V=VAL;
let BAD=new Set(), W_ENA=[], loaded=false;
const PAGE=40;
const $=id=>document.getElementById(id);
const out=$("out");
let results=[], shown={}, rackText="";

function parseRack(s){
  const c=new Array(26).fill(0);let blanks=0,n=0;
  for(const ch of s.toLowerCase()){
    if(ch==="?"||ch==="*"||ch==="_"){blanks++;n++}
    else if(ch>="a"&&ch<="z"){c[ch.charCodeAt(0)-97]++;n++}
  }
  return {c,blanks,n};
}
// Returns tile list [{ch,blank}] if word can be made from rack, else null.
function make(word,rack){
  const c=rack.c.slice();let b=rack.blanks;const tiles=[];
  for(let i=0;i<word.length;i++){
    const k=word.charCodeAt(i)-97;
    if(c[k]>0){c[k]--;tiles.push(0)}
    else if(b>0){b--;tiles.push(1)}
    else return null;
  }
  return tiles;
}
function score(word,tiles,T){T=T||V;let s=0;for(let i=0;i<word.length;i++)if(!tiles[i])s+=T[word[i]];return s}
function opts(){
  const clean=v=>v.toLowerCase().replace(/[^a-z]/g,"");
  return {len:parseInt($("o-len").value,10)||0,starts:clean($("o-starts").value),ends:clean($("o-ends").value),has:clean($("o-has").value)};
}

function solve(text){
  const WORDS=W_ENA;
  const rack=parseRack(text), o=opts(), res=[];
  const safe=$("o-safe").checked;
  const anyMode=rack.n<2&&(o.len||o.starts||o.ends||o.has);
  if(rack.n<2&&!anyMode)return {rack,res};
  if(!anyMode){
    const need=new Array(26).fill(0),cnt=s=>{const a=new Array(26).fill(0);for(const ch of s)a[ch.charCodeAt(0)-97]++;return a};
    const se=cnt(o.starts+o.ends),hs=cnt(o.has);
    for(let k=0;k<26;k++)need[k]=Math.max(se[k],hs[k]);
    for(let k=0;k<26;k++){const add=Math.max(0,need[k]-rack.c[k]);rack.c[k]+=add;rack.n+=add}
  }
  for(const w of WORDS){
    const L=w.length;
    if(!anyMode&&(L>rack.n||L<2))continue;
    if(o.len&&L!==o.len)continue;
    if(o.starts&&!w.startsWith(o.starts))continue;
    if(o.ends&&!w.endsWith(o.ends))continue;
    if(o.has&&!w.includes(o.has))continue;
    if(safe&&BAD.has(w))continue;
    const t=anyMode?new Array(L).fill(0):make(w,rack);
    if(t)res.push({w,t,s:score(w,t),f:score(w,t,WWF)});
  }
  res.sort((a,b)=>b.w.length-a.w.length||b.s-a.s||(a.w<b.w?-1:1));
  return {rack,res};
}

function hlSet(w,o){
  const s=new Set();
  const add=(a,n)=>{for(let i=a;i<a+n;i++)s.add(i)};
  if(o.starts&&w.startsWith(o.starts))add(0,o.starts.length);
  if(o.ends&&w.endsWith(o.ends))add(w.length-o.ends.length,o.ends.length);
  if(o.has){const k=w.indexOf(o.has);if(k>=0)add(k,o.has.length)}
  return s;
}
function tileHTML(r,o){
  const hl=hlSet(r.w,o);
  let h='<div class="tiles" style="--n:'+r.w.length+'" aria-hidden="true">';
  for(let i=0;i<r.w.length;i++){
    const ch=r.w[i],bl=r.t[i];
    h+='<span class="t'+(bl||hl.has(i)?" blank":"")+'">'+ch+(bl?"":"<sub"+(V[ch]>9?' class="s2"':"")+">"+V[ch]+"</sub>"+(WWF[ch]!==V[ch]?"<sup"+(WWF[ch]>9?' class="s2"':"")+">"+WWF[ch]+"</sup>":""))+"</span>";
  }
  return h+"</div>";
}

function render(){
  const total=results.length;
  const shownRack=rackText.trim().toUpperCase();
  if(!total){
    const nf=activeFilters();
    out.innerHTML='<p class="empty">'+(parseRack(rackText).n<2&&!nf?"Type your letters in the box above, then press GO.":(nf?"No words match your "+nf+" active filter"+(nf>1?"s":"")+". Press Clear to remove them.":"No words found. Try a ? wildcard."))+"</p>";
    return;
  }
  const fo=opts();
  const groups=new Map();
  for(const r of results){const L=r.w.length;if(!groups.has(L))groups.set(L,[]);groups.get(L).push(r)}
  let h='<p class="summary"><strong>'+total.toLocaleString()+" word"+(total===1?"":"s")+"</strong><span>"+(parseRack(rackText).n<2?"matching your filters":"from "+shownRack.replace(/[^A-Z?*_]/g,"").replace(/[*_]/g,"?"))+"</span></p>";
  h+='<p class="key"><span class="k-s">Black = Scrabble score</span><span class="k-w">Blue = Words With Friends score</span></p>';
  for(const [L,list] of groups){
    const n=shown[L]||PAGE, part=list.slice(0,n);
    const best=list[0].s;
    h+='<section class="group"><div class="gh"><span>'+L+" letters</span><em>"+list.length.toLocaleString()+" word"+(list.length===1?"":"s")+" \u00b7 top score "+best+'</em></div><ul class="words">';
    for(const r of part)h+='<li class="w" aria-label="'+r.w+', '+r.s+' points in Scrabble, '+r.f+' in Words With Friends">'+tileHTML(r,fo)+'<span class="pts">'+r.s+"</span>"+(r.f!==r.s?'<span class="pts wwf">'+r.f+"</span>":"")+"</li>";
    h+="</ul>";
    if(list.length>n)h+='<button class="more" type="button" data-len="'+L+'">Show '+Math.min(PAGE,list.length-n)+" more</button>";
    h+="</section>";
  }
  out.innerHTML=h;
}

function activeFilters(){const o=opts();return (o.len?1:0)+(o.starts?1:0)+(o.ends?1:0)+(o.has?1:0)}
function syncNf(){}
function run(){
  if(!loaded){out.innerHTML='<p class="empty">Loading word list...</p>';return}
  syncNf();
  rackText=$("rack").value;
  shown={};
  results=solve(rackText).res;
  render();
}

function saveQ(){try{const v=$("rack").value.trim(),u=new URL(location.href);if(v)u.searchParams.set("q",v);else u.searchParams.delete("q");history.replaceState(null,"",u.pathname+u.search+u.hash)}catch(_){}}
$("f").addEventListener("submit",e=>{e.preventDefault();run();saveQ();if(!results.length&&parseRack(rackText).n<2)$("rack").focus();else $("rack").blur()});
out.addEventListener("click",e=>{
  const li=e.target.closest(".w");
  if(li&&!e.target.closest(".look")){
    clearTimeout(window._lk);
    const had=li.querySelector(".look");
    out.querySelectorAll(".look").forEach(x=>x.remove());out.querySelectorAll(".w.open").forEach(x=>x.classList.remove("open"));
    if(!had){
      const w=li.getAttribute("aria-label").split(",")[0].toLowerCase(),q=encodeURIComponent(w);
      const L=[["Merriam-Webster","https://www.merriam-webster.com/dictionary/"+q],["Dictionary.com","https://www.dictionary.com/browse/"+q],["Collins","https://www.collinsdictionary.com/dictionary/english/"+q],["Wiktionary","https://en.wiktionary.org/wiki/"+q],["Google","https://www.google.com/search?q=define+"+q]];
      const d=document.createElement("div");d.className="look";
      d.innerHTML='<span>Meaning of <b>'+w+'</b>:</span>'+L.map(x=>'<a href="'+x[1]+'" target="_blank" rel="noopener noreferrer">'+x[0]+'</a>').join("");
      li.appendChild(d);li.classList.add("open");
      window._lk=setTimeout(()=>{d.remove();li.classList.remove("open")},10000);
    }
    return;
  }
  const b=e.target.closest(".more");if(!b)return;
  const L=+b.dataset.len;shown[L]=(shown[L]||PAGE)+PAGE;
  const y=window.scrollY;render();window.scrollTo(0,y);
});
document.addEventListener("click",e=>{
  const ob=e.target.closest("#optbtn");
  if(ob){const on=ob.getAttribute("aria-expanded")!=="true";ob.setAttribute("aria-expanded",on);$("opts").hidden=!on;return}
  if(e.target.closest("#clr")){$("rack").value="";syncClr();run();saveQ();$("rack").focus();return}
  if(e.target.closest("#clrf")){["o-starts","o-ends","o-has"].forEach(i=>$(i).value="");$("o-len").value="";$("o-safe").checked=true;run()}
});
function syncClr(){$("clr").hidden=!$("rack").value}
$("rack").addEventListener("input",syncClr);
$("o-len").addEventListener("change",run);
$("o-safe").addEventListener("change",run);
document.querySelectorAll(".opt input").forEach(i=>i.addEventListener("input",run));



["o-starts","o-ends","o-has"].forEach(i=>$(i).value="");$("o-len").value="";$("o-safe").checked=true;
try{const q=new URL(location.href).searchParams.get("q");if(q)$("rack").value=q.slice(0,40)}catch(_){}
syncClr();load();

function load(){
  Promise.all([
    fetch("words/enable.txt").then(r=>r.ok?r.text():Promise.reject()),
    fetch("words/offensive.txt").then(r=>r.ok?r.text():"").catch(()=>"")
  ]).then(([w,b])=>{
    W_ENA=w.split(/\s+/).filter(x=>/^[a-z]{2,15}$/.test(x));
    BAD=new Set(b.split(/\s+/).filter(Boolean));
    loaded=true;run();
  }).catch(()=>{out.innerHTML='<p class="empty">The word list could not be loaded. Please try again later.</p>'});
}

})();
