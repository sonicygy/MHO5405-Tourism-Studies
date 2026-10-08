(function(){
 'use strict';
 const E=ParkEngine,U=ParkUI,$=id=>document.getElementById(id),KEY='thei-attraction-lab-v1';
 let state={version:1,group:'',id:'',rounds:[],event:'rain',plan:{...E.DEFAULT},prediction:'',reason:'',review:'',done:false,lang:'bi'};
 const saved=U.read(KEY,null);
 try{
  if(saved&&saved.version===1&&typeof saved.group==='string'&&saved.group.length<=80&&Array.isArray(saved.rounds)&&saved.rounds.length<=3){
   saved.plan=E.validatePlan(saved.plan);
   if(!['rain','residents','access'].includes(saved.event))throw Error();
   for(const [i,r] of saved.rounds.entries()){
    if(r.event!==(i===0?'normal':i===1?'peak':saved.event)||!['prediction','reason','review'].every(k=>typeof r[k]==='string'&&r[k].length<=1200))throw Error();
    r.plan=E.validatePlan(r.plan);r.result=compact(E.run(r.plan,r.event));
   }
   for(const k of ['prediction','reason','review'])if(typeof saved[k]!=='string'||saved[k].length>1200)throw Error();
   state={...state,...saved};
  }
 }catch{$('storage-warning').hidden=false;$('storage-warning').textContent='Saved progress could not be restored. Please start a new group.';}
 let sim=null,result=null,timer=null,paused=false;
 const event=()=>state.rounds.length===0?'normal':state.rounds.length===1?'peak':state.event;
 function compact(r){const x={...r};for(const k of ['trace','queuedVisitors','groups','gardenVisitors'])delete x[k];return x;}
 function persist(){if(!U.write(KEY,state)){$('storage-warning').hidden=false;$('storage-warning').innerHTML=U.t('storageWarning');}}
 function readPlan(){const p={};for(const k of ['guides','groupSize','interval','booking','redirect'])p[k]=Number($(k).value);for(const k of ['offpath','accessible'])p[k]=$(k).checked;return E.validatePlan(p);}
 function setPlan(p){for(const k of ['guides','groupSize','interval','booking','redirect'])$(k).value=p[k];for(const k of ['offpath','accessible'])$(k).checked=p[k];}
 function renderLanguage(){U.setLanguage(state.lang);U.notes($('model-notes'));if(state.rounds.length===3)renderSummary();else if(state.group)renderRound(false);}
 function planDescription(p){return U.t('guides')+': '+p.guides+' · '+U.t('batch')+': '+p.groupSize+' · '+U.t('interval')+': '+p.interval+'<br>'+U.t('booking')+': '+(p.booking||U.text('noBooking'))+' · '+U.t('redirect')+': '+p.redirect+'%<br>'+U.t('offpath')+': '+U.t(p.offpath?'yes':'no')+'<br>'+U.t('accessible')+': '+U.t(p.accessible?'yes':'no');}
 function renderRound(reset=true){
  $('welcome').hidden=true;$('game').hidden=false;$('summary').hidden=true;
  const n=state.rounds.length,ev=event();
  $('group-display').textContent=U.text('group')+' · '+state.group;
  $('round-title').innerHTML=U.pair('第 '+(n+1)+' 輪','Round '+(n+1));
  $('round-track').innerHTML=['r1','r2','r3'].map((k,i)=>'<div class="round-step '+(i===n?'current':i<n?'done':'')+'">0'+(i+1)+' · '+U.t(k)+'</div>').join('');
  $('scenario-tag').innerHTML=U.t('fictional');$('scenario-title').innerHTML=U.t(ev);$('scenario-description').innerHTML=U.t(ev+'Desc');$('demand').textContent=ev==='normal'?60:84;
  $('prediction').value=state.prediction;$('reason').value=state.reason;$('review').value=state.review;
  $('save-round').innerHTML=U.t(n<2?'saveNext':'saveFinish');
  for(const [id,k] of [['label-craft','craft'],['label-garden','garden'],['label-entry','entry'],['label-neighbours','neighbours'],['label-path','path']])$(id).textContent=U.lang==='en'?U.D[k][1]:U.D[k][0];
  if(reset){stop();sim=E.create(state.plan,ev);result=state.done?E.run(state.plan,ev):null;}
  setPlan(state.plan);renderCalculation();
  if(state.done)renderSnapshot(result||E.run(state.plan,ev));else renderSnapshot(sim?sim.snapshot():E.create(state.plan,ev).snapshot());
  $('reflection-area').hidden=!state.done;$('retry').hidden=!state.done;$('plan-fields').disabled=state.done||!!timer||paused;
  $('run').disabled=state.done||!!timer||paused;$('instant').disabled=state.done;
  $('pause').disabled=!timer&&!paused;$('pause').innerHTML=U.t(paused?'resume':'pause');
  $('feedback').innerHTML=state.done?feedback(result||E.run(state.plan,ev)):'';
 }
 function renderCalculation(){
  const r=E.create(state.plan,event()).snapshot(),late=E.conditions(event(),60,state.plan);
  const later=E.run(state.plan,event()).theoreticalRate;
  $('calculation').innerHTML=U.t('forecast')+'<br><b>'+r.theoreticalRate+'</b> '+U.t('peopleHour')+(event()==='normal'||event()==='peak'?'':'<br>'+U.t('afterEvent')+': <b>'+later+'</b> '+U.t('peopleHour'))+'<br>'+U.t('planCost')+': <b>HK$'+r.cost+'</b>';
 }
 function renderSnapshot(r){
  $('clock').textContent=String(Math.floor(r.minute/60)).padStart(2,'0')+':'+String(r.minute%60).padStart(2,'0');
  $('offpath-area').hidden=!state.plan.offpath;$('rain-overlay').hidden=!(r.event==='rain'&&r.eventActive);
  const svg=[];
  const dot=(x,y,color,id)=>'<circle class="visitor" cx="'+x+'" cy="'+y+'" r="4.5" fill="'+color+'"><title>'+id+'</title></circle>';
  const queue=r.queuedVisitors||[];
  queue.forEach((p,i)=>{const x=state.plan.offpath?202+(i%20)*10:120+(i%30)*9,y=state.plan.offpath?173+Math.floor(i/20)*17:236+Math.floor(i/30)*17;svg.push(dot(x,y,'#cf8253',p.id));});
  let j=0;for(const g of r.groups||[])for(let i=0;i<g.size;i++){svg.push(dot(247+(j%11)*10,195+Math.floor(j/11)*10,'#23796b','Guide '+(g.guide+1)));j++;}
  (r.gardenVisitors||[]).forEach((p,i)=>svg.push(dot(464+(i%10)*11,189+Math.floor(i/10)*12,'#9a9f49',p.id)));
  if(r.minute>0&&r.minute<120)for(let i=0;i<4;i++)svg.push(dot(40+((r.minute*7+i*30)%95),242,'#6889a0','Arriving'));
  $('visitor-dots').innerHTML=svg.join('');
  $('event-status').innerHTML=state.done?U.t('simulationDone'):(r.event==='normal'||r.event==='peak')?U.t('normalStatus'):r.eventActive?U.t(r.event):U.t('eventPending');
  $('event-status').style.borderLeftColor=r.eventActive?'#d8784b':'#23796b';
  const items=[['startExperience',r.started],['inQueue',r.queue],['deferred',r.deferred],['diverted',r.diverted],['waiting',r.meanWait],['spill',r.spillMinutes],['completed',r.completed],['cost',r.cost]];
  if(r.event==='access')items.push(['accessUnserved',r.accessUnserved]);
  $('metrics').innerHTML=items.map(([k,v])=>'<div class="metric '+((k==='spill'||k==='accessUnserved')&&v>0?'warn':'')+'"><b>'+v+'</b><span class="metric-label">'+U.t(k)+'</span></div>').join('');
  $('queue-caption').textContent=U.text('oldest')+': '+r.oldestWait+' min';
  drawChart(r);
 }
 function drawChart(r){
  const trace=r.trace||[],max=Math.max(24,...trace.map(x=>x.queue)),W=558,H=112,x=t=>44+t/120*W,y=q=>125-q/max*H;
  const points=['44,125',...trace.map(d=>x(d.minute)+','+y(d.queue))].join(' ');
  let lines='';for(let i=0;i<=2;i++){const q=Math.round(max*i/2);lines+='<path d="M44 '+y(q)+' H602" stroke="#dde2d8"/><text x="34" y="'+(y(q)+4)+'" text-anchor="end" fill="#66746b" font-size="11">'+q+'</text>';}
  $('queue-chart').innerHTML=lines+'<polygon points="'+points+' '+x(r.minute)+',125" fill="#f0d7bc" opacity=".7"/><polyline points="'+points+'" fill="none" stroke="#c8824e" stroke-width="2.5"/>'+([0,30,60,90,120].map(t=>'<text x="'+x(t)+'" y="148" text-anchor="middle" fill="#66746b" font-size="11">'+t+' min</text>').join(''))+(r.event==='normal'||r.event==='peak'?'':'<path d="M'+x(45)+' 10 V125" stroke="#729b8d" stroke-dasharray="4 4"/>');
 }
 function feedback(r){
  const lines=[];
  if(r.queue)lines.push(U.pair(r.queue+'人仍在隊列中；最久已等'+r.oldestWait+'分鐘。',r.queue+' visitors are still queued; the longest current wait is '+r.oldestWait+' minutes.'));
  if(r.deferred)lines.push(U.pair('預約讓'+r.deferred+'人改期；請為這些未滿足需求安排資訊與替代方案。','Booking defers '+r.deferred+' visitors. Provide information and options for this unmet demand.'));
  if(r.spillMinutes)lines.push(U.pair('隊列有'+r.spillMinutes+'分鐘超出約定门檻；說明誰會監察、何時介入。','The queue exceeds the agreed limit for '+r.spillMinutes+' minutes. Explain who monitors and when to intervene.'));
  if(r.accessUnserved)lines.push(U.pair(r.accessUnserved+'位有無障礙需求的訪客未獲服務。請檢討路線與協助安排。',r.accessUnserved+' visitors with accessibility needs are unserved. Review the route and assistance.'));
  if(!lines.length)lines.push(U.pair('隊列控制良好。還要驗證預約接受程度、需求來源、成本與服務質素。','The queue is controlled. Verify booking acceptance, demand evidence, costs and experience quality.'));
  return lines.map(x=>'<p>'+x+'</p>').join('');
 }
 function stop(){if(timer)clearInterval(timer);timer=null;paused=false;}
 function begin(){
  if(!$('prediction').value.trim()){$('feedback').innerHTML=U.t('predictionRequired');$('prediction').focus();return false;}
  state.plan=readPlan();state.prediction=$('prediction').value.trim();state.done=false;persist();
  sim=E.create(state.plan,event());$('plan-fields').disabled=true;$('baseline').disabled=true;$('run').disabled=true;$('instant').disabled=false;$('pause').disabled=false;$('reflection-area').hidden=true;$('feedback').textContent='';
  return true;
 }
 function play(){timer=setInterval(()=>{result=sim.step();renderSnapshot(result);if(result.minute===120)finish();},Number($('speed').value));}
 function finish(){stop();state.done=true;persist();$('baseline').disabled=false;$('pause').disabled=true;$('instant').disabled=true;$('reflection-area').hidden=false;$('retry').hidden=false;$('plan-fields').disabled=true;renderSnapshot(result);$('feedback').innerHTML=feedback(result);}
 function renderSummary(){
  stop();$('welcome').hidden=true;$('game').hidden=true;$('summary').hidden=false;
  $('summary-group').textContent=U.text('group')+': '+state.group;
  $('report-cards').innerHTML=state.rounds.map((r,i)=>{const m=r.result;return '<article class="card report-card"><span class="eyebrow">ROUND 0'+(i+1)+'</span><h2>'+U.t(r.event)+'</h2><div class="report-stats">'+[['startExperience',m.started],['inQueue',m.queue],['deferred',m.deferred],['diverted',m.diverted],['spill',m.spillMinutes],['cost',m.cost]].map(([k,v])=>'<div><b>'+v+'</b><span>'+U.t(k)+'</span></div>').join('')+'</div><p>'+planDescription(r.plan)+'</p><p><b>'+U.t('prediction')+'</b><br>'+U.esc(r.prediction)+'</p><p><b>'+U.t('rationale')+'</b><br>'+U.esc(r.reason)+'</p><p><b>'+U.t('action')+'</b><br>'+U.esc(r.review)+'</p>'+ (m.accessUnserved?'<p>'+U.t('accessUnserved')+': '+m.accessUnserved+'</p>':'')+'</article>';}).join('');
 }
 function report(){return {version:1,id:state.id,group:state.group,createdAt:state.createdAt,rounds:state.rounds.map(r=>({...r,result:compact(r.result)}))};}
 async function reset(){if(!await U.confirmDialog('resetTitle','resetText','confirm'))return;stop();state={version:1,group:'',id:'',rounds:[],event:'rain',plan:{...E.DEFAULT},prediction:'',reason:'',review:'',done:false,lang:U.lang};persist();$('welcome').hidden=false;$('game').hidden=true;$('summary').hidden=true;$('group-name').value='';window.scrollTo({top:0,behavior:'smooth'});}
 $('start-form').addEventListener('submit',e=>{e.preventDefault();const name=$('group-name').value.trim();if(!name){$('group-name').focus();return;}state.group=name;state.id=crypto.randomUUID?crypto.randomUUID():'group-'+Date.now()+'-'+Math.random().toString(36).slice(2);state.createdAt=new Date().toISOString();state.event=E.eventFor(name);persist();renderRound();window.scrollTo({top:0});});
 document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{state.lang=b.dataset.lang;persist();renderLanguage();}));
 $('plan-form').addEventListener('submit',e=>e.preventDefault());
 $('plan-fields').addEventListener('change',()=>{state.plan=readPlan();state.prediction=$('prediction').value;persist();renderCalculation();if(!state.done&&!timer&&!paused){sim=E.create(state.plan,event());renderSnapshot(sim.snapshot());}});
 for(const k of ['prediction','reason','review'])$(k).addEventListener('input',()=>{state[k]=$(k).value;persist();});
 $('baseline').addEventListener('click',()=>{if(timer||paused)return;state.plan={...E.DEFAULT};state.done=false;persist();renderRound();});
 $('run').addEventListener('click',()=>{if(begin())play();});
 $('instant').addEventListener('click',()=>{if(!sim||(!timer&&!paused&&!state.done)){if(!begin())return;}stop();while(sim.snapshot().minute<120)result=sim.step();finish();});
 $('pause').addEventListener('click',()=>{if(timer){clearInterval(timer);timer=null;paused=true;$('pause').innerHTML=U.t('resume');}else if(paused){paused=false;play();$('pause').innerHTML=U.t('pause');}});
 $('speed').addEventListener('change',()=>{if(timer){clearInterval(timer);play();}});
 $('retry').addEventListener('click',()=>{state.done=false;persist();renderRound();$('prediction').focus();});
 $('save-round').addEventListener('click',()=>{
  if(!state.done)return;
  if(!$('reason').value.trim()||!$('review').value.trim()){$('feedback').innerHTML=U.t('reflectionRequired');(!$('reason').value.trim()?$('reason'):$('review')).focus();return;}
  state.rounds.push({event:event(),plan:{...state.plan},prediction:state.prediction,reason:$('reason').value.trim(),review:$('review').value.trim(),result:compact(result||E.run(state.plan,event()))});
  state.prediction='';state.reason='';state.review='';state.done=false;persist();if(state.rounds.length===3)renderSummary();else renderRound();window.scrollTo({top:0,behavior:'smooth'});
 });
 for(const id of ['new-group','restart'])$(id).addEventListener('click',reset);
 $('download-json').addEventListener('click',()=>U.download('Attraction_Group_Record.json',JSON.stringify(report(),null,2),'application/json'));
 $('download-csv').addEventListener('click',()=>U.download('Attraction_Group_Comparison.csv',U.csv([U.csvHeader(),...state.rounds.map((r,i)=>U.row(report(),r,i))]),'text/csv;charset=utf-8'));
 $('share').addEventListener('click',async()=>{const r=report();r.rounds=r.rounds.map(({result,...rest})=>rest);const payload=U.encode(r);if(payload.length>20000){$('share-status').innerHTML=U.t('shareError');return;}const url=new URL('classroom.html',location.href);url.search='';url.hash='report='+payload;try{await navigator.clipboard.writeText(url.href);$('share-status').innerHTML=U.t('shareCopied');}catch{$('share-status').innerHTML=U.t('shareFallback')+'<br><input aria-label="Report link" readonly style="width:100%" value="'+U.esc(url.href)+'">';$('share-status').querySelector('input').select();}});
 $('print').addEventListener('click',()=>window.print());
 renderLanguage();
 if(state.group){if(state.rounds.length===3)renderSummary();else renderRound();}
 window.ParkApp={get report(){return report();},get state(){return state;}};
})();
