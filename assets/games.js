(function(){
"use strict";

const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const rnd=n=>Math.floor(Math.random()*n);
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const HANG="aback abdomen abduct about abstract accept acquaint action active adage addendum addict addition adept adjacent adjourn admire admit adopt adorable advent adverse afford affront agony ahold airstrip alameda alarm alienate aloft aloha amaretto amaze amigo android anguish annoy anthrax anytime anywhere apart apostle apricot aquatic ariel aroma around arrow arroyo artery artful artwork ashore aspire assault assemble athletic attend attic audit audition awaken awesome babble backhand backward bacteria bagman ballgame ballpark banal baptism barbaric barnacle barrio batch bayou beach beagle beard before begrudge behave belabor belie believe bellboy bench benedict beret beside betrayal between beverage bible biblical bigfoot billiard biology bipolar birthday blast bleach bleep blink blizzard blood bloody bloom blossom blotto blouse blowfish blowhard blunt bobcat bondage bonehead bongo bonnet boorish booze borrow bossy botulism bound bourne bowel bracelet bracket braid brain brake brazen breakout breech breezy brent bribe bridge brill bronco broody bruise buckle bugle build built bulge bundle burglar burlap burst busload bustle cabernet cabin cachet cadet cagey calzone campaign cannoli canton capote capsize captive caribou carney carwash casbah catalog catch category catty caught cavity celeste celibate censor central cerebrum chant chasm chateau cheap cheapen cheesy chemo cherish cherry chevy chewy chick childish children chlorine choir chomp chrome chunky circuit civil claim clambake clause clean cliche climax clinical clique clung clunk clutch coexist coffee colic collect college color colorful combo comedy comic commerce compete comprise condemn coney confine conjure constant contract convent convince convoy cornball corporal costume couch could council coupon courage covert crafty cranium cranky crash crazy create creation credit cribbage crossbow crust crusty crypto culpable current curry curse custard cyborg cynical cystic daffy daisy damsel daybreak debrief decent decision decoy decree delete delicate demon demur denial deplore deport depot deputy derision derriere desist desktop despise despite detail detonate detract develop devil devour diagonal dialect diazepam dicey diffuse dignify diligent dingle dioxide dipstick disarray disguise dismount dispose distaste disturb ditch ditto divert division doggone dolce dollop dominion dormant doubt doubtful dough downpour downsize dragon drain drape drawback drawn dressy dribble drill drippy drove dumdum dungeon duration duvet dynamo earthy earwig ecstasy eczema edgewise educate eighth elevate elevator embark embezzle emotion employ emporium endear enema enigma enlist enough enslave envelope epidemic epilepsy essay evidence evident evolve exact exotic expense explore extinct extort eyesight eyesore fable falafel falcon fallen fallible fancy farewell fascism fatality fatso fatten fella fellatio fellow female feverish fiasco fidelity fiefdom fiendish figment finagle firemen fitch flamenco float flood flour flunky footman force forehead foreplay foresee foreskin forsake fosse foxhole fragile fragment freaky freight frequent fridge frigate frighten fringe frosty fungal fungi fuzzy gadget gaiety gallery galore gangland garage garcon gastric gateway gator gauge gavel gecko gelato geneva genome geometry gilbert glamor gloat glucose goblet godlike gonzo goodman goofball goose gourd grade grandad grandpa grasp grate greedy gremlin grenade grift grouse grownup gruesome grungy grunt guardian guilty gusto hairline handsome handyman hangout harpy hatch hatchet hazel headache hearty heavy height heinie heroic hessian hetero hideaway hideout hippie hogwash hokey holiday homage hometown honorary hormonal horseman horsey hospital hotel howdy hydrogen hygiene hypnotic hysteria icebox icehouse idiotic imbecile immense imminent immunity impound improve impunity incite income increase indigo indoor inedible inferno infra input insanity inspire insulin intent intubate invoice issue jacket jaundice jawbone jealousy jenny jerkin jersey jewelry jezebel jihad jimmy jugular juicy karma kashmir keynote khaki kicky kingdom kitten knoll landfall landmark lanyard large latino latitude laugh launch layman lefty legion lemon lemony levee level leverage liberty library lichen licorice liftoff ligament linear lingo lippy liquid literate local locate location locket lodge logic lookout loophole lordship lotion lounge louse lousy lowdown lowlife lunar lurch macaroni machete macho mahatma mailman mainline malaria manhunt manifold manila manna mansion manual marina marquee marsh marshal martini marvel match maudlin meaty medicate medieval mediocre medusa menage mentor mercury meridian metaphor metric mettle midge might mineral minimize minion minnow miracle mirage mislead mitten mixup modem modern modesty mollusk moment momentum mongrel montage month mopey moral morello morocco moron morph morrow motor mouth mummy mural murmur mystery napalm napkin nasty nausea needle negative neighbor neonatal neutron nibble niche nickel ninja nobody noodle nowhere nubile nuisance oblique oblivion obtain offset often ointment omelet optimist oracle orange orbital orgasm origami original ornery ottoman outage outburst outdo outlaw outlive outright outrun outset outwit overlook overpaid overrule overrun overview ozone packet paprika paradigm paradise paramour parka partisan passage passion pastrami patent pathetic pathogen patient patron patty pawnshop peach peculiar pelvic penance pence perceive perfecto permit persist perverse pesto petite petty phase pheasant phoney physic physique piano piazza picky picnic piece pimple pinafore pinata pinkie pinky pinpoint pitiful plaid plait platform platonic playmate pleasure poach pointe pointy poise poison polio pollack pollard popcorn poppy porch portal possum postman potato potent pothole pouch pounce preamble precinct precise predict present pressman presto presume primal primate private privy procure prolong prowl psyche psychic publish pulpit pungent punitive purblind pursuant putrid quantum queen quirky rabbit radish railroad raise rancid ransom rapture rawhide reaction reason reassign rebuilt rebuttal receipt recent recheck recite recount recourse recovery rectal redone referral reform refuge regimen rehab rehash reject rekindle relapse relation reload remarry remedy remote renal renew repaid repent replace reprieve reset reshoot resolute restrain restrict retro retrofit return ricochet ridge ridicule righty robbin rocket rogue rosebud rosemary rotation rouse rubbish ruffle rugby rumba rundown rural rustle salient saliva salute sandbag sapphire saran sarcasm sassy sauce savior savvy scallop scampi scarlet scenario scheme schizo scoff scotch scourge scratch scratchy scrawny screech screwup sculptor security seedy seesaw seismic seizure seldom senorita sensory separate septum servant several sewage sexism shale shall shallow shaman shame shanghai shebang sheila shiny shipyard shock shoehorn shootout shore showroom shrewd shrug shrunken shutdown sidebar sideshow simple simplify simulate singe single sketchy skill skillful skinny skull skylight slack slate sleaze sleek sleep sleepy sleigh sleight slimy sloppy sluggish slumlord small smart smitten smock smokey smoochy smudge smuggle snappy snarky sneeze snitch snobby snowman snowmen soapy soggy soiree solar solidify someday somehow someone sonnet sordid sorry souffle sought soulful southern souvenir souvlaki spandex spartan spasm spate spear speedo spence spent spiral splint sponsor spooky sporty spouse spray sprinkle sprint squad squalor squash squat squeeze squid squirm squish stake stakeout stamina stand stang static statuary statue steady steel stellar steroid stigma stigmata stink stint stood stool storm straight streak strife strobe struck stung stunk stuntman subdural subpoena suburb suede sugary sullen sundae superego surge surreal survivor sutra swatch swimsuit swipe sympathy syndrome system systolic table tackle talent talky tango tantrum tapeworm tattle tearful teary teenage telethon temple tenant tense tension texture theme theorem thereof thermal thick thirst thirty though thread thrice thrust thump ticket timid tingle tissue toast token tolerate toolbox torah torque travel trend triad trinity tripe triumph troop truce turkey turnout tutor twirl twitch typical typist unaware unborn unclear uncommon undead undercut unearth unfit unicorn unisex unlike unpack unreal unsavory unveil unwise uphill uranium urban urchin urethra vacate vaccine validity valise variable variety varnish velocity vermouth vibrant village villain vinyl violent viscount visitor vocal voice voyage voyeur wacky waddle wahoo wardrobe warfare washy wasteful wealth weapon weirdo whence whiplash whittle whose widow willful wimpy winch windbag wishful witchy woman women workday workman wormhole worry wound wright write wrote yacht yearbook yeast yummy zillion zodiac".split(" ");
function vsDraw(id,ps,act){$(id).innerHTML=ps.map((p,i)=>'<span class="pl'+(i===act?' on':'')+'">'+(p.m?'<span class="pm">'+p.m+'</span>':'<i class="pd" style="background:'+p.c+'"></i>')+p.n+'</span>').join('<b>vs</b>')}
const slVs=a=>{const two=SL.mode==="two";vsDraw("sl-vs",[{c:"var(--wild)",n:two?"Player 1":"You"},{c:"var(--blue)",n:two?"Player 2":"Computer"}],a)};
const c4Vs=()=>{const two=C4.mode==="two";vsDraw("c4-vs",[{c:"var(--wild)",n:two?"Player 1":"You"},{c:"#ffd23f",n:two?"Player 2":"Computer ("+(C4.mode==="easy"?"Easy":"Hard")+")"}],C4.over?-1:C4.turn-1)};
const ttVs=()=>{const two=TT3.mode==="two";vsDraw("tt-vs",[{m:"X",n:two?"Player 1":"You"},{m:"O",n:two?"Player 2":"Computer ("+(TT3.mode==="easy"?"Easy":"Hard")+")"}],TT3.over?-1:(TT3.turn==="X"?0:1))};
/* ---------- menu + routing ---------- */
const TT={games:"Puzzles & games",wordsearch:"Word search",sudoku:"Sudoku",snakes:"Snakes and ladders",connect4:"Connect 4",ttt:"Tic tac toe",memory:"Memory match",hangman:"Hangman",retrosnake:"Retro Snake",rally:"Paddle Rally",bricks:"Brick Smash",blaster:"Star Blaster",muncher:"Maze Muncher",blocks:"Falling Blocks",hopper:"Road Hopper"};
const INIT={};
["retrosnake","rally","bricks","blaster","muncher","blocks","hopper"].forEach(id=>{INIT[id]=()=>{if(window.ARC)ARC.init(id)}});
function menu(o){var m=document.querySelector(".site-header .menu");if(m&&!o)m.removeAttribute("open")}
function show(v){if(!TT[v])v="games";for(const k in TT)$("v-"+k).hidden=k!==v;$("ttl").textContent=TT[v];$("back").hidden=v==="games";
  
  menu(false);if(INIT[v]){INIT[v]();INIT[v]=null}window.scrollTo(0,0);try{history.replaceState(null,"","#"+v);document.title=(v==="games"?"Free Puzzles & Games":TT[v]+" - Free Online")+" | GoUnscramble"}catch(e){}}
$("back").addEventListener("click",()=>show("games"));
document.addEventListener("click",e=>{const a=e.target.closest("[data-v]");if(a){show(a.dataset.v);return}const g=e.target.closest("[data-go]");if(g)show(g.dataset.go)});
function pills(host,opts,cur,fn){host.innerHTML="";opts.forEach(([v,l])=>{const b=document.createElement("button");b.type="button";b.className="pill"+(v===cur?" on":"");b.textContent=l;b.addEventListener("click",()=>{host.querySelectorAll(".pill").forEach(x=>x.classList.remove("on"));b.classList.add("on");fn(v)});host.appendChild(b)})}

/* ---------- saved progress for the simple games ---------- */
const gsGet=()=>Object.assign({},GUP.get("gs")||{});
function gsAdd(k){const o=gsGet();o[k]=(o[k]||0)+1;GUP.set("gs",o)}
function gsBest(m){const o=gsGet();if(!o.mmb||m<o.mmb){o.mmb=m;GUP.set("gs",o)}}
const gSave=(k,v)=>GUP.set(k,v);
function gLoad(k){const v=GUP.get(k);return v&&!v.over?v:null}

/* ---------- Sudoku ---------- */
const SD={lv:"easy",sol:[],giv:[],cur:[],sel:-1,done:false};
function sdCands(g,i){const r=Math.floor(i/9),c=i%9,u=new Set();for(let k=0;k<9;k++){u.add(g[r*9+k]);u.add(g[k*9+c])}const br=r-r%3,bc=c-c%3;for(let a=0;a<3;a++)for(let b=0;b<3;b++)u.add(g[(br+a)*9+bc+b]);const o=[];for(let v=1;v<=9;v++)if(!u.has(v))o.push(v);return o}
function sdFill(g){let best=-1,bc=null,bl=10;for(let i=0;i<81;i++)if(!g[i]){const c=sdCands(g,i);if(c.length<bl){bl=c.length;best=i;bc=c;if(!bl)return false}}
  if(best<0)return true;for(const v of shuffle(bc)){g[best]=v;if(sdFill(g))return true}g[best]=0;return false}
function sdCount(g,lim){let n=0;(function rec(){let best=-1,bc=null,bl=10;for(let i=0;i<81;i++)if(!g[i]){const c=sdCands(g,i);if(c.length<bl){bl=c.length;best=i;bc=c;if(!bl)return}}
  if(best<0){n++;return}for(const v of bc){g[best]=v;rec();if(n>=lim){g[best]=0;return}}g[best]=0})();return n}
function sdNew(){const clues={easy:40,medium:32,hard:26}[SD.lv];let g=new Array(81).fill(0);sdFill(g);SD.sol=g.slice();
  const p=g.slice();let left=81;for(const i of shuffle([...Array(81).keys()])){if(left<=clues)break;const v=p[i];p[i]=0;if(sdCount(p.slice(),2)!==1)p[i]=v;else left--}
  SD.giv=p.map(v=>v>0);SD.cur=p.slice();SD.sel=-1;SD.done=false;sdSave();sdDraw();$("sd-msg").textContent="Tap a square, then a number."}
function sdConf(i){const v=SD.cur[i];if(!v)return false;const r=Math.floor(i/9),c=i%9;for(let k=0;k<9;k++){if(k!==c&&SD.cur[r*9+k]===v)return true;if(k!==r&&SD.cur[k*9+c]===v)return true}
  const br=r-r%3,bc=c-c%3;for(let a=0;a<3;a++)for(let b=0;b<3;b++){const j=(br+a)*9+bc+b;if(j!==i&&SD.cur[j]===v)return true}return false}
function sdDraw(){const s=SD.sel,sv=s>=0?SD.cur[s]:0,sr=s>=0?Math.floor(s/9):-1,sc=s>=0?s%9:-1;
  [...$("sg").children].forEach((el,i)=>{const r=Math.floor(i/9),c=i%9,v=SD.cur[i];let cl="sc r"+c+" rw"+r;if(SD.giv[i])cl+=" given";else if(v)cl+=" mine";
    if(s>=0){if(i===s)cl+=" sel";else if(sv&&v===sv)cl+=" same";else if(r===sr||c===sc||(Math.floor(r/3)===Math.floor(sr/3)&&Math.floor(c/3)===Math.floor(sc/3)))cl+=" peer"}
    if(v&&!SD.giv[i]&&sdConf(i))cl+=" bad";el.className=cl;el.textContent=v||""});
  const cnt=new Array(10).fill(0);SD.cur.forEach(v=>cnt[v]++);[...$("pad").children].forEach((b,k)=>b.disabled=cnt[k+1]>=9)}
function sdSave(){const o=GUP.get("sd")||{};GUP.set("sd",{lv:SD.lv,sol:SD.sol,giv:SD.giv,cur:SD.cur,done:SD.done,stats:o.stats||{easy:0,medium:0,hard:0}})}
function sdSolved(){const o=GUP.get("sd")||{},st=Object.assign({easy:0,medium:0,hard:0},o.stats||{});st[SD.lv]=(st[SD.lv]||0)+1;GUP.set("sd",{lv:SD.lv,sol:SD.sol,giv:SD.giv,cur:SD.cur,done:true,stats:st})}
function sdSet(v){if(SD.done||SD.sel<0||SD.giv[SD.sel])return;SD.cur[SD.sel]=v;sdDraw();
  if(SD.cur.every((x,i)=>x===SD.sol[i])){SD.done=true;sdSolved();$("sd-msg").textContent="Solved! Well done."}else{sdSave();if(v&&sdConf(SD.sel))$("sd-msg").textContent="That number clashes with another in its row, column or box.";else $("sd-msg").textContent=""}}
INIT.sudoku=()=>{const g=$("sg");for(let i=0;i<81;i++){const b=document.createElement("button");b.type="button";b.setAttribute("role","gridcell");b.addEventListener("click",()=>{SD.sel=i;sdDraw()});g.appendChild(b)}
  for(let v=1;v<=9;v++){const b=document.createElement("button");b.type="button";b.textContent=v;b.addEventListener("click",()=>sdSet(v));$("pad").appendChild(b)}
  const sv=GUP.get("sd"),resume=sv&&sv.sol&&sv.sol.length===81&&!sv.done;
  if(resume){SD.lv=sv.lv||"easy";SD.sol=sv.sol;SD.giv=sv.giv;SD.cur=sv.cur;SD.done=false}
  pills($("sd-lv"),[["easy","Easy"],["medium","Medium"],["hard","Hard"]],SD.lv,v=>{SD.lv=v;setTimeout(sdNew,20)});
  $("sd-erase").addEventListener("click",()=>sdSet(0));$("sd-new").addEventListener("click",()=>{$("sd-msg").textContent="Making a new puzzle...";setTimeout(sdNew,20)});
  $("sd-hint").addEventListener("click",()=>{if(SD.done)return;let i=SD.sel;if(i<0||SD.giv[i]||SD.cur[i]===SD.sol[i]){const o=[];SD.cur.forEach((v,k)=>{if(v!==SD.sol[k])o.push(k)});if(!o.length)return;i=o[rnd(o.length)]}SD.sel=i;SD.cur[i]=SD.sol[i];SD.giv[i]=true;sdDraw();
    if(SD.cur.every((x,k)=>x===SD.sol[k])){SD.done=true;sdSolved();$("sd-msg").textContent="Solved!"}else{sdSave();$("sd-msg").textContent="Hint added."}});
  document.addEventListener("keydown",e=>{if($("v-sudoku").hidden||SD.sel<0)return;if(/^[1-9]$/.test(e.key))sdSet(+e.key);else if(e.key==="Backspace"||e.key==="Delete"||e.key==="0")sdSet(0);
    else if(e.key.startsWith("Arrow")){e.preventDefault();let r=Math.floor(SD.sel/9),c=SD.sel%9;if(e.key==="ArrowUp")r=Math.max(0,r-1);if(e.key==="ArrowDown")r=Math.min(8,r+1);if(e.key==="ArrowLeft")c=Math.max(0,c-1);if(e.key==="ArrowRight")c=Math.min(8,c+1);SD.sel=r*9+c;sdDraw()}});
  if(resume){sdDraw();$("sd-msg").textContent="Welcome back. Your puzzle is just as you left it."}else sdNew()};

/* ---------- Snakes and ladders ---------- */
const LAD={4:14,9:31,20:38,28:84,40:59,51:67,63:81,71:91},SNK={17:7,54:34,62:19,64:60,87:24,93:73,95:75,99:78};
const SL={pos:[0,0],busy:false,over:false,mode:"cpu",turn:0};
const slXY=n=>{const r=Math.floor((n-1)/10);let c=(n-1)%10;if(r%2)c=9-c;return [c*10+5,(9-r)*10+5]};
function slBuild(){let h='<div class="cells">';for(let r=9;r>=0;r--)for(let c=0;c<10;c++){const n=r%2?r*10+(10-c):r*10+c+1;h+='<i class="'+((r+c)%2?"d":"")+'">'+n+"</i>"}h+="</div>";
  let s='<svg viewBox="0 0 100 100">';
  for(const a in LAD){const [x1,y1]=slXY(+a),[x2,y2]=slXY(LAD[a]),dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),nx=-dy/L*1.4,ny=dx/L*1.4;
    s+='<g stroke="#000" stroke-width="1" stroke-linecap="round"><path d="M'+(x1+nx)+" "+(y1+ny)+"L"+(x2+nx)+" "+(y2+ny)+"M"+(x1-nx)+" "+(y1-ny)+"L"+(x2-nx)+" "+(y2-ny)+'" stroke-width="1.3" fill="none"/>';
    const k=Math.max(2,Math.round(L/4));for(let i=1;i<k;i++){const t=i/k,px=x1+dx*t,py=y1+dy*t;s+='<path d="M'+(px+nx)+" "+(py+ny)+"L"+(px-nx)+" "+(py-ny)+'" stroke-width=".9"/>'}s+="</g>"}
  for(const a in SNK){const [x1,y1]=slXY(+a),[x2,y2]=slXY(SNK[a]),mx=(x1+x2)/2,my=(y1+y2)/2,dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),nx=-dy/L*6,ny=dx/L*6;
    s+='<path d="M'+x1+" "+y1+"C"+(mx+nx)+" "+(my+ny)+" "+(mx-nx)+" "+(my-ny)+" "+x2+" "+y2+'" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round"/><path d="M'+x1+" "+y1+"C"+(mx+nx)+" "+(my+ny)+" "+(mx-nx)+" "+(my-ny)+" "+x2+" "+y2+'" fill="none" stroke="#00bf63" stroke-width="1.4" stroke-linecap="round"/><circle cx="'+x1+'" cy="'+y1+'" r="2" fill="#00bf63" stroke="#000" stroke-width=".9"/><circle cx="'+(x1-.7)+'" cy="'+(y1-.6)+'" r=".5" fill="#000"/><circle cx="'+(x1+.7)+'" cy="'+(y1-.6)+'" r=".5" fill="#000"/>'}
  s+='<circle class="tok" id="tk0" r="3" fill="#ff3131" stroke="#000" stroke-width="1"/><circle class="tok" id="tk1" r="3" fill="#3b6cff" stroke="#000" stroke-width="1"/></svg>';
  $("sl").innerHTML=h+s}
