const express = require("express");
const { join } = require("path");
const morgan = require("morgan");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const app = express();

app.use(morgan("dev"));
app.use(helmet());
app.use(cookieParser());
app.use(express.static(join(__dirname, "public")));

app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});

// Ruta raíz: verifica consentimiento de cookies
app.get("/", (req, res) => {
  const cookieConsent = req.cookies.cookieConsent;
  
  if (cookieConsent === "accepted") {
    // Usuario ya aceptó cookies, mostrar app normal
    res.sendFile(join(__dirname, "index.html"));
  } else {
    // Usuario no ha aceptado cookies, mostrar página de consentimiento
    res.sendFile(join(__dirname, "cookie-consent.html"));
  }
});

// Ruta para aceptar cookies
app.post("/accept-cookies", (req, res) => {
  res.cookie("cookieConsent", "accepted", { 
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 año
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
  });
  res.redirect("/app");
});

// Ruta para la aplicación (siempre muestra la app Auth0)
app.get("/app", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

// Ruta para herramientas (protegida)
app.get("/tools", (req, res) => {
  const cookieConsent = req.cookies.cookieConsent;
  
  if (cookieConsent === "accepted") {
    res.sendFile(join(__dirname, "tools.html"));
  } else {
    res.redirect("/");
  }
});



// Rutas auxiliares
app.get("/cookie-policy.html", (req, res) => {
  res.sendFile(join(__dirname, "cookie-policy.html"));
});

app.get("/reject-cookies.html", (req, res) => {
  res.sendFile(join(__dirname, "reject-cookies.html"));
});

// Catch-all para rutas SPA (mantiene funcionalidad original)
app.get("/*", (req, res) => {
  const cookieConsent = req.cookies.cookieConsent;
  
  if (cookieConsent === "accepted") {
    res.sendFile(join(__dirname, "index.html"));
  } else {
    res.redirect("/");
  }
});

process.on("SIGINT", function() {
  process.exit();
});

module.exports = app;
