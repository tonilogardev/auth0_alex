// The Auth0 client, initialized in configureClient()
let auth0Client = null;

/**
 * Inicia el flujo de autenticación utilizando Auth0 Universal Login.
 * @param {string} [targetUrl] Ruta de retorno deseada tras hacer login.
 */
const login = async (targetUrl) => {
  try {
    console.log("Logging in", targetUrl);

    const options = {
      authorizationParams: {
        redirect_uri: window.location.origin
      }
    };

    if (targetUrl) {
      options.appState = { targetUrl };
    }

    await auth0Client.loginWithRedirect(options);
  } catch (err) {
    console.log("Log in failed", err);
  }
};

/**
 * Cierra la sesión del usuario y redirige al origen de la aplicación.
 */
const logout = async () => {
  try {
    console.log("Logging out");
    await auth0Client.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  } catch (err) {
    console.log("Log out failed", err);
  }
};

/**
 * Descarga el fichero de configuración generado en el servidor con dominio y clientId.
 * Se mantiene separado para que la SPA no incluya hard-coded las credenciales.
 */
const fetchAuthConfig = () => fetch("/auth_config.json");

/**
 * Crea (o reutiliza) la instancia de Auth0 y la almacena en auth0Client.
 * Se configura el almacenamiento en localStorage para que la sesión persista entre páginas.
 */
const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();

  auth0Client = await auth0.createAuth0Client({
    domain: config.domain,
    clientId: config.clientId,
    cacheLocation: "localstorage"
  });
};

/**
 * Comprueba si el usuario está autenticado. Si lo está, ejecuta la función fn.
 * En caso contrario inicia el login y redirige.
 */
const requireAuth = async (fn, targetUrl) => {
  const isAuthenticated = await auth0Client.isAuthenticated();

  if (isAuthenticated) {
    return fn();
  }

  return login(targetUrl);
};

/**
 * Comprueba el estado de autenticación y lo muestra por consola, sin redireccionar.
 */
const checkAuthStatus = async () => {
  if (!auth0Client) {
    console.warn("Auth0 client not initialized yet.");
    return;
  }
  const isAuthenticated = await auth0Client.isAuthenticated();
  console.log(
    isAuthenticated
      ? "El usuario está autenticado"
      : "El usuario NO está autenticado"
  );
};

/**
 * Garantiza que el usuario esté autenticado en la página actual.
 * Si no lo está, redirige a la URL indicada (por defecto "/").
 * Devuelve true si está autenticado, false si se desencadenó la redirección.
 */
const ensureAuthenticatedOrRedirect = async (redirectUrl = "/") => {
  await configureClient();
  const isAuthenticated = await auth0Client.isAuthenticated();
  if (!isAuthenticated) {
    window.location.replace(redirectUrl);
    return false;
  }
  return true;
};

// Will run when page finishes loading
window.onload = async () => {
  await configureClient();

  // If unable to parse the history hash, default to the root URL
  if (!showContentFromUrl(window.location.pathname)) {
    showContentFromUrl("/");
    window.history.replaceState({ url: "/" }, {}, "/");
  }

  const bodyElement = document.getElementsByTagName("body")[0];

  // Listen out for clicks on any hyperlink that navigates to a #/ URL
  bodyElement.addEventListener("click", (e) => {
    if (isRouteLink(e.target)) {
      const url = e.target.getAttribute("href");

      if (showContentFromUrl(url)) {
        e.preventDefault();
        window.history.pushState({ url }, {}, url);
      }
    }
  });

  const isAuthenticated = await auth0Client.isAuthenticated();

  if (isAuthenticated) {
    console.log("> User is authenticated");
    // Si estamos en la página raíz, redirigimos directamente a tools.html
    if (window.location.pathname === "/" || window.location.pathname === "/index.html") {
      window.location.replace("/tools.html");
      return;
    }
    window.history.replaceState({}, document.title, window.location.pathname);
    updateUI();
    return;
  }

  console.log("> User not authenticated");

  const query = window.location.search;
  const shouldParseResult = query.includes("code=") && query.includes("state=");

  if (shouldParseResult) {
    console.log("> Parsing redirect");
    try {
      const result = await auth0Client.handleRedirectCallback();

      if (result.appState && result.appState.targetUrl) {
        showContentFromUrl(result.appState.targetUrl);
      }

      console.log("Logged in!");
      // Tras procesar callback redirigimos a tools si estamos en la raíz
      if (window.location.pathname === "/" || window.location.pathname === "/index.html") {
        window.location.replace("/tools.html");
        return;
      }
    } catch (err) {
      console.log("Error parsing redirect:", err);
    }

    window.history.replaceState({}, document.title, "/");
  }

  updateUI();
};
