# Guía de Integración y Despliegue – Auth0 SPA (Proyecto 01-login)

## 1. Descripción general
Este proyecto es un ejemplo mínimo de **Single Page Application (SPA)** que utiliza el SDK [`@auth0/auth0-spa-js`](https://github.com/auth0/auth0-spa-js) para autenticar usuarios mediante el **Universal Login** de Auth0.  
El _backend_ se limita a un pequeño servidor **Express** cuya única misión es servir los archivos estáticos y exponer el fichero `auth_config.json` con las credenciales de la aplicación.

## 2. Estructura del proyecto
```
├── bin/
│   └── www                # Punto de entrada del servidor Express
├── public/                # Contenido estático (HTML, CSS, JS, imágenes)
│   ├── js/app.js          # Lógica de autenticación y flujo SPA
│   └── js/ui.js           # Router y actualización de la interfaz
├── server.js              # Configuración de Express
├── auth_config.json       # Dominio y Client ID de Auth0 (NO versionar credenciales reales)
└── doc/auth0.md           # (Este documento)
```

## 3. Requisitos previos
1. **Node.js ≥ 14** (se ha probado con Node 18).  
2. Una cuenta gratuita en [Auth0](https://auth0.com/signup).

## 4. Alta y configuración en Auth0
### 4.1 Crear la aplicación
1. En el _dashboard_ de Auth0, ir a **Applications → Applications** y pulsar **Create application**.
2. Asignar un nombre (p.ej. `01-login`) y elegir el tipo **Single Page Web Application (SPA)**.

### 4.2 Ajustar los URIs
En la pestaña **Settings** de la aplicación configuramos:

| Campo                         | Valor en desarrollo                      | Notas |
|-------------------------------|------------------------------------------|-------|
| Application Login URI         | `http://localhost:3000/login`            | Página donde redirigir después de cada login (en producción será tu dominio público). |
| Allowed Callback URLs         | `http://localhost:3000/`                 | Auth0 devolverá aquí el código de autorización. |
| Allowed Logout URLs           | `http://localhost:3000/`                 | Adonde redirigir tras cerrar sesión. |
| Allowed Web Origins           | `http://localhost:3000/`                 | Origen permitido para peticiones XHR desde la SPA. |

> ⚠️ Recuerda añadir también la URL de producción (p.ej. `https://myapp.com`) en cada uno de estos campos antes de desplegar.

### 4.3 Obtener credenciales
Anotar:
* **Domain** → algo como `dev-xxxx.eu.auth0.com`  
* **Client ID** → cadena alfanumérica

Estas credenciales irán en el archivo `auth_config.json`:
```json
{
  "domain": "<TU_DOMAIN>.eu.auth0.com",
  "clientId": "<TU_CLIENT_ID>"
}
```
⚠️ No subas el fichero con credenciales reales a repositorios públicos.

## 5. Instalación y ejecución local
```bash
npm install        # instala dependencias (Express, Helmet, Morgan...)
npm run dev        # inicia server con nodemon en http://localhost:3000
```
Al abrir el navegador en `http://localhost:3000/` verás la página de inicio de la SPA.

## 6. Flujo de autenticación paso a paso
1. El usuario pulsa **Log in** → función `login()` en `public/js/app.js`.
2. Se invoca `auth0Client.loginWithRedirect({...})`, que redirige al **Universal Login**.
3. Tras autenticarse, Auth0 redirige a `http://localhost:3000/?code=...&state=...`.
4. Al cargarse la SPA, `auth0Client.handleRedirectCallback()` procesa los parámetros y almacena la sesión en **localStorage**.
5. `auth0Client.isAuthenticated()` determina si el usuario está logueado y `updateUI()` ajusta la interfaz.
6. Para cerrar sesión, `logout()` llama a `auth0Client.logout({ returnTo: window.location.origin })` y Auth0 redirige de nuevo a la raíz.

## 7. Archivos clave
| Archivo | Descripción |
|---------|-------------|
| `server.js` | Configura Express, Helmet y rutas para servir estáticos y `auth_config.json`. |
| `bin/www` | Lanza el servidor en el puerto 3000 (o en `PORT`). |
| `public/js/app.js` | Inicializa el cliente Auth0, maneja login/logout y callbacks. |
| `public/js/ui.js`  | Router mínimo y lógica de UI dependiendo del estado de autenticación. |

## 8. Comandos útiles
| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Arranca el servidor con **nodemon** (hot-reload). |
| `npm start`   | Arranca el servidor sin nodemon. |

## 9. Despliegue en producción
1. Configura las URLs de producción en el panel de Auth0 tal como se detalla en 4.2.  
2. Despliega la carpeta del proyecto (por ejemplo en **Render**, **Heroku**, **Vercel** o un VPS).  
3. Asegúrate de que la variable de entorno `PORT` esté establecida o modifica `bin/www` para usar el puerto deseado.  
4. Utiliza HTTPS en producción; actualiza los URIs de Auth0 para usar `https://`.

## 10. Resolución de problemas (FAQ)
| Problema | Posible causa | Solución |
|----------|---------------|----------|
| `Invalid state` al volver de Auth0 | Se recargó la página antes de que `handleRedirectCallback` se ejecutara. | Borra cookies + localStorage y repite el login. |
| Recibo **401 Unauthorized** al llamar a una API propia | No estás enviando el _access token_ en la cabecera `Authorization`. | Añade `Authorization: Bearer <token>`. |
| El login redirige pero la UI no cambia | La SPA no reconoce la nueva ruta. | Comprueba que los URIs configurados en Auth0 coincidan exactamente. |

## 11. Enlaces de referencia
* Docs Auth0 SPA JS → <https://auth0.github.io/auth0-spa-js>
* Guía Universal Login → <https://auth0.com/docs/authenticate/login/universal-login>
* Ejemplos oficiales → <https://github.com/auth0-samples>

---
© 2023 Proyecto 01-login – Licencia MIT
