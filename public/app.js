import {showArena} from './arena.js';
const screen=document.querySelector('#screen'), msg=document.querySelector('#msg');
let ar=localStorage.language==='ar', state, busy=false;
let session=JSON.parse(sessionStorage.room||'null');
const t=(en,eg)=>ar?eg:en;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const button=(action,label,extra='')=>'<button data-action="'+action+'" '+extra+'>'+label+'</button>';
const tools=()=>({lens:t('Lens · reveal shell','العدسة · اكشف الطلقة'),flip:t('Flip shell','اقلب الطلقة'),double:t('Double damage','ضاعف الضرر')});
function render(previous=state){
 document.documentElement.lang=ar?'ar-EG':'en';document.documentElement.dir=ar?'rtl':'ltr';
 document.querySelector('#lang').textContent=ar?'English':'مصري';
 if(!state){
 screen.innerHTML='<h2>'+t('Play with friends','العب مع صحابك')+'</h2><p>'+t('2–10 players · One phone each','من ٢ لـ ١٠ لاعيبة · كل واحد بموبايله')+'</p><label>'+t('Your name','اسمك')+'<input id="name" maxlength="24" autocomplete="nickname"></label>'+button('create',t('Create room','اعمل أوضة'))+'<hr><label>'+t('Room code','كود الأوضة')+'<input id="code" maxlength="6" dir="ltr"></label>'+button('join',t('Join room','ادخل الأوضة'),'class="alt"')+'<details><summary>'+t('How to play','إزاي تلعب')+'</summary><p>'+t('Everyone starts with five hearts. The shell counts are public but the order is hidden. Choose yourself or a rival. A live shell costs the target a heart. A blank on yourself earns another turn. Use each tool once per load. Last player standing wins.','كل واحد بيبدأ بخمس قلوب. عارفين عدد الطلقات الحي والفشنك بس ترتيبها سر. اختار نفسك أو لاعب تاني. الحي بيخصم قلب، ولو ضربت نفسك بفشنك دورك بيكمل. كل أداة مرة في التعميرة. آخر واحد فاضل بيكسب.')+'</p></details>';
 document.querySelector('#name').value=localStorage.playerName||'';
 document.querySelector('#code').value=new URLSearchParams(location.search).get('room')||'';return;
 }
 const s=state,active=s.phase==='play',mine=s.me===s.turn;
 let html='<small>'+t('ROOM','الأوضة')+' <b class="code">'+esc(s.code)+'</b></small>';
 if(s.phase==='lobby') html+='<h2>'+t('Gather your crew','لمّ الشلة')+'</h2>'+button('invite',t('Copy invite link','انسخ لينك الدعوة'),'class="alt"');
 if(active){
 const slots=Number(s.live)+Number(s.blank);
 html+='<div class="drum" aria-hidden="true"><span>✦</span>'+Array.from({length:6},(_,i)=>'<i class="'+(i<slots?'loaded':'spent')+'" style="--i:'+i+'"></i>').join('')+'</div>';
 html+='<h2>'+(mine?t('Your turn','دورك'):esc(s.players[s.turn].name)+' · '+t('playing','بيلعب'))+'</h2><p>'+t('Load','تعميرة')+' '+s.round+' · '+s.live+' '+t('live','حي')+' / '+s.blank+' '+t('blank','فشنك')+(s.boost?' · ×2':'')+'</p>';
 if(s.last)html+='<p>'+esc(s.players[s.last.me].name)+' → '+esc(s.players[s.last.target].name)+' · '+(s.last.live?t('Live hit','طلقة حي'):t('Blank','فشنك'))+'</p>';
 if(mine){html+='<p>'+s.tools.map(tool=>button(tool,tools()[tool],'class="alt"')).join(' ')+'</p>';
 if(s.peek!==null)html+='<p>'+t('Lens reveals','العدسة كشفت')+' · '+(s.peek?t('Live','حي'):t('Blank','فشنك'))+'</p>';}
 }
 if(s.phase==='done')html+='<h2>'+esc(s.players.find(p=>p.hp).name)+' '+t('wins!','كسب!')+'</h2>';
 s.players.forEach((p,i)=>{html+='<div class="player '+(active&&i===s.turn?'current':'')+'" style="--h:'+((i*47+155)%360)+'"><span class="portrait" aria-hidden="true"><i></i></span>'+esc(p.name)+(i===s.me?t(' (you)',' (إنت)'):'')+' <span class="hp">'+(s.phase==='lobby'?'':('♥'.repeat(p.hp)||t('Out','خرج')))+'</span> '+(active&&mine&&p.hp?button('shoot',t('Fire','اضرب'),'data-target="'+i+'"'):'')+'</div>';});
 if(!active && s.me===0)html+=button('start',s.phase==='done'?t('Rematch','العب تاني'):t('Start match','ابدأ اللعب'),s.players.length<2?'disabled':'');
 screen.innerHTML=html;
 if(active || s.phase==='done') showArena(screen,s,previous);
 if(active && s.last){const reveal=screen.querySelector('h2 + p + p');if(reveal)reveal.classList.add('reveal');}
}
async function call(action,target){
 if(busy)return;busy=true;
 try{
 const payload={...session,action,target,rev:state?.rev};
 if(action==='create'||action==='join'){
 payload.name=document.querySelector('#name').value.trim();localStorage.playerName=payload.name;
 payload.code=document.querySelector('#code').value.trim().toUpperCase();
 }
 const response=await fetch('/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 const next=await response.json();
 if(!response.ok){
 if(next.error==='missing'&&session){session=null;state=null;delete sessionStorage.room;render();}
 throw Error(next.error);
 }
 const changed=state?.rev!==next.rev||!state;
 const previous=state;state=next;session={code:next.code,token:next.token};sessionStorage.room=JSON.stringify(session);
 if(changed)render(previous);msg.textContent='';
 }catch(e){msg.textContent=({missing:t('Room unavailable. Check the code.','الأوضة مش موجودة. راجع الكود.'),name:t('Enter your name first.','اكتب اسمك الأول.'),closed:t('Room full or already playing.','الأوضة مليانة أو اللعب بدأ.'),wait:t('Wait for your turn or refresh.','استنى دورك أو حدّث الصفحة.')})[e.message]||t('Connection interrupted. Try again.','الاتصال اتقطع. جرّب تاني.');}finally{busy=false;}
}
screen.onclick=async e=>{
 const b=e.target.closest('[data-action]');if(!b)return;
 if(b.dataset.action==='invite'){const link=new URL(location.href);link.searchParams.set('room',state.code);
 try{await navigator.clipboard.writeText(link.href);msg.textContent=t('Invite copied','اللينك اتنسخ');}catch{msg.textContent=link.href;}return;}
 call(b.dataset.action,b.dataset.target===undefined?undefined:Number(b.dataset.target));
};
document.querySelector('#lang').onclick=()=>{ar=!ar;localStorage.language=ar?'ar':'en';render();};
render();if(session)call('state');
setInterval(()=>{if(session)call('state');},1000);
