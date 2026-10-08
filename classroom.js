(function(){
 'use strict';
 const E=ParkEngine,U=ParkUI,$=id=>document.getElementById(id),KEY='thei-attraction-teacher-v1',URL='https://sonicygy.github.io/MHO5405-Tourism-Studies/';
 let reports=[];
 const saved=U.read(KEY,[]);
 if(Array.isArray(saved)){for(const r of saved.slice(0,100)){try{reports.push(E.validateReport(r));}catch{}}}
 let lang=U.read('thei-attraction-teacher-language','bi');
 function save(){if(!U.write(KEY,reports))$('import-message').innerHTML=U.t('storageWarning');}
 function add(r){r=E.validateReport(r);const i=reports.findIndex(x=>x.id===r.id);if(i<0){if(reports.length>=100)throw Error('Limit: 100 reports');reports.push(r);}else reports[i]=r;}
 function render(){
  U.setLanguage(lang);U.notes($('model-notes'));const n=Number($('round-filter').value);
  const heads=['group','event','startExperience','inQueue','deferred','diverted','waiting','spill','accessUnserved','cost'];
  $('table-head').innerHTML=heads.map(k=>'<th scope="col">'+U.t(k)+'</th>').join('');
  $('table-body').innerHTML=reports.length?reports.map(r=>{const x=r.rounds[n],m=x.result;return '<tr><td>'+U.esc(r.group)+'</td><td>'+U.t(x.event)+'</td>'+[m.started,m.queue,m.deferred,m.diverted,m.meanWait,m.spillMinutes,m.accessUnserved,'HK$'+m.cost].map(v=>'<td>'+v+'</td>').join('')+'</tr>';}).join(''):'<tr><td colspan="10" class="empty">'+U.t('empty')+'</td></tr>';
  $('teacher-list').innerHTML=reports.map((r,index)=>'<details class="card teacher-report"><summary>'+U.esc(r.group)+' · '+U.t('details')+'</summary>'+r.rounds.map((x,i)=>'<div><h3 style="margin-top:22px">0'+(i+1)+' · '+U.t(x.event)+'</h3><p>'+describe(x.plan)+'</p><p><b>'+U.t('prediction')+'</b><br>'+U.esc(x.prediction)+'</p><p><b>'+U.t('rationale')+'</b><br>'+U.esc(x.reason)+'</p><p><b>'+U.t('action')+'</b><br>'+U.esc(x.review)+'</p></div>').join('')+'<button class="subtle delete" data-remove="'+index+'">'+U.t('remove')+'</button></details>').join('');
 }
 function describe(p){return U.text('guides')+': '+p.guides+' · '+U.text('batch')+': '+p.groupSize+' · '+U.text('interval')+': '+p.interval+' · '+U.text('booking')+': '+p.booking+' · '+U.text('redirect')+': '+p.redirect+'%<br>'+U.t('offpath')+': '+U.t(p.offpath?'yes':'no')+'<br>'+U.t('accessible')+': '+U.t(p.accessible?'yes':'no');}
 document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{lang=b.dataset.lang;U.write('thei-attraction-teacher-language',lang);render();}));
 $('round-filter').addEventListener('change',render);
 $('import-file').addEventListener('change',async()=>{
  const pending=[];
  try{
   for(const f of $('import-file').files){if(f.size>300000)throw Error('Too large');pending.push(E.validateReport(JSON.parse(await f.text())));}
   const additional=pending.filter(p=>!reports.some(r=>r.id===p.id));if(reports.length+additional.length>100)throw Error('Limit');
   for(const r of pending)add(r);save();render();$('import-message').innerHTML=U.t('importOK');
  }catch{$('import-message').innerHTML=U.t('importError');}
  $('import-file').value='';
 });
 $('examples').addEventListener('click',()=>{
  const plans=[{...E.DEFAULT},{...E.DEFAULT,guides:2,booking:72,offpath:true},{...E.DEFAULT,guides:2,booking:48,redirect:25,offpath:true,accessible:true}];
  plans.forEach((p,i)=>add({version:1,id:'demo-'+i,group:['示例 DEMO A · Walk-in','示例 DEMO B · Booking','示例 DEMO C · Inclusion'][i],createdAt:'Teaching example',rounds:['normal','peak','rain'].map(ev=>({event:ev,plan:p,prediction:'Fictional teaching example / 虛構教學示例',reason:'Compare demand, resources and stakeholder trade-offs / 比較需求、資源和利益相關者取捨。',review:'Verify arrivals, space, accessibility and community agreement / 驗證客流、空間、無障礙與社區協商。'}))}));
  save();render();$('import-message').innerHTML=U.t('examplesNotice');
 });
 $('export-csv').addEventListener('click',()=>{if(!reports.length){$('import-message').innerHTML=U.t('downloadEmpty');return;}U.download('Attraction_Classroom_Comparison.csv',U.csv([U.csvHeader(),...reports.flatMap(r=>r.rounds.map((x,i)=>U.row(r,x,i)))]),'text/csv;charset=utf-8');});
 $('clear').addEventListener('click',async()=>{if(await U.confirmDialog('clearTitle','clearText','clearConfirm')){reports=[];save();render();$('import-message').textContent='';}});
 $('teacher-list').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(b){reports.splice(Number(b.dataset.remove),1);save();render();}});
 render();
 try{const fragment=new URLSearchParams(location.hash.slice(1));if(fragment.has('report')){add(U.decode(fragment.get('report')));save();render();$('import-message').innerHTML=U.t('importOK');history.replaceState(null,'',location.pathname+location.search);}}catch{$('import-message').innerHTML=U.t('importError');}
 new QRCode($('qr'),{text:URL,width:210,height:210,colorDark:'#153b36',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
 window.ParkClassroom={get reports(){return reports;}};
})();
