// Coordinates use a fixed stage so the scene scales identically on every phone.
const canvas = document.createElement('canvas');
canvas.width = 900;
canvas.height = 420;
canvas.className = 'arena';
canvas.setAttribute('aria-hidden', 'true');
const ctx = canvas.getContext('2d');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let frame, snapshot, shot, shotTime, lastId;

function box(x,y,w,h,color) {
  ctx.fillStyle=color;
  ctx.fillRect(x,y,w,h);
}
function oval(x,y,rx,ry,color) {
  ctx.beginPath();
  ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
  ctx.fillStyle=color;
  ctx.fill();
}
function line(x,y,x2,y2,width,color) {
  ctx.lineWidth=width;
  ctx.lineCap='round';
  ctx.strokeStyle=color;
  ctx.beginPath();
  ctx.moveTo(x,y);
  ctx.lineTo(x2,y2);
  ctx.stroke();
}
function rooftop() {
  const sky=ctx.createLinearGradient(0,0,0,360);
  sky.addColorStop(0,'#17182f');
  sky.addColorStop(1,'#a65268');
  box(0,0,900,420,sky);
  oval(687,70,37,37,'#ffe8af');
  for(let i=0;i<53;i++) oval((i*139)%900,(i*43)%157,1.3,1.3,'#f9dbbc');
  for(let i=0;i<20;i++){
    const y=135+(i*37)%86;
    box(i*49,y,47,250-y,'#333047');
    box(i*49+7,y-9,22,10,'#333047');
    for(let j=0;j<5;j++) box(i*49+6+j%3*11,y+9+Math.floor(j/3)*19,4,8,j%3?'#cb916d':'#544458');
  }
  box(0,241,900,28,'#463249');
  box(0,239,900,5,'#c38279');
  box(0,269,900,151,'#31273a');
  for(let i=-4;i<8;i++) line(450+i*68,269,450+i*170,420,2,'#544055');
  for(const y of [288,324,378]) box(0,y,900,2,'#554156');
  ctx.beginPath();ctx.moveTo(0,10);ctx.quadraticCurveTo(450,115,900,5);ctx.strokeStyle='#251e32';ctx.lineWidth=3;ctx.stroke();
  for(let i=0;i<14;i++){
    const u=(i+.5)/14,y=(1-u)**2*10+2*u*(1-u)*115+u*u*5;
    line(u*900,y,u*900,y+6,2,'#241e30');oval(u*900,y+9,4,6,i%2?'#ffcc7c':'#87dac9');
  }
}
const ink='#201c30';
function actor(index,x,side,pose,time) {
  const tint='hsl('+((155+47*index)%360)+' 45% 60%)';
  const bob=motion.matches?0:Math.sin(time/360+index)*2;
  oval(x,311,55,9,'#1e1929');
  ctx.save();ctx.translate(x,305);ctx.scale(side,1);
  line(-16,-46,-21,-6,16,ink);line(16,-46,21,-6,16,ink);
  box(-33,-9,28,10,'#eac698');box(12,-9,28,10,'#eac698');
  ctx.translate(0,bob);ctx.rotate(pose.hit*.16-pose.kick*.07);
  oval(0,-69,36,44,ink);oval(0,-70,31,38,tint);
  box(-27,-57,55,9,'#eec67d');
  line(-22,-89,-32,-62,13,ink);oval(-32,-60,8,8,'#f2bc91');
  oval(2,-127,37,39,ink);oval(2,-127,32,34,'#edb88e');
  oval(-2,-149,35,19,tint);box(-33,-149,76,9,ink);
  box(-12,-135,46,13,ink);box(19,-132,7,4,'#a4efe1');
  line(11,-113,23,-114,3,ink);
  if(pose.weapon){
    ctx.save();ctx.translate(20,-87);ctx.rotate(pose.self?-2.45: .58-pose.aim*.58);
    ctx.translate(-pose.kick*10,0);
    line(0,0,29,0,15,tint);box(27,-15,57,17,ink);box(42,-13,37,7,'#7acac2');
    box(32,-2,12,17,'#ab7355');oval(30,1,9,9,'#f2bc91');
    if(pose.flash){ctx.fillStyle='#fff1a5';ctx.beginPath();ctx.moveTo(83,-8);ctx.lineTo(105,-22);ctx.lineTo(100,-12);ctx.lineTo(128,-8);ctx.lineTo(102,-4);ctx.lineTo(108,6);ctx.closePath();ctx.fill();}
    ctx.restore();
  }else line(21,-88,31,-67,13,tint);
  ctx.restore();
}
function draw(time) {
  if(!canvas.isConnected)return;
  const age=time-shotTime;
  const firing=shot && age<1150;
  const from=firing?shot.me:snapshot.turn;
  const to=firing?shot.target:snapshot.players.findIndex((p,i)=>i!==from && p.hp);
  const self=from===to;
  const moving=!motion.matches;
  const kick=firing&&moving?Math.max(0,1-Math.abs(age-455)/110):0;
  const hit=firing&&shot.live&&moving?Math.max(0,1-Math.abs(age-575)/140):0;
  rooftop();
  actor(from,self?450:215,1,{weapon:true,self,aim:firing?Math.min(1,age/300):0,kick,hit:self?hit:0,flash:firing&&shot.live&&moving&&age>420&&age<500},time);
  if(!self&&to>=0) actor(to,685,-1,{hit},time);
  if(firing&&!self&&moving&&shot.live&&age>=452&&age<555){
    const x=310+(age-452)*3.55;
    line(x-27,213,x,213,5,'#ffdb86');
  }
  if(firing&&!shot.live&&age>415&&age<900){
    for(let i=0;i<3;i++) oval((self?405:310)+i*6,201-(moving?(age-415)/20:0)-i*4,3+i,3+i,'#cbc0cb');
  }
  ctx.textAlign='center';ctx.font='bold 21px system-ui';
  const seats=self?[[from,450]]:[[from,215],[to,685]];
  for(const [i,x] of seats)if(i>=0){
    ctx.fillStyle='#fff0d4';ctx.fillText(snapshot.players[i].name,x,353,225);
  }
  frame=requestAnimationFrame(draw);
}
export function showArena(container,state,previous) {
  cancelAnimationFrame(frame);
  snapshot=state;
  if(!previous || previous.code!==state.code || !state.last){shot=null;lastId=null;}
  if(state.last && lastId!==state.last.id){
    lastId=state.last.id;
    if(previous){shot=state.last;shotTime=performance.now();}
  }
  container.prepend(canvas);
  frame=requestAnimationFrame(draw);
}