function slPlace(){[0,1].forEach(p=>{const [x,y]=slXY(SL.pos[p]||1);const t=$("tk"+p);t.setAttribute("cx",x+(p?2.4:-2.4));t.setAttribute("cy",y+(SL.pos[p]?0:0))})}
const slMsg=(p,t)=>$("sl-msg").innerHTML='<span class="dot" style="background:'+(p?"var(--blue)":"var(--wild)")+'"></span>'+t;
async function slTurn(p){slVs(p);SL.busy=true;$("sl-roll").disabled=true;const r=1+rnd(6);$("dice").textContent=r;const two=SL.mode==="two",who=two?(p?"Player 2":"Player 1"):(p?"Computer":"You");
  if(SL.pos[p]+r>100){slMsg(p,who+" rolled "+r+". Need an exact roll to land on 100.");await sleep(900)}
  else{slMsg(p,who+" rolled "+r+".");for(let i=0;i<r;i++){SL.pos[p]++;slPlace();await sleep(200)}
    const to=LAD[SL.pos[p]]||SNK[SL.pos[p]];if(to){await sleep(250);slMsg(p,(LAD[SL.pos[p]]?who+" climbed a ladder to ":who+" slid down a snake to ")+to+".");SL.pos[p]=to;slPlace();await sleep(900)}
    if(SL.pos[p]===100){SL.over=true;slVs(-1);slMsg(p,two?who+" wins! Well done.":(p?"The computer wins. Try again!":"You win! Well done."));SL.busy=false;gSave("sl",{pos:SL.pos.slice(),over:true,mode:SL.mode,turn:p});if(!two)gsAdd(p?"slL":"slW");return}}
  if(two){SL.turn=1-p;SL.busy=false;gSave("sl",{pos:SL.pos.slice(),over:false,mode:"two",turn:SL.turn});$("sl-roll").disabled=false;slVs(SL.turn);slMsg(SL.turn,(SL.turn?"Player 2":"Player 1")+"'s turn. Roll!");return}
  gSave("sl",{pos:SL.pos.slice(),over:false,mode:SL.mode,turn:0});
  if(p===0){SL.busy=false;await slTurn(1)}else{SL.busy=false;$("sl-roll").disabled=false;slVs(0);slMsg(0,"Your turn. Roll!")}}
