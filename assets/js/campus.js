/* EcoSys V5: recorrido 3D en vista independiente para evitar menús duplicados. */
(() => {
  'use strict';
  const button = document.getElementById('startViewer');
  if (!button) return;
  button.addEventListener('click', () => {
    button.disabled = true;
    button.textContent = 'Abriendo el recorrido 3D…';
    window.location.assign('campus-3d/index.html');
  });
})();
