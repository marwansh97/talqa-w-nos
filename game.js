import {randomInt, randomBytes} from 'node:crypto';
const rooms = new Map();
function requireRule(ok, error) { if (!ok) throw Error(error); }
function reload(r) {
  r.shells = [true,false,false];
  if (r.round++) r.shells.push(true,true,false);
  for(let i=r.shells.length-1;i>0;i--) {
    const j=randomInt(i+1);
    [r.shells[i],r.shells[j]]=[r.shells[j],r.shells[i]];
  }
  r.boost=false;
  for(const p of r.players) { p.tools=['lens','flip','double']; p.peek=null; }
}
function advance(r) {
  do {r.turn=(r.turn+1)%r.players.length;} while(!r.players[r.turn].hp);
  r.deadline=Date.now()+45000;
}
export function request(b) {
  let r=rooms.get(b.code);
  if(b.action==='create') {
    requireRule(typeof b.name==='string' && b.name.trim(),'name');
    let code; do {code=randomBytes(3).toString('hex').toUpperCase();} while(rooms.has(code));
    r={code,players:[],phase:'lobby',turn:0,round:0,rev:0,shells:[],updated:Date.now()};
    rooms.set(code,r);
  }
  requireRule(r,'missing');
  let p=r.players.find(p=>p.token===b.token);
  if(['create','join'].includes(b.action)) {
    requireRule(r.phase==='lobby' && r.players.length<10,'closed');
    requireRule(typeof b.name==='string' && b.name.trim(),'name');
    p={name:b.name.trim().slice(0,24),token:randomBytes(24).toString('hex'),hp:5,tools:[],peek:null};
    r.players.push(p); r.rev++;
  }
  requireRule(p,'missing');
  if(r.phase==='play' && Date.now()>r.deadline) {advance(r); r.rev++;}
  const me=r.players.indexOf(p);
  if(b.action==='start') {
    requireRule(me===0 && r.players.length>=2 && r.phase!=='play','wait');
    r.phase='play';r.turn=0;r.round=0;r.last=null;
    for(const player of r.players) player.hp=5;
    reload(r);r.rev++;r.deadline=Date.now()+45000;
  }
  if(['shoot','lens','flip','double'].includes(b.action)) {
    requireRule(r.phase==='play' && me===r.turn && b.rev===r.rev,'wait');
    if(b.action==='shoot') {
      const target=r.players[b.target];
      requireRule(Number.isInteger(b.target) && target?.hp>0,'wait');
      const live=r.shells.shift();
      if(live) target.hp=Math.max(0,target.hp-(r.boost?2:1));
      r.last={me,target:b.target,live};r.boost=false;
      for(const player of r.players) player.peek=null;
      if(r.players.filter(x=>x.hp).length===1) r.phase='done';
      else {
        if(live || target!==p) advance(r);
        r.deadline=Date.now()+45000;
        if(!r.shells.length) reload(r);
      }
    } else {
      requireRule(p.tools.includes(b.action),'wait');
      p.tools=p.tools.filter(t=>t!==b.action);
      if(b.action==='lens') p.peek=r.shells[0];
      if(b.action==='flip') {
        r.shells[0]=!r.shells[0];
        for(const player of r.players) if(player.peek!==null) player.peek=!player.peek;
      }
      if(b.action==='double') r.boost=true;
    }
    r.rev++;
  }
  r.updated=Date.now();
  return {code:r.code,rev:r.rev,phase:r.phase,turn:r.turn,round:r.round,deadline:r.deadline,boost:r.boost,last:r.last,
    live:r.shells.filter(Boolean).length,blank:r.shells.filter(x=>!x).length,
    players:r.players.map(({name,hp})=>({name,hp})),me,token:p.token,tools:p.tools,peek:p.peek};
}
setInterval(()=>{for(const [key,r] of rooms) if(Date.now()-r.updated>7200000) rooms.delete(key);},60000).unref();