function slNew(resume){SL.pos=[0,0];SL.over=false;SL.busy=false;SL.turn=0;$("dice").textContent="-";$("sl-roll").disabled=false;
  const sv=resume&&gLoad("sl");if(sv&&(sv.pos[0]||sv.pos[1])){SL.pos=sv.pos.slice();SL.mode=sv.mode||"cpu";SL.turn=SL.mode==="two"?(sv.turn||0):0;slPlace();slVs(SL.turn);slMsg(SL.turn,"Welcome back. Your game is just as you left it. "+(SL.mode==="two"?(SL.turn?"Player 2":"Player 1")+"'s turn. Roll!":"Roll!"));return}
  gSave("sl",{pos:[0,0],over:false,mode:SL.mode,turn:0});slPlace();slVs(0);slMsg(0,SL.mode==="two"?"Player 1 is red, Player 2 is blue. Player 1, roll to start.":"You are red, the computer is blue. Roll to start.")}
INIT.snakes=()=>{slBuild();const sv0=gLoad("sl");if(sv0&&sv0.mode)SL.mode=sv0.mode;
  pills($("sl-lv"),[["cpu","vs Computer"],["two","2 players"]],SL.mode,v=>{SL.mode=v;slNew()});
  $("sl-roll").addEventListener("click",()=>{if(!SL.busy&&!SL.over)slTurn(SL.mode==="two"?SL.turn:0)});$("sl-new").addEventListener("click",()=>slNew());slNew(true)};

