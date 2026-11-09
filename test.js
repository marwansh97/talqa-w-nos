import assert from 'node:assert/strict';
import {request} from './game.js';
let s=request({action:'create',name:'Host'});
const code=s.code, seats=[s.token];
for(let i=1;i<10;i++) seats.push(request({action:'join',code,name:'لاعب '+i}).token);
assert.throws(()=>request({action:'join',code,name:'Extra'}),/closed/);
const act=(action,extra={})=>request({code,action,rev:s.rev,token:seats[s.turn],...extra});
s=act('start');
s=act('lens');const shell=s.peek;
s=act('flip');assert.equal(s.peek,!shell);
s=act('double');assert.equal(s.boost,true);
for(let i=0;s.phase==='play' && i<5000;i++){
 const target=s.players.findIndex((p,n)=>p.hp&&n!==s.turn);
 s=act('shoot',{target});
}
assert.equal(s.phase,'done');
for(const token of seats)assert.deepEqual(request({code,token,action:'state'}).players,s.players);
console.log('Ten seats, capacity, tools, elimination and shared final standings passed.');
