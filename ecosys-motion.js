/* EcoSys · Animaciones complementarias (independientes de Cloudflare y D1). */
(() => {
  'use strict';
  const doc = document, root = doc.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches) return; // Accesibilidad: conservar la página estática.
  root.classList.add('motion-ready');
  requestAnimationFrame(() => root.classList.add('motion-in'));

  /* 01. Entrada escalonada para ventanas, secciones y tarjetas. */
  const patterns = [
    '.section-heading h2', '.section-intro', '.summary-card', '.policy-card',
    '.problem-card', '.feature', '.resource', '.standards-panel',
    '.eco-cloud-cta', '.eco-cloud-results', '.timeline-step', '.faq details',
    '.closing-note', '.footer-grid > div'
  ];
  const nodes = [...doc.querySelectorAll(patterns.join(','))];
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('motion-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.075, rootMargin: '0px 0px -22px 0px' }) : null;
  nodes.forEach((el, i) => {
    // No aplicar movimiento a elementos ya controlados por el .reveal original.
    if(el.classList.contains('reveal'))return;
    el.classList.add('motion-rise');
    el.style.setProperty('--motion-delay', `${(i%4)*65}ms`);
    if(observer)observer.observe(el);else el.classList.add('motion-visible');
  });

  /* 02. Brillo que responde al puntero en tarjetas (solo mouse). */
  const desktopPointer = matchMedia('(hover: hover) and (pointer: fine)');
  if (desktopPointer.matches) {
    const glowEls = doc.querySelectorAll('.problem-card,.feature,.resource,.summary-card,.policy-card,.eco-cloud-cta,.eco-cloud-results,.standards-panel,.tips-panel,.results-mini');
    for (const el of glowEls) {
      el.addEventListener('pointermove', e => {
        const b=el.getBoundingClientRect();
        el.style.setProperty('--motion-spot-x', `${Math.round(e.clientX-b.left)}px`);
        el.style.setProperty('--motion-spot-y', `${Math.round(e.clientY-b.top)}px`);
      }, {passive:true});
    }
    /* Micro-reacción magnética en los botones; límites pequeños para comodidad. */
    doc.querySelectorAll('.btn:not(:disabled)').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const b=btn.getBoundingClientRect();
        const x=((e.clientX-b.left)/b.width-.5)*7;
        const y=((e.clientY-b.top)/b.height-.5)*5;
        btn.style.setProperty('--mag-x', `${x.toFixed(1)}px`);
        btn.style.setProperty('--mag-y', `${y.toFixed(1)}px`);
      }, {passive:true});
      btn.addEventListener('pointerleave', () => {
        btn.style.setProperty('--mag-x','0px');btn.style.setProperty('--mag-y','0px');
      }, {passive:true});
    });
  }

  /* 03. Profundidad ligera en la imagen de portada; evita parallax costoso. */
  const heroArt=doc.querySelector('.hero-art');
  if(heroArt){
    let ticking=false;
    const paint=()=>{
      const y=Math.max(-18,Math.min(20,window.scrollY*-.06));
      heroArt.style.setProperty('--art-move',`${y.toFixed(1)}px`);
      ticking=false;
    };
    window.addEventListener('scroll',()=>{
      if(!ticking){ticking=true;requestAnimationFrame(paint)}
    },{passive:true});
  }

  /* 04. Cierre del modal con animación, conservando su lógica de encuesta. */
  const survey=doc.getElementById('ecoSurveyDialog');
  if(survey){
    let closing=false;
    const closeWithMotion=()=>{
      if(!survey.open||closing)return;
      closing=true;survey.classList.add('is-closing');
      setTimeout(()=>{
        if(survey.open)survey.close();
        survey.classList.remove('is-closing');closing=false;
      },230);
    };
    doc.addEventListener('click',e=>{
      if(e.target.closest('#ecoCloseSurvey')&&survey.open){
        e.preventDefault();e.stopImmediatePropagation();closeWithMotion();
      }
    },true);
    survey.addEventListener('cancel',e=>{e.preventDefault();closeWithMotion()});
    survey.addEventListener('close',()=>{survey.classList.remove('is-closing');closing=false});
  }

  /* 05. Transición entre páginas EcoSys, sin interferir con archivos o correo. */
  const cover=doc.createElement('div');cover.className='motion-page-cover';
  cover.setAttribute('aria-hidden','true');doc.body.appendChild(cover);
  doc.addEventListener('click',e=>{
    if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    const a=e.target.closest('a[href]');if(!a||a.target==='_blank'||a.hasAttribute('download'))return;
    if(a.protocol!=='file:'&&a.protocol!=='http:'&&a.protocol!=='https:')return;
    const dest=new URL(a.href,location.href),here=new URL(location.href);
    if(dest.origin!==here.origin || dest.pathname===here.pathname)return;
    if(!/(?:^|\/)(?:index|aviso-privacidad)\.html$/i.test(dest.pathname))return;
    e.preventDefault();doc.body.classList.add('motion-leaving');
    setTimeout(()=>location.assign(dest.href),410);
  });
})();

/* EcoSys V4.3: secuencias de entrada/salida. Independiente de Workers. */
(() => {
  'use strict';
  const root=document.documentElement;
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const list=[
    '.photostory .story-content', '.photostory .photo-tile',
    '.hero-value', '.hero-actions', '.impact-card',
    '.story-tags span', '.resource-image', '.cta-panel'
  ];
  const nodes=[...document.querySelectorAll(list.join(','))];
  // El estado se puede quitar al salir de pantalla y restaurar al regresar.
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(({target,isIntersecting})=>{
      if(isIntersecting)target.classList.add('v43-inview');
      else if(target.dataset.v43Entered==='1')target.classList.remove('v43-inview');
      if(isIntersecting)target.dataset.v43Entered='1';
    });
  },{threshold:0.07,rootMargin:'20px 0px 25px 0px'});
  nodes.forEach((el,i)=>{
    el.classList.add('v43-scene');
    el.style.setProperty('--v43-delay',`${(i%4)*75}ms`);
    observer.observe(el);
  });
  requestAnimationFrame(()=>root.classList.add('v43-motion-ready'));
})();