/* ---------- Connect 4 ---------- */
const C4={b:[],turn:1,mode:"easy",over:false,busy:false};
const R6=6,C7=7;
function c4Win(b,p){const d=[[0,1],[1,0],[1,1],[1,-1]];for(let r=0;r<R6;r++)for(let c=0;c<C7;c++){if(b[r][c]!==p)continue;for(const [dr,dc] of d){const cells=[[r,c]];for(let k=1;k<4;k++){const rr=r+dr*k,cc=c+dc*k;if(rr<0||rr>=R6||cc<0||cc>=C7||b[rr][cc]!==p)break;cells.push([rr,cc])}if(cells.length===4)return cells}}return null}
const c4Drop=(b,c)=>{for(let r=R6-1;r>=0;r--)if(!b[r][c])return r;return -1};
function c4Score(b,p){let s=0;const o=3-p;const win=(cells)=>{let a=0,e=0,x=0;for(const [r,c] of cells){const v=b[r][c];if(v===p)a++;else if(v===0)e++;else x++}if(x)return 0;return a===3&&e===1?5:a===2&&e===2?2:0};
  for(let r=0;r<R6;r++)for(let c=0;c<C7;c++){for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){const cells=[];for(let k=0;k<4;k++){const rr=r+dr*k,cc=c+dc*k;if(rr<0||rr>=R6||cc<0||cc>=C7)break;cells.push([rr,cc])}if(cells.length===4){s+=win(cells)}}}
  for(let r=0;r<R6;r++)if(b[r][3]===p)s+=3;return s}
function c4Heur(b,p){return c4Score(b,p)-c4Score(b,3-p)*1.1}
function c4Min(b,d,al,be,max,p){if(c4Win(b,p))return max?1e6+d:-1e6-d;const o=3-p;if(c4Win(b,o))return max?-1e6-d:1e6+d;const cols=[3,2,4,1,5,0,6].filter(c=>c4Drop(b,c)>=0);if(!cols.length)return 0;if(!d)return c4Heur(b,p);
  let best=max?-Infinity:Infinity;for(const c of cols){const r=c4Drop(b,c);b[r][c]=max?p:o;const v=c4Min(b,d-1,al,be,!max,p);b[r][c]=0;if(max){best=Math.max(best,v);al=Math.max(al,v)}else{best=Math.min(best,v);be=Math.min(be,v)}if(be<=al)break}return best}
function c4Ai(){const cols=[...Array(7).keys()].filter(c=>c4Drop(C4.b,c)>=0);if(C4.mode==="easy"){for(const p of [2,1]){for(const c of cols){const r=c4Drop(C4.b,c);C4.b[r][c]=p;const w=c4Win(C4.b,p);C4.b[r][c]=0;if(w&&(p===2||Math.random()<.6))return c}}return cols[rnd(cols.length)]}
  let best=-Infinity,bc=cols[0];for(const c of [3,2,4,1,5,0,6].filter(c=>cols.includes(c))){const r=c4Drop(C4.b,c);C4.b[r][c]=2;const v=c4Min(C4.b,4,-Infinity,Infinity,false,2);C4.b[r][c]=0;if(v>best){best=v;bc=c}}return bc}
function c4Draw(w){const h=[];for(let c=0;c<C7;c++){let s='<button type="button" data-c="'+c+'" aria-label="Drop in column '+(c+1)+'">';for(let r=0;r<R6;r++){const v=C4.b[r][c],isw=w&&w.some(x=>x[0]===r&&x[1]===c);s+='<i class="'+(v?"p"+v:"")+(isw?" win":"")+'"></i>'}h.push(s+"</button>")}$("c4").innerHTML=h.join("")}
function c4Msg(){c4Vs();const two=C4.mode==="two";$("c4-msg").textContent=C4.over?$("c4-msg").textContent:two?(C4.turn===1?"Player 1's turn (red).":"Player 2's turn (yellow)."):"Your turn. You are red."}
async function c4Play(c){if(C4.over||C4.busy)return;const r=c4Drop(C4.b,c);if(r<0)return;const p=C4.turn;C4.b[r][c]=p;const w=c4Win(C4.b,p);c4Draw(w);
  if(w){C4.over=true;c4Vs();$("c4-msg").textContent=C4.mode==="two"?(p===1?"Player 1 wins!":"Player 2 wins!"):(p===1?"You win! Well done.":"The computer wins. Try again!");gSave("c4",{b:C4.b,turn:C4.turn,mode:C4.mode,over:true});if(C4.mode!=="two")gsAdd(p===1?"c4W":"c4L");return}
  if(C4.b[0].every(x=>x)){C4.over=true;c4Vs();$("c4-msg").textContent="It's a draw.";gSave("c4",{b:C4.b,turn:C4.turn,mode:C4.mode,over:true});gsAdd("c4D");return}
  C4.turn=3-p;gSave("c4",{b:C4.b,turn:C4.turn,mode:C4.mode,over:false});c4Msg();if(C4.mode!=="two"&&C4.turn===2){C4.busy=true;$("c4-msg").textContent="Computer is thinking...";await sleep(450);const cc=c4Ai();C4.busy=false;await c4Play(cc)}}
function c4New(resume){C4.b=Array.from({length:R6},()=>new Array(C7).fill(0));C4.turn=1;C4.over=false;C4.busy=false;
  const sv=resume&&gLoad("c4");if(sv&&sv.b&&sv.b.length===R6&&sv.b.some(r=>r.some(x=>x))){C4.b=sv.b;C4.turn=sv.turn;C4.mode=sv.mode;c4Draw(null);c4Msg();if(C4.mode!=="two"&&C4.turn===2)setTimeout(async()=>{C4.busy=true;await sleep(450);const cc=c4Ai();C4.busy=false;await c4Play(cc)},300);return}
  c4Draw(null);c4Msg();gSave("c4",{b:C4.b,turn:1,mode:C4.mode,over:false})}
INIT.connect4=()=>{const sv0=gLoad("c4");if(sv0&&sv0.mode)C4.mode=sv0.mode;pills($("c4-lv"),[["easy","Easy"],["hard","Hard"],["two","2 players"]],C4.mode,v=>{C4.mode=v;c4New()});$("c4").addEventListener("click",e=>{const b=e.target.closest("button[data-c]");if(b)c4Play(+b.dataset.c)});$("c4-new").addEventListener("click",()=>c4New());c4New(true)};

/* ---------- Tic tac toe ---------- */
const TT3={b:[],turn:"X",mode:"easy",over:false,sc:{x:0,o:0,d:0}};
const LN=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const ttW=b=>{for(const l of LN)if(b[l[0]]&&b[l[0]]===b[l[1]]&&b[l[0]]===b[l[2]])return l;return null};
function ttMin(b,p){const w=ttW(b);if(w)return b[w[0]]==="O"?10:-10;if(b.every(x=>x))return 0;let best=p==="O"?-99:99;for(let i=0;i<9;i++)if(!b[i]){b[i]=p;const v=ttMin(b,p==="O"?"X":"O");b[i]="";best=p==="O"?Math.max(best,v):Math.min(best,v)}return best}
function ttAi(){const e=[];TT3.b.forEach((v,i)=>{if(!v)e.push(i)});if(TT3.mode==="easy"&&Math.random()<.7)return e[rnd(e.length)];let best=-99,mv=[];for(const i of e){TT3.b[i]="O";const v=ttMin(TT3.b,"X");TT3.b[i]="";if(v>best){best=v;mv=[i]}else if(v===best)mv.push(i)}return mv[rnd(mv.length)]}
function ttDraw(w){$("ttt").innerHTML="";TT3.b.forEach((v,i)=>{const b=document.createElement("button");b.type="button";b.textContent=v;b.className=(v||"")+(w&&w.includes(i)?" win":"");b.setAttribute("aria-label","Square "+(i+1)+(v?", "+v:""));b.addEventListener("click",()=>ttPlay(i));$("ttt").appendChild(b)})}
function ttSc(){ttVs();$("tt-score").textContent="X "+TT3.sc.x+" · O "+TT3.sc.o+" · Draws "+TT3.sc.d}
async function ttPlay(i){if(TT3.over||TT3.b[i]||TT3.busy)return;TT3.b[i]=TT3.turn;let w=ttW(TT3.b);ttDraw(w);
  const two=TT3.mode==="two";if(w){TT3.over=true;const x=TT3.turn==="X";TT3.sc[x?"x":"o"]++;ttSave();$("tt-msg").textContent=two?(TT3.turn==="X"?"Player 1":"Player 2")+" wins!":(x?"You win! Well done.":"The computer wins.");ttSc();return}
  if(TT3.b.every(x=>x)){TT3.over=true;TT3.sc.d++;ttSave();$("tt-msg").textContent="It's a draw.";ttSc();return}
  TT3.turn=TT3.turn==="X"?"O":"X";ttSave();if(two){$("tt-msg").textContent=(TT3.turn==="X"?"Player 1's turn (X).":"Player 2's turn (O).")}else if(TT3.turn==="O"){TT3.busy=true;$("tt-msg").textContent="Computer is thinking...";await sleep(400);TT3.busy=false;await ttPlay(ttAi());if(!TT3.over)$("tt-msg").textContent="Your turn. You are X."}}
