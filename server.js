// Servidor Express principal: sirve la SPA, gestiona Cookies de consentimiento y redirige si es necesario
// -----------------------------------------------------------------------------------------------
// Dependencias externas
// express........... Framework web minimalista para Node.js
// path join......... Para construir rutas de forma segura entre SO.
// morgan............ Logger HTTP en modo desarrollo.
// helmet............ Cabeceras de seguridad recomendadas.
// cookie-parser..... Middleware para leer cookies entrantes.
require("dotenv").config();
const express = require("express");
const { join } = require("path");
const morgan = require("morgan");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const app = express();

// === Middlewares globales ===
// 1. morgan: registra las peticiones en consola (solo en dev)
// 2. helmet: añade cabeceras de seguridad (HSTS, CSP, etc.)
// 3. cookieParser: hace disponible req.cookies
// 4. express.urlencoded: parsea cuerpos de formularios x-www-form-urlencoded
app.use(morgan("dev"));
app.use(helmet());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// === Middleware de consentimiento de cookies ===
// Comprueba si existe la cookie "cookie_consent". Si no existe y la URL solicitada
// no está en la lista blanca, se envía la página /public/consent.html en su lugar.
app.use((req, res, next) => {
  const consent = req.cookies.cookie_consent; // "accepted" si el usuario ya aceptó

  // Rutas públicas que no requieren consentimiento previo
  const allowed = [
    "/consent.html",   // propia página de consentimiento
    "/cookie-policy.html",    // política de cookies
    "/cookie-reject.html",    // aviso de rechazo
    "/accept-cookies", // endpoint que crea la cookie
    "/auth_config.json" // config que necesita la SPA
  ];

  // Directorios estáticos permitidos (CSS, JS, imágenes...) que la página de
  // consentimiento necesita para mostrarse correctamente.
  const startsWithAllowed = ["/css/", "/js/", "/images/", "/favicon", "/fonts/"];

  const isAllowed =
    allowed.includes(req.path) ||
    startsWithAllowed.some((p) => req.path.startsWith(p));

  // Si no hay consentimiento y la ruta no es pública, muestra consent.html
  if (!consent && !isAllowed) {
    return res.sendFile(join(__dirname, "public/consent.html"));
  }

  next();
});

// === Archivos estáticos ===
// Se sirven todos los recursos dentro de /public una vez superada la verificación anterior.
app.use(express.static(join(__dirname, "public")));

// === Endpoint para aceptar cookies ===
// Crea la cookie "cookie_consent" con duración de 1 año y redirige al home.
app.post("/accept-cookies", (req, res) => {
  res.cookie("cookie_consent", "accepted", {
    maxAge: 1000 * 60 * 60 * 24 * 365, // 1 año en milisegundos
    sameSite: "lax",                   // protege contra CSRF básico
    secure: process.env.NODE_ENV === "production" // solo HTTPS en prod
  });
  res.redirect("/");
});

// === Rutas adicionales ===
// Config de Auth0 para la SPA
app.get("/auth_config.json", (req, res) => {
  const domain = process.env.DOMAIN_AUTH0;
  const clientId = process.env.CLIENT_ID_AUTH0;
  if (!domain || !clientId) {
    return res.status(500).json({ error: "Auth0 env vars not set" });
  }
  res.json({ domain, clientId });
});

// Catch-all: cualquier otra ruta devuelve index.html (SPA routing)
app.get("/*", (_, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

// Manejo de SIGINT para cerrar servidor (útil al usar nodemon)
process.on("SIGINT", function() {
  process.exit();
});

module.exports = app;
