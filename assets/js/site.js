/* Navegación accesible, scroll, entrada y utilidades compartidas EcoSys V5 */
(()=>{'use strict';
 const toggle=document.getElementById('navToggle'),links=document.getElementById('navLinks');
 if(toggle&&links){toggle.addEventListener('click',()=>{const b=links.classList.toggle('open');toggle.setAttribute('aria-expanded',String(b));toggle.setAttribute('aria-label',b?'Cerrar menú':'Abrir menú')});links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{links.classList.remove('open');toggle.setAttribute('aria-expanded','false')}));}
 const current=location.pathname.split('/').pop()||'index.html';document.querySelectorAll('.nav-links a').forEach(a=>{const href=a.getAttribute('href')||'';if(current!=='index.html'&&href===current)a.classList.add('active')});
 const progress=document.getElementById('scroll-progress');function update(){if(!progress)return;const total=document.documentElement.scrollHeight-innerHeight;progress.style.width=(total>0?scrollY/total*100:0)+'%'}addEventListener('scroll',update,{passive:true});update();
 const reveal=[...document.querySelectorAll('.reveal')];if('IntersectionObserver'in window&&!matchMedia('(prefers-reduced-motion:reduce)').matches){document.documentElement.classList.add('motion-on');const ob=new IntersectionObserver(items=>items.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');ob.unobserve(e.target)}}),{threshold:.07,rootMargin:'0px 0px -25px 0px'});reveal.forEach(el=>ob.observe(el));}else reveal.forEach(el=>el.classList.add('visible'));
})();
