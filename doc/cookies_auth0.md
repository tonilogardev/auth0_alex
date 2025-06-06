## Índice
1. [Objetivo](#1-objetivo)
2. [Flujo cronológico](#2-flujo-cronológico)
3. [Implementación técnica](#3-implementación-técnica)
4. [Personalización futura](#4-personalización-futura)
5. [Comprobación rápida](#5-comprobación-rápida)

# Política de Negocio – Consentimiento de Cookies y Autenticación (Auth0)

> Proyecto: **01-login – SPA con Express + Auth0**  
> Fecha última revisión: 2024-06-06

---

## 1. Objetivo
Garantizar que **ningún usuario** acceda a las funcionalidades de la aplicación ni pueda iniciar sesión con Auth0 hasta que haya aceptado expresamente el uso de cookies esenciales. Cumplir así las exigencias del RGPD y mantener la experiencia de usuario fluida.

---

## 2. Flujo cronológico

| Paso | Responsable | Descripción |
|------|-------------|-------------|
| 1 | Middleware **`consent-check`** (`server.js`) | Llega una petición a cualquier URL. Se comprueba si existe la cookie `cookie_consent=accepted`. |
| 2 | Middleware | **Si la cookie NO existe** y la ruta no está en la lista blanca ⇒ se envía `public/consent.html`. El resto del flujo se detiene. |
| 3 | Usuario | Visualiza `consent.html` y decide:<br/>• **Aceptar y Continuar** (formulario `POST /accept-cookies`) <br/>• **Rechazar** (link a `reject.html`) |
| 4 | Ruta **`POST /accept-cookies`** | El backend crea la cookie `cookie_consent` con `Max-Age=1 año`, `SameSite=Lax`, `Secure=true` en producción. Redirige a `/`. |
| 5 | Middleware | La cookie ya existe ⇒ la petición pasa. Se sirven archivos estáticos (`express.static`). |
| 6 | Front-end SPA (`app.js`) | Descarga `auth_config.json`, crea `auth0Client`, comprueba sesión Auth0.<br/>• Si el usuario Auth0 está autenticado ⇒ muestra UI privada.<br/>• Si no ⇒ muestra botón **Log in**. |
| 7 | Usuario | Pulsa **Log in** ⇒ `login()` → redirección a **Universal Login** de Auth0. |
| 8 | Auth0 → SPA | Tras autenticarse, Auth0 vuelve a `/?code=…&state=…`. La SPA procesa `handleRedirectCallback()`, guarda la sesión (`localStorage`) y actualiza la UI. |
| 9 | Acceso a páginas protegidas (`tools.html`) | Script inline ejecuta `ensureAuthenticatedOrRedirect("/")`. Si no hay sesión Auth0 ⇒ redirige al home, donde podrá iniciar sesión. |
| 10 | Logout | Botón **Log out** ejecuta `logout()` → `auth0Client.logout()`. Auth0 borra su sesión y la SPA vuelve al estado no autenticado. |
| 11 | Revocación | Si el usuario elimina la cookie `cookie_consent` o expira, la próxima petición volverá al paso 2. |

---

## 3. Implementación técnica

### 3.1 Cookie de consentimiento
```
Nombre   : cookie_consent
Valor    : accepted
Duración : 12 meses (Max-Age = 31536000 s)
Path     : /
SameSite : Lax
Secure   : true (solo en producción HTTPS)
``` 

### 3.2 Middleware en `server.js`
```js
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const consent = req.cookies.cookie_consent;
  const allowed = [
    "/consent.html", "/policy.html", "/reject.html",
    "/accept-cookies", "/auth_config.json"
  ];
  const startsWithAllowed = ["/css/", "/js/", "/images/", "/favicon", "/fonts/"];

  const isAllowed = allowed.includes(req.path) ||
                    startsWithAllowed.some(p => req.path.startsWith(p));

  if (!consent && !isAllowed) {
    return res.sendFile(join(__dirname, "public/consent.html"));
  }
  next();
});

app.post("/accept-cookies", (req, res) => {
  res.cookie("cookie_consent", "accepted", {
    maxAge : 1000 * 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure : process.env.NODE_ENV === "production"
  });
  res.redirect("/");
});
```

### 3.3 Archivos HTML/CSS relevantes
| Archivo | Rol |
|---------|-----|
| `public/consent.html` | Página de consentimiento con botón **Aceptar** y enlace **Rechazar**. |
| `public/reject.html`  | Informa al usuario de que no podrá usar la aplicación sin cookies. |
| `public/policy.html`  | Política detallada de cookies. |
| `public/css/cookie-*.css` | Estilos específicos de las páginas anteriores. |

---

## 4. Personalización futura
* **Categorías de cookies**: Si necesitas permitir cookies de analítica o marketing, amplía el formulario para seleccionar categorías y almacena un JSON en la cookie.
* **Panel de preferencias**: Exponer un enlace "Gestionar cookies" dentro de la SPA que borre `cookie_consent` y vuelva a mostrar `consent.html`.
* **Back-office**: El middleware puede evolucionar para leer el valor de la cookie y denegar solo si faltan categorías esenciales.

---

## 5. Comprobación rápida
```bash
npm run dev              # arranca servidor en localhost:3000
# Navegador
1) Borrar cookies → /     → muestra consent.html
2) Aceptar → redirige / y carga SPA
3) Visitar /tools.html → acceso permitido (si sesión Auth0 presente)
4) Eliminar cookie y recargar → vuelve consent.html
```

---

© 2024 tonilogar web – Licencia MIT
