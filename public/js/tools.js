// ===== DETECCIÓN DE ENVIRONMENT =====
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' || 
                   window.location.hostname.includes('local');

const environment = isLocalhost ? 'development' : 'production';

// ===== CONFIGURACIÓN DE URLs =====
document.addEventListener('DOMContentLoaded', function() {
  
  // Configurar URLs según el environment
  const toolLinks = document.querySelectorAll('.tool-link');
  
  toolLinks.forEach(link => {
    const devUrl = link.getAttribute('data-dev');
    const prodUrl = link.getAttribute('data-prod');
    
    const targetUrl = environment === 'development' ? devUrl : prodUrl;
    link.href = targetUrl;
    
    // Abrir en nueva pestaña
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
  
  // ===== MANEJO DE TOOLTIPS =====
  const tooltip = document.getElementById('tooltip');
  const toolCards = document.querySelectorAll('.tool-card');
  
  toolCards.forEach(card => {
    card.addEventListener('mouseenter', function(e) {
      const tooltipText = this.getAttribute('data-tooltip');
      if (tooltipText) {
        tooltip.textContent = tooltipText;
        tooltip.classList.add('show');
        updateTooltipPosition(e);
      }
    });
    
    card.addEventListener('mousemove', updateTooltipPosition);
    
    card.addEventListener('mouseleave', function() {
      tooltip.classList.remove('show');
    });
  });
  
  // ===== FUNCIÓN PARA POSICIONAR TOOLTIP =====
  function updateTooltipPosition(e) {
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = e.pageX + 10;
    let top = e.pageY - tooltipRect.height - 10;
    
    // Ajustar si se sale del viewport horizontalmente
    if (left + tooltipRect.width > viewportWidth) {
      left = e.pageX - tooltipRect.width - 10;
    }
    
    // Ajustar si se sale del viewport verticalmente
    if (top < window.pageYOffset) {
      top = e.pageY + 10;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }
  
  // ===== MANEJO DE LOGOUT =====
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      // Confirmar logout
      if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        // Limpiar localStorage si existe
        if (typeof(Storage) !== "undefined") {
          localStorage.clear();
        }
        
        // Limpiar sessionStorage si existe
        if (typeof(Storage) !== "undefined") {
          sessionStorage.clear();
        }
        
        // Redirigir a /app para re-login (mantiene cookies aceptadas)
        window.location.href = '/app?logout=true';
      }
    });
  }
  
  // ===== INFORMACIÓN DE ENVIRONMENT EN CONSOLA =====
  console.log(`🔧 Tools Page loaded in ${environment} mode`);
  console.log(`🌐 Environment: ${environment}`);
  console.log(`📍 Hostname: ${window.location.hostname}`);
  
  // ===== MOSTRAR INDICADOR DE ENVIRONMENT =====
  if (environment === 'development') {
    // Agregar indicador visual en development
    const devIndicator = document.createElement('div');
    devIndicator.textContent = 'DEV MODE';
    devIndicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #ff4444;
      color: white;
      padding: 5px 10px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: bold;
      z-index: 9999;
      opacity: 0.8;
    `;
    document.body.appendChild(devIndicator);
  }
  
}); 