function ttSave(){gSave("tt",{b:TT3.b,turn:TT3.turn,mode:TT3.mode,over:TT3.over,sc:TT3.sc})}
function ttNew(resume){TT3.b=new Array(9).fill("");TT3.turn="X";TT3.over=false;TT3.busy=false;
  const sv=resume&&gLoad("tt");if(sv&&sv.b&&sv.b.length===9&&sv.b.some(x=>x)){TT3.b=sv.b;TT3.turn=sv.turn;TT3.mode=sv.mode;ttDraw(null);ttSc();$("tt-msg").textContent="Welcome back. Your game is just as you left it.";
    if(TT3.mode!=="two"&&TT3.turn==="O")setTimeout(async()=>{TT3.busy=true;await sleep(400);TT3.busy=false;await ttPlay(ttAi());if(!TT3.over)$("tt-msg").textContent="Your turn. You are X."},300);return}
  ttDraw(null);ttSave();$("tt-msg").textContent=TT3.mode==="two"?"Player 1's turn (X).":"Your turn. You are X.";ttSc()}
INIT.ttt=()=>{const any=GUP.get("tt");if(any){if(any.mode)TT3.mode=any.mode;if(any.sc)TT3.sc=any.sc}pills($("tt-lv"),[["easy","Easy"],["hard","Hard"],["two","2 players"]],TT3.mode,v=>{TT3.mode=v;TT3.sc={x:0,o:0,d:0};ttNew()});$("tt-new").addEventListener("click",()=>ttNew());ttNew(true)};

/* ---------- Memory match ---------- */
const MM={cards:[],open:[],moves:0,found:0,lock:false,mode:"one",turn:0,sc:[0,0]};
const FACES=["🍎","🍌","🍇","🍒","🍋","🍉","🥝","🍓"];
const mmVs=()=>{const two=MM.mode==="two";vsDraw("mm-vs",two?[{c:"var(--wild)",n:"Player 1 ("+MM.sc[0]+")"},{c:"#ffd23f",n:"Player 2 ("+MM.sc[1]+")"}]:[{c:"var(--wild)",n:"1 player"}],two?MM.turn:0)};
function mmSave(){const m=[];$("mem").querySelectorAll(".mc").forEach((b,i)=>{if(b.classList.contains("done"))m.push(i)});gSave("mm",{cards:MM.cards,m,moves:MM.moves,over:MM.found===8,mode:MM.mode,turn:MM.turn,sc:MM.sc})}
function mmNew(resume){const sv=resume&&gLoad("mm"),ok=sv&&sv.cards&&sv.cards.length===16;MM.cards=ok?sv.cards:shuffle([...FACES,...FACES]);MM.open=[];MM.moves=ok?(sv.moves||0):0;MM.found=0;MM.lock=false;MM.turn=ok?(sv.turn||0):0;MM.sc=ok&&sv.sc?sv.sc.slice():[0,0];$("mem").innerHTML="";
  MM.cards.forEach((f,i)=>{const b=document.createElement("button");b.type="button";b.className="mc";b.textContent=f;b.setAttribute("aria-label","Card "+(i+1));b.addEventListener("click",()=>mmFlip(i,b));$("mem").appendChild(b)});
  if(ok){const bs=$("mem").querySelectorAll(".mc");(sv.m||[]).forEach(i=>{bs[i].className="mc done"});MM.found=(sv.m||[]).length/2}
  mmVs();mmMsg(ok&&MM.moves?"Welcome back. Moves so far: "+MM.moves:"");if(!ok)mmSave()}
function mmMsg(t){if(MM.mode==="two"){$("mm-msg").textContent=t||"Player "+(MM.turn+1)+"'s turn. Pairs: "+MM.sc[0]+" to "+MM.sc[1];return}let best="";try{const v=localStorage.getItem("gu-mm");if(v)best=" · Best: "+v}catch(e){}$("mm-msg").textContent=t||"Moves: "+MM.moves+best}
async function mmFlip(i,b){if(MM.lock||b.classList.contains("up")||b.classList.contains("done"))return;b.classList.add("up");MM.open.push([i,b]);if(MM.open.length<2)return;MM.moves++;mmMsg();const [[i1,b1],[i2,b2]]=MM.open;MM.open=[];
  if(MM.cards[i1]===MM.cards[i2]){b1.className="mc done";b2.className="mc done";MM.found++;if(MM.mode==="two")MM.sc[MM.turn]++;mmSave();mmVs();if(MM.mode==="two"&&MM.found===8){const a=MM.sc[0],b=MM.sc[1];mmMsg(a===b?"All pairs found. It's a draw, "+a+" each!":"Player "+(a>b?1:2)+" wins, "+Math.max(a,b)+" pairs to "+Math.min(a,b)+"!");return}else mmMsg();if(MM.mode!=="two"&&MM.found===8){gsAdd("mmP");gsBest(MM.moves);let t="You found them all in "+MM.moves+" moves!";try{const v=+localStorage.getItem("gu-mm")||999;if(MM.moves<v){localStorage.setItem("gu-mm",String(MM.moves));t+=" New best!"}}catch(e){}mmMsg(t)}}
  else{MM.lock=true;await sleep(800);b1.classList.remove("up");b2.classList.remove("up");MM.lock=false;if(MM.mode==="two"){MM.turn=1-MM.turn;mmVs();mmMsg()}mmSave()}}
INIT.memory=()=>{const sv0=gLoad("mm");if(sv0&&sv0.mode)MM.mode=sv0.mode;
  pills($("mm-lv"),[["one","1 player"],["two","2 players"]],MM.mode,v=>{MM.mode=v;mmNew()});
  $("mm-new").addEventListener("click",()=>mmNew());mmNew(true)};

/* ---------- Hangman ---------- */
const HM={w:"",g:new Set(),miss:0,over:false,mode:"one",setter:0,sc:[0,0],custom:false};
function hmDraw(){const w=HM.w;$("hm-word").innerHTML=[...w].map(c=>'<span class="'+(HM.g.has(c)?"":(HM.over?"miss":"e"))+'">'+(HM.g.has(c)||HM.over?c:"")+"</span>").join("");
  document.querySelectorAll("#hm-fig [data-p]").forEach(p=>p.style.display=+p.dataset.p<=HM.miss?"":"none");
  [...$("hm-keys").children].forEach(b=>{const l=b.textContent.toLowerCase(),u=HM.g.has(l);b.disabled=u||HM.over;b.className=u&&w.includes(l)?"ok":""})}
function hmSave(){gSave("hm",{w:HM.w,g:[...HM.g],miss:HM.miss,over:HM.over,mode:HM.mode,setter:HM.setter,sc:HM.sc})}
function hmVs(){const two=HM.mode==="two";vsDraw("hm-vs",two?[{c:"var(--wild)",n:"Player 1 ("+HM.sc[0]+")"},{c:"#ffd23f",n:"Player 2 ("+HM.sc[1]+")"}]:[{c:"var(--wild)",n:"1 player"}],two?1-HM.setter:0)}
function hmGuess(l){if(HM.over||HM.g.has(l))return;HM.g.add(l);if(!HM.w.includes(l))HM.miss++;
  if([...HM.w].every(c=>HM.g.has(c))){HM.over=true;if(HM.mode==="two"){HM.sc[1-HM.setter]++;hmVs()}else gsAdd("hmW");$("hm-msg").textContent=HM.mode==="two"?"Player "+(2-HM.setter)+" got it!":"You got it!";hmSave();hmLook()}else if(HM.miss>=6){HM.over=true;if(HM.mode==="two"){HM.sc[HM.setter]++;hmVs()}else gsAdd("hmL");$("hm-msg").textContent="Out of guesses. The word was "+HM.w.toUpperCase()+".";hmSave();hmLook()}else $("hm-msg").textContent=(HM.mode==="two"?"Player "+(2-HM.setter)+": ":"")+(6-HM.miss)+" wrong guess"+(6-HM.miss===1?"":"es")+" left.";hmSave();hmDraw()}
