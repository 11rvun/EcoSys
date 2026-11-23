ECOSYS V5 — PUBLICACIÓN

1. Descomprime este ZIP.
2. Sube todos los archivos y carpetas de su interior a la RAÍZ de github.com/11rvun/EcoSys (rama main).
3. Espera la marca verde de GitHub Actions > pages build and deployment.
4. Abre https://11rvun.github.io/EcoSys/ y haz Ctrl + F5.

La encuesta EXISTENTE sigue utilizando:
- https://ecosys-api.11rvun.workers.dev
- Tu clave PÚBLICA de Cloudflare Turnstile.
- El correo ecosys.priv@gmail.com

SEPARACIÓN DE SERVICIOS: esta actualización no sobrescribe el Worker actual.
EcoReport comienza con borradores locales y se activa remotamente al desplegar el backend independiente del ZIP EcoSys_V5_API_EcoReport.zip. La URL propuesta del nuevo Worker ya figura en ecosys-config.js; si cambia la URL final, actualiza la configuración.

EcoEstadística funciona localmente y exporta CSV; sus datos NO aparecen como mediciones institucionales.
Modelo 3D de 56 MB descomprimido, distribuido en escuela.glb.gz (18 MB) para permitir subirlo desde GitHub web. Carga bajo demanda y requiere navegador moderno.

Nunca publiques TURNSTILE_SECRET, ADMIN_TOKEN, .env, .dev.vars o respaldos .sql.
