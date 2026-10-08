/* Original classroom model. Concept references and assumptions: SOURCES.md. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ParkEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const EVENTS = ['normal', 'peak', 'rain', 'residents', 'access'];
  const DEFAULT = Object.freeze({guides:1,groupSize:12,interval:20,booking:0,redirect:0,offpath:false,accessible:false});
  const allowed = {guides:[1,2,3],groupSize:[8,12,16],interval:[10,15,20,30],booking:[0,24,36,48,60,72,96],redirect:[0,25,50]};
  function validatePlan(p) {
    if (!p || typeof p !== 'object') throw new Error('Invalid plan');
    const out = {};
    for (const [k, values] of Object.entries(allowed)) {
      if (!values.includes(p[k])) throw new Error('Invalid '+k);
      out[k] = p[k];
    }
    for (const k of ['offpath','accessible']) {
      if (typeof p[k] !== 'boolean') throw new Error('Invalid '+k);
      out[k] = p[k];
    }
    return out;
  }
  function conditions(event, minute, plan) {
    const active = minute >= 45;
    return {
      rate:event==='normal'?60:84,
      space:event==='rain'&&active?12:24,
      groupLimit:event==='access'&&active&&plan.accessible?8:16,
      duration:event==='access'&&active&&plan.accessible?25:20,
      gardenOpen:!(event==='rain'&&active),
      queueLimit:plan.offpath?40:(event==='residents'&&active?6:12),
      accessRequired:event==='access'&&active
    };
  }
  function create(plan, event='normal') {
    plan=validatePlan(plan);
    if(!EVENTS.includes(event)) throw new Error('Invalid scenario');
    let minute=0, interested=0, admitted=0, deferred=0, diverted=0, accessUnserved=0, started=0, completed=0, waitTotal=0, maxQueue=0, spillMinutes=0, missedSlots=0;
    let queue=[],active=[],garden=[],history=[];
    function snapshot() {
      const c=conditions(event,minute,plan);
      const ongoing=active.reduce((n,g)=>n+g.people.length,0);
      const oldestWait=queue.length?minute-queue[0].arrival:0;
      const cost=plan.guides*180*2+(plan.offpath?160:0)+(plan.accessible?200:0)+(plan.booking?80:0)+(plan.redirect?60:0);
      return {minute,event,interested,admitted,deferred,diverted,accessUnserved,started,completed,ongoing,queue:queue.length,
        meanWait:started?Math.round(waitTotal/started*10)/10:0,oldestWait,maxQueue,spillMinutes,missedSlots,cost,
        gardenNow:garden.length,capacity:c.space,queueLimit:c.queueLimit,
        theoreticalRate:Math.round(Math.min(plan.guides*Math.min(plan.groupSize,c.groupLimit)*60/(Math.ceil(c.duration/plan.interval)*plan.interval),c.space*60/c.duration)*10)/10,
        eventActive:minute>=45&&event!=='normal'&&event!=='peak',
        trace:history.map(x=>({...x})),queuedVisitors:queue.slice(0,40).map(x=>({...x})),
        groups:active.map(x=>({end:x.end,size:x.people.length,guide:x.guide})),
        gardenVisitors:garden.slice(0,24).map(x=>({...x}))};
    }
    function step() {
      if(minute>=120) return snapshot();
      minute++;
      const c=conditions(event,minute,plan);
      const finishing=active.filter(g=>g.end<=minute);
      completed+=finishing.reduce((n,g)=>n+g.people.length,0);
      active=active.filter(g=>g.end>minute);
      garden=garden.filter(p=>p.end>minute);
      const arrivals=Math.floor(minute*c.rate/60)-Math.floor((minute-1)*c.rate/60);
      for(let i=0;i<arrivals;i++) {
        interested++;
        if(plan.booking && admitted>=Math.floor(minute*plan.booking/60)) {deferred++;continue;}
        admitted++;
        const p={id:interested,arrival:minute};
        if(c.accessRequired && !plan.accessible && admitted%5===0) {accessUnserved++;continue;}
        if(c.gardenOpen && plan.redirect && Math.floor(admitted*plan.redirect/100)>Math.floor((admitted-1)*plan.redirect/100)) {diverted++;garden.push({...p,end:minute+12});continue;}
        queue.push(p);
      }
      maxQueue=Math.max(maxQueue,queue.length);
      // A start window is an opportunity, subject to BOTH guide and site resources.
      if(minute%plan.interval===0) {
        for(let guide=0;guide<plan.guides;guide++) {
          if(active.some(g=>g.guide===guide)) continue;
          const free=c.space-active.reduce((n,g)=>n+g.people.length,0);
          const batch=Math.min(plan.groupSize,c.groupLimit,free,queue.length);
          if(batch<=0) {if(queue.length) missedSlots++;continue;}
          const people=queue.splice(0,batch);
          waitTotal+=people.reduce((n,p)=>n+minute-p.arrival,0);
          started+=people.length;
          active.push({guide,end:minute+c.duration,people});
        }
      }
      maxQueue=Math.max(maxQueue,queue.length);
      if(queue.length>c.queueLimit) spillMinutes++;
      history.push({minute,queue:queue.length,started,deferred,diverted,accessUnserved});
      return snapshot();
    }
    return {step,snapshot,plan,event};
  }
  function run(plan,event='normal') {const sim=create(plan,event);for(let i=0;i<120;i++)sim.step();return sim.snapshot();}
  function eventFor(name) {let n=0;for(const ch of name)n=(n*31+ch.codePointAt(0))>>>0;return ['rain','residents','access'][n%3];}
  function validateReport(r) {
    if(!r || r.version!==1 || typeof r.id!=='string' || r.id.length>100 || typeof r.group!=='string' || !r.group.trim() || r.group.length>80 || !Array.isArray(r.rounds) || r.rounds.length!==3) throw new Error('Invalid report');
    const rounds=r.rounds.map((x,i)=>{
      const expected=i===0?'normal':i===1?'peak':null;
      if(!x || (expected?x.event!==expected:!['rain','residents','access'].includes(x.event)))throw new Error('Invalid round');
      const plan=validatePlan(x.plan);
      for(const k of ['prediction','reason','review']) if(typeof x[k]!=='string'||x[k].length>1200)throw new Error('Invalid reflection');
      return {event:x.event,plan,prediction:x.prediction,reason:x.reason,review:x.review,result:run(plan,x.event)};
    });
    return {version:1,id:r.id,group:r.group.trim(),rounds,createdAt:typeof r.createdAt==='string'?r.createdAt.slice(0,40):''};
  }
  return {DEFAULT,EVENTS,validatePlan,conditions,create,run,eventFor,validateReport};
});
