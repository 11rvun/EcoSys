(() => {
  'use strict';
  const cfg=window.ECOSYS_CLOUD_CONFIG||{};
  const endpoint=(cfg.API_BASE_URL||'').trim().replace(/\/$/,'');
  const siteKey=(cfg.TURNSTILE_SITE_KEY||'').trim();
  const $=id=>document.getElementById(id);
  let survey=null,token='',widget=null,loading=false;
  const codeKey='ecosys-participant-code-v1';
  function code(){
    try {const old=localStorage.getItem(codeKey);if(/^EC-[A-Z0-9]{16}$/.test(old||''))return old;}catch{}
    const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=new Uint8Array(16);crypto.getRandomValues(bytes);
    const value='EC-'+Array.from(bytes,n=>chars[n%chars.length]).join('');
    try{localStorage.setItem(codeKey,value)}catch{}
    return value;
  }
  function err(m){const e=$('ecoCloudError');e.textContent=m;e.classList.add('visible');}
  function clearError(){$('ecoCloudError').classList.remove('visible');}
  function status(s){$('ecoCloudStatus').textContent=s;}
  function esc(x){return String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  async function fetchJson(path,options={}){
    if(!endpoint)throw Error('Falta configurar API_BASE_URL en ecosys-config.js.');
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),14000);
    try {const r=await fetch(endpoint+path,{...options,signal:ctrl.signal,headers:{'content-type':'application/json',...(options.headers||{})}});const data=await r.json();if(!r.ok)throw Error(data.error||'Error del servicio.');return data;}
    catch(e){if(e.name==='AbortError')throw Error('Se agotó el tiempo de espera. Comprueba la conexión.');throw e;}finally{clearTimeout(timer)}
  }
  function updateArea(){const role=$('ecoRole').value;const student=role==='estudiante';$('ecoGroupWrap').hidden=!student;$('ecoAreaWrap').hidden=!role||student;$('ecoGroup').required=student;$('ecoArea').required=Boolean(role&&!student);}
  function drawQuestions(qs){const root=$('ecoQuestionList');let prev='';root.innerHTML=qs.map((q,i)=>{
    let header='';if(q.category!==prev){prev=q.category;header=`<h4 class="eco-q-category">${esc(prev)}</h4>`;}
    return header+`<fieldset class="eco-q"><legend>${i+1}. ${esc(q.prompt)}</legend><div class="eco-q-options">`+q.options.map((o,j)=>`<label><input type="radio" name="question_${esc(q.id)}" value="${esc(o)}" ${j===0?'required':''}> ${esc(o)}</label>`).join('')+'</div></fieldset>';
  }).join('');}
  function buildTurnstile(){
    if(!siteKey){status('Falta configurar TURNSTILE_SITE_KEY en ecosys-config.js.');return;}
    if(window.turnstile){
      if(widget!==null)return;
      widget=window.turnstile.render('#ecoTurnstile',{sitekey:siteKey,callback:t=>{token=t;},'expired-callback':()=>{token='';}});
      return;
    }
    const scr=document.createElement('script');scr.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';scr.async=true;scr.onload=()=>buildTurnstile();scr.onerror=()=>status('No fue posible cargar la verificación de seguridad.');document.head.appendChild(scr);
  }
  // Encuesta: enfocar el botón de cierre sin desplazar el formulario al abrirlo.
  function resetSurveyScroll(){
    const body=document.querySelector('#ecoSurveyDialog .eco-modal-body');
    if(!body)return;
    try{$('ecoCloseSurvey').focus({preventScroll:true});}catch{}
    body.scrollTop=0;
    requestAnimationFrame(()=>{body.scrollTop=0;});
  }
  async function openSurvey(){
    const dlg=$('ecoSurveyDialog');if(typeof dlg.showModal==='function')dlg.showModal();else dlg.setAttribute('open','');
    resetSurveyScroll();
    $('ecoCloudDone').classList.remove('visible');clearError();$('ecoCode').value=code();
    if(!endpoint){status('Configura primero la URL del Worker en ecosys-config.js.');$('ecoSend').disabled=true;return;}
    // El servidor no admite solicitudes desde file://; no mostrar un error engañoso.
    if(location.protocol==='file:'){
      status('Vista previa local. Para cargar las 15 preguntas y comprobar D1, abre la página publicada en GitHub Pages.');
      $('ecoSend').disabled=true;return;
    }
    if(survey){status('');return;}
    status('Cargando encuesta desde Cloudflare D1...');
    try {
      survey=await fetchJson('/api/survey');
      drawQuestions(survey.questions);
      resetSurveyScroll();
      $('ecoNameWrap').hidden=!survey.collect_names;$('ecoName').required=Boolean(survey.collect_names);
      $('ecoSend').disabled=!survey.submissions_enabled||!siteKey;
      status(survey.submissions_enabled?(siteKey?'':'Configura la clave pública de Turnstile.'):'Encuesta disponible para lectura; el registro todavía está desactivado en Cloudflare.');
      if(survey.submissions_enabled)buildTurnstile();
    }catch(e){status('');err(e.message);}
  }
  function closeSurvey(){const d=$('ecoSurveyDialog');if(typeof d.close==='function')d.close();else d.removeAttribute('open');}
  async function submit(e){
    e.preventDefault();if(loading)return;clearError();$('ecoCloudDone').classList.remove('visible');
    if(!survey){err('La encuesta no se ha cargado.');return;}
    if(!token){err('Completa la verificación de seguridad.');return;}
    const form=new FormData(e.target),answers={};
    for(const q of survey.questions){const val=form.get('question_'+q.id);if(!val){err('Responde todas las preguntas.');return;}answers[q.id]=val;}
    const codeValue=$('ecoCode').value.trim().toUpperCase();
    if(!/^EC-[A-Z0-9]{16}$/.test(codeValue)){err('El identificador debe tener el formato EC- seguido de 16 caracteres.');return;}
    const payload={survey_id:survey.id,privacy_accepted:$('ecoPrivacy').checked,turnstile_token:token,
      participant:{code:codeValue,name:$('ecoName').value.trim(),role:$('ecoRole').value,group_name:$('ecoGroup').value.trim(),area:$('ecoArea').value.trim()},answers};
    loading=true;$('ecoSend').disabled=true;status('Registrando tu respuesta...');
    try{
      const result=await fetchJson('/api/submissions',{method:'POST',body:JSON.stringify(payload)});
      try{localStorage.setItem(codeKey,codeValue)}catch{}
      $('ecoCloudDone').textContent=result.message+' Conserva tu identificador: '+result.participant_code;
      $('ecoCloudDone').classList.add('visible');e.target.reset();$('ecoCode').value=codeValue;updateArea();status('');await refreshStats();
    }catch(ex){err(ex.message);status('');}
    finally{loading=false;$('ecoSend').disabled=!survey.submissions_enabled||!siteKey;token='';if(widget!==null&&window.turnstile)window.turnstile.reset(widget);}
  }
  function barItem(q){
    // Public aggregation only: no names, groups or individual answers.
    const chosen=q.options[0];const el=document.createElement('div');el.className='eco-chart-row';
    const line=document.createElement('div');line.className='eco-chart-title';
    const label=document.createElement('span');label.textContent=q.prompt;const value=document.createElement('strong');value.textContent=`${chosen.label}: ${chosen.percent}%`;
    line.append(label,value);const track=document.createElement('div');track.className='eco-chart-track';const bar=document.createElement('span');bar.style.width=chosen.percent+'%';track.append(bar);el.append(line,track);return el;
  }
  // INDICADORES ITSSAT: porcentajes reales provenientes de D1, sin cifras simuladas.
  function updateInstitutionStats(data){
    const write=(id,value)=>{const el=$(id);if(el)el.textContent=String(value);};
    write('ecosysItssatTotal', Number.isFinite(Number(data.total)) ? data.total : '—');
    const questions=Array.isArray(data.questions)?data.questions:[];
    const findPercent=(match,answer)=>{
      const q=questions.find(x=>match.test(x.prompt||''));
      if(!q)return '—';
      const o=(q.options||[]).find(x=>answer.test(x.label||''));
      return o&&Number.isFinite(Number(o.percent))?`${Math.round(Number(o.percent))}%`:'—';
    };
    if(data.status!=='ready'){
      ['ecosysItssatResidues','ecosysItssatEnergy','ecosysItssatAwareness'].forEach(id=>write(id,'—'));
      return;
    }
    write('ecosysItssatResidues',findPercent(/separas la basura/i,/^siempre$/i));
    write('ecosysItssatEnergy',findPercent(/apagas o suspendes.*computadora/i,/^siempre$/i));
    write('ecosysItssatAwareness',findPercent(/importante cuidar el ambiente/i,/^s[ií]$/i));
  }
  async function refreshStats(){
    const root=$('ecoCloudCharts');root.replaceChildren();
    if(!endpoint){$('ecoCloudTotal').textContent='—';$('ecoCloudStatsInfo').textContent='Pendiente: configurar la API de Cloudflare.';return;}
    if(location.protocol==='file:'){
      $('ecoCloudTotal').textContent='—';
      $('ecoCloudStatsInfo').textContent='Las estadísticas se consultan desde la página publicada.';
      return;
    }
    $('ecoCloudStatsInfo').textContent='Consultando resultados reales...';
    try{
      const data=await fetchJson('/api/stats');updateInstitutionStats(data);$('ecoCloudTotal').textContent=String(data.total);
      $('ecoCloudStatsInfo').textContent=data.status==='ready'?'Datos agregados de la encuesta (sin datos personales).':`Resultados en recopilación. Se muestran gráficas cuando haya al menos ${data.min_sample} respuestas.`;
      if(data.status==='ready')data.questions.slice(0,6).forEach(q=>root.append(barItem(q)));
      else {const p=document.createElement('p');p.className='eco-cloud-note';p.textContent='Las gráficas estarán disponibles conforme se registren más respuestas.';root.append(p)}
      const role=$('ecoCloudRoleStats');role.textContent=data.roles?.length?data.roles.map(x=>`${x.role}: ${x.count}`).join(' · '):'';
    }catch(ex){$('ecoCloudStatsInfo').textContent='No fue posible consultar estadísticas: '+ex.message;}
  }
  function init(){
    $('ecoOpenSurvey')?.addEventListener('click',openSurvey);
    $('ecoCloseSurvey')?.addEventListener('click',closeSurvey);
    $('ecoRefreshStats')?.addEventListener('click',refreshStats);
    $('ecoRole')?.addEventListener('change',updateArea);
    $('ecoCloudForm')?.addEventListener('submit',submit);
    $('ecoCopyCode')?.addEventListener('click',()=>{navigator.clipboard?.writeText($('ecoCode').value);status('Identificador copiado. Guárdalo en un lugar seguro.')});
    $('ecoCode').value=code();updateArea();refreshStats();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