function hmLook(){const q=encodeURIComponent(HM.w);$("hm-msg").insertAdjacentHTML("beforeend",' <span class="look"><a href="https://www.merriam-webster.com/dictionary/'+q+'" target="_blank" rel="noopener noreferrer">Meaning</a></span>')}
function hmSetShow(on){$("hm-set").hidden=!on;$("hm-keys").hidden=on;$("hm-word").hidden=on;document.querySelector("#v-hangman .hm svg").style.visibility=on?"hidden":""}
function hmNew(resume,swap){const sv=resume&&gLoad("hm");HM.sc=(sv&&sv.sc)?sv.sc.slice():HM.sc;
  if(sv&&sv.w&&/^[a-z]+$/.test(sv.w)&&(sv.g.length||sv.miss)){HM.mode=sv.mode||"one";HM.setter=sv.setter||0;HM.w=sv.w;HM.g=new Set(sv.g);HM.miss=sv.miss;HM.over=false;hmSetShow(false);hmVs();$("hm-msg").textContent="Welcome back. "+(6-HM.miss)+" wrong guess"+(6-HM.miss===1?"":"es")+" left.";hmDraw();return}
  if(HM.mode==="two"){if(swap)HM.setter=1-HM.setter;HM.w="";HM.g=new Set();HM.miss=0;HM.over=false;hmSetShow(true);hmVs();$("hm-in").value="";$("hm-msg").textContent="Player "+(HM.setter+1)+", type a secret word for Player "+(2-HM.setter)+" to guess. Keep it hidden!";hmDraw();return}
  hmSetShow(false);hmVs();
  HM.w=HANG[rnd(HANG.length)];HM.g=new Set();HM.miss=0;HM.over=false;$("hm-msg").textContent="Guess a letter. 6 wrong guesses and it's over.";hmSave();hmDraw()}
INIT.hangman=()=>{const sv0=gLoad("hm");if(sv0&&sv0.mode)HM.mode=sv0.mode;
  pills($("hm-lv"),[["one","1 player"],["two","2 players"]],HM.mode,v=>{HM.mode=v;HM.sc=[0,0];HM.setter=0;hmNew()});
  $("hm-go").addEventListener("click",()=>{const w=$("hm-in").value.trim().toLowerCase();if(!/^[a-z]{3,15}$/.test(w)){$("hm-msg").textContent="Use 3 to 15 letters, no spaces or numbers.";return}HM.w=w;HM.g=new Set();HM.miss=0;HM.over=false;$("hm-in").value="";hmSetShow(false);$("hm-msg").textContent="Player "+(2-HM.setter)+", guess a letter. 6 wrong guesses and it's over.";hmSave();hmDraw()});
  $("hm-in").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();$("hm-go").click()}});"abcdefghijklmnopqrstuvwxyz".split("").forEach(l=>{const b=document.createElement("button");b.type="button";b.textContent=l;b.addEventListener("click",()=>hmGuess(l));$("hm-keys").appendChild(b)});
  document.addEventListener("keydown",e=>{if($("v-hangman").hidden||document.activeElement===$("hm-in")||!HM.w||e.ctrlKey||e.metaKey||e.altKey)return;if(/^[a-z]$/i.test(e.key))hmGuess(e.key.toLowerCase())});$("hm-new").addEventListener("click",()=>hmNew(false,true));hmNew(true)};

/* ---------- Word search (ported) ---------- */
(function(){

const CATS=[{"name": "Food", "color": "#ffb3a7", "words": ["APPLE", "BACON", "BANANA", "BEANS", "BERRY", "BREAD", "BURGER", "BUTTER", "CAKE", "CARROT", "CEREAL", "CHEESE", "COOKIE", "CURRY", "EGG", "GARLIC", "GRAPE", "HONEY", "JAM", "LEMON", "MANGO", "MUFFIN", "NOODLE", "OLIVE", "ONION", "ORANGE", "PANCAKE", "PASTA", "PEACH", "PEPPER", "PIE", "PIZZA", "POTATO", "RICE", "SALAD", "SALT", "SOUP", "STEAK", "SUGAR", "SUSHI", "TACO", "TOMATO", "WAFFLE"]}, {"name": "Animals", "color": "#ffd59a", "words": ["BADGER", "BEAR", "BEE", "CAMEL", "CAT", "COW", "DEER", "DOG", "DOLPHIN", "EAGLE", "ELEPHANT", "FOX", "FROG", "GIRAFFE", "GOAT", "GORILLA", "HEDGEHOG", "HIPPO", "HORSE", "KOALA", "LION", "LIZARD", "MONKEY", "MOUSE", "OTTER", "OWL", "PANDA", "PARROT", "PENGUIN", "PIG", "RABBIT", "RHINO", "SHARK", "SHEEP", "SNAKE", "SPIDER", "SQUIRREL", "TIGER", "TURTLE", "WHALE", "WOLF", "ZEBRA"]}, {"name": "Countries", "color": "#fff08a", "words": ["AUSTRIA", "BELGIUM", "BRAZIL", "CANADA", "CHAD", "CHILE", "CHINA", "CROATIA", "CUBA", "DENMARK", "EGYPT", "ENGLAND", "FIJI", "FINLAND", "FRANCE", "GERMANY", "GHANA", "GREECE", "ICELAND", "INDIA", "IRAN", "IRAQ", "IRELAND", "ISRAEL", "ITALY", "JAPAN", "JORDAN", "KENYA", "LAOS", "MALI", "MEXICO", "NEPAL", "NIGERIA", "NORWAY", "OMAN", "PERU", "POLAND", "PORTUGAL", "QATAR", "RUSSIA", "SCOTLAND", "SERBIA", "SPAIN", "SWEDEN", "TOGO", "TONGA", "TURKEY", "WALES", "YEMEN"]}, {"name": "Sports", "color": "#c4f0a2", "words": ["ARCHERY", "BADMINTON", "BASEBALL", "BASKETBALL", "BOWLING", "BOXING", "CRICKET", "CURLING", "CYCLING", "DARTS", "DIVING", "FENCING", "GOLF", "GYMNASTICS", "HOCKEY", "HURDLES", "JAVELIN", "JUDO", "KARATE", "LACROSSE", "NETBALL", "POLO", "ROWING", "RUGBY", "RUNNING", "SAILING", "SKATING", "SKIING", "SNOOKER", "SOCCER", "SQUASH", "SURFING", "SWIMMING", "TENNIS", "VOLLEYBALL", "WRESTLING"]}, {"name": "Nature", "color": "#a6eadf", "words": ["BEACH", "BLOSSOM", "BRANCH", "BREEZE", "CANYON", "CAVE", "CLIFF", "CLOUD", "DESERT", "DUNE", "FERN", "FLOWER", "FOREST", "GLACIER", "HILL", "ISLAND", "JUNGLE", "LAKE", "LEAF", "MARSH", "MEADOW", "MOSS", "MOUNTAIN", "OCEAN", "POND", "PRAIRIE", "RAIN", "REEF", "RIVER", "ROOT", "STORM", "STREAM", "SUNSET", "SWAMP", "THUNDER", "TREE", "TUNDRA", "VALLEY", "VOLCANO", "WATERFALL"]}, {"name": "Music", "color": "#a9ccff", "words": ["ALBUM", "BAND", "BANJO", "BASS", "BEAT", "BLUES", "CELLO", "CHOIR", "CHORD", "CLARINET", "CONCERT", "DISCO", "DRUMS", "FLUTE", "FOLK", "GUITAR", "HARP", "JAZZ", "LYRICS", "MELODY", "MICROPHONE", "NOTE", "OBOE", "OPERA", "PIANO", "POP", "RECORD", "REGGAE", "RHYTHM", "ROCK", "SCALE", "SINGER", "SONG", "SOUL", "TEMPO", "TRACK", "TRUMPET", "TUBA", "TUNE", "VIOLIN"]}, {"name": "Space", "color": "#d6bdff", "words": ["ALIEN", "ASTEROID", "ASTRONAUT", "CAPSULE", "COMET", "COSMOS", "CRATER", "ECLIPSE", "GALAXY", "GRAVITY", "JUPITER", "LAUNCH", "LUNAR", "MARS", "MERCURY", "METEOR", "MOON", "NEBULA", "NEPTUNE", "ORBIT", "PLANET", "PLUTO", "ROCKET", "SATELLITE", "SATURN", "SHUTTLE", "SOLAR", "STAR", "STATION", "SUN", "TELESCOPE", "UNIVERSE", "URANUS", "VENUS"]}, {"name": "Jobs", "color": "#ffbde6", "words": ["ACTOR", "ARTIST", "BAKER", "BANKER", "BARBER", "BUILDER", "CHEF", "CLEANER", "CLERK", "COOK", "DANCER", "DENTIST", "DESIGNER", "DOCTOR", "DRIVER", "ENGINEER", "FARMER", "FIREMAN", "GARDENER", "GUARD", "JUDGE", "LAWYER", "MANAGER", "MECHANIC", "NURSE", "PAINTER", "PHARMACIST", "PILOT", "PLUMBER", "POLICE", "POSTMAN", "SAILOR", "SCIENTIST", "SINGER", "SOLDIER", "SURGEON", "TAILOR", "TEACHER", "VET", "WRITER"]}, {"name": "Home", "color": "#ffcaa0", "words": ["ATTIC", "BASEMENT", "BATH", "BED", "BLANKET", "BOWL", "BROOM", "BUCKET", "CARPET", "CELLAR", "CHAIR", "CLOCK", "CURTAIN", "DOOR", "DRAWER", "FLOOR", "FORK", "FRIDGE", "GARAGE", "KETTLE", "KNIFE", "LAMP", "MIRROR", "MUG", "OVEN", "PILLOW", "PLATE", "ROOF", "SHELF", "SHOWER", "SINK", "SOFA", "SPOON", "STAIRS", "TABLE", "TOASTER", "TOWEL", "WALL", "WINDOW"]}, {"name": "Travel", "color": "#b4e8ff", "words": ["AIRPORT", "BOOKING", "BUS", "CAMERA", "CAMPING", "COMPASS", "CRUISE", "FLIGHT", "GUIDE", "HARBOUR", "HIKING", "HOTEL", "ISLAND", "JOURNEY", "LAGOON", "LUGGAGE", "MAP", "PASSPORT", "POSTCARD", "RESORT", "SAFARI", "SANDCASTLE", "SOUVENIR", "SUITCASE", "SUNHAT", "SUNSHINE", "SWIMSUIT", "TAXI", "TENT", "TICKET", "TOURIST", "TRAIN", "TRIP", "VOYAGE"]}];
const PER=30, N=10;
const PAL=["#ffb3b3","#ffd9a0","#fff08a","#b9f0a8","#9fe8de","#a8c8ff","#d3b8ff","#ffb8e6"];
const app=$("ws-app"),titleEl=$("ws-title"),backBtn=$("ws-back"),bsp=$("ws-bsp");

// ---------- storage (per-viewer convenience, safe if blocked) ----------
function wsd(){const w=GUP.get("ws")||{};if(!w.done)w.done={};if(!w.cur)w.cur={};return w}
function doneSet(cat){return new Set(wsd().done[cat]||[])}
function roundOf(cat){const d=doneSet(cat);let R=0;for(;;){let all=true;for(let n=1;n<=PER;n++)if(!d.has(R*100+n)){all=false;break}if(!all)return R;R++}}
function roundDone(cat){const R=roundOf(cat),d=doneSet(cat),o=new Set();for(let n=1;n<=PER;n++)if(d.has(R*100+n))o.add(n);return o}
function markDone(cat,n){const w=wsd(),s=doneSet(cat);s.add(n);w.done[cat]=[...s].sort((a,b)=>a-b);delete w.cur[cat+"|"+n];GUP.set("ws",w)}
function curGet(cat,n){return wsd().cur[cat+"|"+n]}
function curSave(cat,n,o){const w=wsd();o.t=Date.now();w.cur[cat+"|"+n]=o;GUP.set("ws",w)}
function curClear(cat,n){const w=wsd();if(w.cur[cat+"|"+n]){delete w.cur[cat+"|"+n];GUP.set("ws",w)}}
function inProg(cat){const c=wsd().cur,d=doneSet(cat);return Object.keys(c).filter(k=>k.split("|")[0]===cat&&!d.has(+k.split("|")[1])).length}

// ---------- seeded puzzle generation ----------
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function dirsFor(n){
  const R=[0,1],D=[1,0],DR=[1,1],DL=[1,-1],L=[0,-1],U=[-1,0],UL=[-1,-1],UR=[-1,1];
  if(n<=6)return[R,D];
  if(n<=14)return[R,D,DR,DL];
  return[R,D,DR,DL,L,U,UL,UR];
}
function build(cat,n,id){
  const pool=[...new Set(cat.words.filter(w=>w.length>=3&&w.length<=N))];
  const count=Math.min(10,8+Math.floor((n-1)/10));
  for(let attempt=0;attempt<30;attempt++){
    const r=rng(hash(cat.name+"#"+id+"#"+attempt));
    const sh=pool.slice();for(let i=sh.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[sh[i],sh[j]]=[sh[j],sh[i]]}
    const pick=[];
    for(const w of sh){if(pick.length>=count)break;if(pick.every(p=>!p.includes(w)&&!w.includes(p)))pick.push(w)}
    const grid=Array.from({length:N},()=>Array(N).fill(""));
    const dirs=dirsFor(n),pos={};let ok=true;
    for(const w of pick.slice().sort((a,b)=>b.length-a.length)){
      let placed=false;
      for(let t=0;t<500&&!placed;t++){
        const [dr,dc]=dirs[Math.floor(r()*dirs.length)];
        const row=Math.floor(r()*N),col=Math.floor(r()*N);
        const er=row+dr*(w.length-1),ec=col+dc*(w.length-1);
        if(er<0||er>=N||ec<0||ec>=N)continue;
        let fit=true;
        for(let i=0;i<w.length;i++){const ch=grid[row+dr*i][col+dc*i];if(ch&&ch!==w[i]){fit=false;break}}
        if(!fit)continue;
        pos[w]=[];
        for(let i=0;i<w.length;i++){grid[row+dr*i][col+dc*i]=w[i];pos[w].push((row+dr*i)*N+col+dc*i)}
        placed=true;
      }
      if(!placed){ok=false;break}
    }
    if(!ok)continue;
    const ab="ABCDEFGHIJKLMNOPRSTUVWY";
    for(let i=0;i<N;i++)for(let j=0;j<N;j++)if(!grid[i][j])grid[i][j]=ab[Math.floor(r()*ab.length)];
    return {letters:grid.flat(),words:pick.slice().sort(),pos};
  }
  return null;
}

// ---------- views ----------
function el(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
let view={name:"cats"};
function show(v){view=v;render()}
backBtn.addEventListener("click",()=>{
  if(view.name==="puzzle")show({name:"nums",cat:view.cat});
  else if(view.name==="nums")show({name:"cats"});
});

function render(){
  app.innerHTML="";
  backBtn.hidden=view.name==="cats";bsp.hidden=view.name!=="cats";
  if(view.name==="cats")renderCats();
  else if(view.name==="nums")renderNums();
  else renderPuzzle();
  
}

function renderCats(){
  titleEl.textContent="Word Search";
  app.appendChild(el("p","lead","Pick a category. Drag your finger across the letters to find each word."));
  const g=el("div","cats");
  CATS.forEach((c,i)=>{
    const d=roundDone(c.name).size,R=roundOf(c.name);
    const b=el("button","cat");b.type="button";b.style.setProperty("--c",c.color);
    b.innerHTML='<span class="ico">'+c.name[0]+'</span><span class="nm">'+c.name+(R?' <small>Set '+(R+1)+'</small>':'')+'</span><span class="pg">'+d+' of '+PER+' puzzles'+(inProg(c.name)?' · '+inProg(c.name)+' started':'')+'</span><span class="pbar"><i style="width:'+Math.round(d/PER*100)+'%"></i></span>';
    b.addEventListener("click",()=>show({name:"nums",cat:i}));
    g.appendChild(b);
  });
  app.appendChild(g);
}

function renderNums(){
  const c=CATS[view.cat],d=roundDone(c.name),R=roundOf(c.name);
  titleEl.textContent=c.name;
  app.appendChild(el("p","lead",d.size+" of "+PER+" puzzles finished"));
  const g=el("div","nums");g.style.setProperty("--c",c.color);
  let next=0;for(let n=1;n<=PER;n++)if(!d.has(n)){next=n;break}
  for(let n=1;n<=PER;n++){
    const started=!d.has(n)&&!!curGet(c.name,R*100+n);
    const b=el("button","num"+(d.has(n)?" done":(started?" prog":(n===next?" next":""))),String(n));b.type="button";
    b.setAttribute("aria-label","Puzzle "+n+(d.has(n)?", finished":(started?", started":"")));
    b.addEventListener("click",()=>show({name:"puzzle",cat:view.cat,n}));
    g.appendChild(b);
  }
  app.appendChild(g);
}

function renderPuzzle(){
  const c=CATS[view.cat],n=view.n,R=roundOf(c.name),id=R*100+n,P=build(c,n,id);
  titleEl.textContent=c.name+" "+n;
  if(!P){app.appendChild(el("p","lead","Could not build this puzzle. Go back and try another."));return}
  const found=new Map(),hinted=new Set();let hints=3,colorIdx=0;

  const wl=el("div","card words");wl.appendChild(el("div","ttl",c.name));
  const wEls={};P.words.forEach(w=>{const s=el("span","w",w);wEls[w]=s;wl.appendChild(s)});
  app.appendChild(wl);

  const gc=el("div","card gcard"),gw=el("div","gw");gc.appendChild(gw);
  const svgNS="http://www.w3.org/2000/svg",svg=document.createElementNS(svgNS,"svg");
  svg.setAttribute("viewBox","0 0 "+N+" "+N);svg.setAttribute("preserveAspectRatio","none");gw.appendChild(svg);
  const cellsEl=el("div","cells");gw.appendChild(cellsEl);
  const cells=P.letters.map(ch=>{const s=el("span","c",ch);cellsEl.appendChild(s);return s});
  app.appendChild(gc);

  function line(a,b,color,op){
    const l=document.createElementNS(svgNS,"line");
    l.setAttribute("x1",a%N+.5);l.setAttribute("y1",Math.floor(a/N)+.5);
    l.setAttribute("x2",b%N+.5);l.setAttribute("y2",Math.floor(b/N)+.5);
    l.setAttribute("stroke",color);l.setAttribute("stroke-width",".82");l.setAttribute("stroke-linecap","round");l.setAttribute("stroke-opacity",op);
    svg.appendChild(l);return l;
  }

  const acts=el("div","acts");
  const hintBtn=el("button","pill","Hint ("+hints+")");hintBtn.type="button";
  const resetBtn=el("button","pill","Reset");resetBtn.type="button";
  acts.append(hintBtn,resetBtn);app.appendChild(acts);
  const doneHost=el("div");app.appendChild(doneHost);

  hintBtn.addEventListener("click",()=>{
    if(hints<=0)return;
    const open=P.words.filter(w=>!found.has(w));
    const options=[];
    open.forEach(w=>P.pos[w].forEach(i=>{if(!hinted.has(i))options.push(i)}));
    if(!options.length)return;
    const i=options[Math.floor(Math.random()*options.length)];
    hinted.add(i);cells[i].classList.add("hint");
    hints--;hintBtn.textContent="Hint ("+hints+")";hintBtn.disabled=hints<=0;saveCur();
  });
  resetBtn.addEventListener("click",()=>{curClear(c.name,id);show({name:"puzzle",cat:view.cat,n})});

  // ---- progress: restore what was found before, and save after every find or hint ----
  const foundList=[];
  function saveCur(){if(found.size===P.words.length)return;curSave(c.name,id,{f:foundList,h:3-hints,hc:[...hinted]})}
  const saved=curGet(c.name,id);
  if(saved){
    (saved.f||[]).forEach(([w,ci])=>{const p=P.pos[w];if(!p||found.has(w))return;const color=PAL[ci%PAL.length];line(p[0],p[p.length-1],color,".85");found.set(w,color);wEls[w].classList.add("f");foundList.push([w,ci])});
    colorIdx=foundList.length?Math.max(...foundList.map(x=>x[1]))+1:0;
    hints=Math.max(0,3-(saved.h||0));(saved.hc||[]).forEach(i=>{if(cells[i]){hinted.add(i);cells[i].classList.add("hint")}});
    hintBtn.textContent="Hint ("+hints+")";hintBtn.disabled=hints<=0;
  }

  // ---- finger / mouse drag ----
  let start=-1,cur=-1,preview=null,ptr=null;
  function cellAt(x,y){
    const r=gw.getBoundingClientRect();
    const fx=(x-r.left)/r.width*N,fy=(y-r.top)/r.height*N;
    return {fx,fy};
  }
  function snap(sr,sc,fx,fy){
    const dx=fx-(sc+.5),dy=fy-(sr+.5);
    if(Math.hypot(dx,dy)<.35)return start;
    const ang=Math.round(Math.atan2(dy,dx)/(Math.PI/4))*(Math.PI/4);
    const ux=Math.round(Math.cos(ang)),uy=Math.round(Math.sin(ang));
    let len=(ux&&uy)?Math.round((Math.abs(dx)+Math.abs(dy))/2):Math.round(Math.abs(ux?dx:dy));
    let r=sr,c=sc;
    for(let i=0;i<len;i++){const nr=r+uy,nc=c+ux;if(nr<0||nr>=N||nc<0||nc>=N)break;r=nr;c=nc}
    return r*N+c;
  }
  function pathOf(a,b){
    const ar=Math.floor(a/N),ac=a%N,br=Math.floor(b/N),bc=b%N;
    const len=Math.max(Math.abs(br-ar),Math.abs(bc-ac));
    const ur=Math.sign(br-ar),uc=Math.sign(bc-ac),out=[];
    for(let i=0;i<=len;i++)out.push((ar+ur*i)*N+ac+uc*i);
    return out;
  }
  gw.addEventListener("pointerdown",e=>{
    if(view.name!=="puzzle"||found.size===P.words.length)return;
    const {fx,fy}=cellAt(e.clientX,e.clientY);
    const r=Math.floor(fy),c=Math.floor(fx);
    if(r<0||r>=N||c<0||c>=N)return;
    e.preventDefault();ptr=e.pointerId;gw.setPointerCapture(ptr);
    start=cur=r*N+c;
    preview=line(start,start,"#2397b2",".7");
  });
  gw.addEventListener("pointermove",e=>{
    if(ptr!==e.pointerId||start<0)return;
    const {fx,fy}=cellAt(e.clientX,e.clientY);
    cur=snap(Math.floor(start/N),start%N,fx,fy);
    preview.setAttribute("x2",cur%N+.5);preview.setAttribute("y2",Math.floor(cur/N)+.5);
  });
  function finish(e){
    if(ptr!==e.pointerId||start<0)return;
    try{gw.releasePointerCapture(ptr)}catch(_){}
    const p=pathOf(start,cur),s=p.map(i=>P.letters[i]).join(""),rs=[...s].reverse().join("");
    const hit=P.words.find(w=>!found.has(w)&&(w===s||w===rs));
    if(preview){preview.remove();preview=null}
    if(hit){
      const ci=colorIdx++%PAL.length,color=PAL[ci];
      line(p[0],p[p.length-1],color,".85");
      found.set(hit,color);wEls[hit].classList.add("f");foundList.push([hit,ci]);
      if(found.size===P.words.length)complete();else saveCur();
    }
    start=cur=-1;ptr=null;
  }
  gw.addEventListener("pointerup",finish);
  gw.addEventListener("pointercancel",finish);
  gw.addEventListener("contextmenu",e=>e.preventDefault());

  function complete(){
    markDone(c.name,id);
    const full=roundOf(c.name)>R;
    const d=el("div","card done-card");d.appendChild(el("h2","",full?"All "+PER+" finished!":"Puzzle complete"));
    if(full)d.appendChild(el("p","",c.name+" set "+(R+1)+" is complete. A fresh set of "+PER+" puzzles with new word mixes is ready."));
    const row=el("div","acts");
    if(full){const nb=el("button","pill go","Start new set");nb.type="button";nb.addEventListener("click",()=>show({name:"nums",cat:view.cat}));row.appendChild(nb)}else if(n<PER){const nb=el("button","pill go","Next puzzle");nb.type="button";nb.addEventListener("click",()=>show({name:"puzzle",cat:view.cat,n:n+1}));row.appendChild(nb)}
    if(!full){const lb=el("button","pill","All puzzles");lb.type="button";lb.addEventListener("click",()=>show({name:"nums",cat:view.cat}));row.appendChild(lb)}
    d.appendChild(row);doneHost.appendChild(d);hintBtn.disabled=true;
  }
}
window.__wsStart=render;GUP.onChange(()=>{if(view.name!=="puzzle")render()});
})();
INIT.wordsearch=()=>window.__wsStart();

window.addEventListener("hashchange",()=>show((location.hash||"").slice(1)));
show((location.hash||"").slice(1));

GUP.sync();
})();
