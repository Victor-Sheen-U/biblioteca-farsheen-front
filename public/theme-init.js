(function () {
  var root = document.documentElement;
  try {
    var pref = localStorage.getItem('biblio.theme');
    if (pref === 'dark') {
      root.classList.add('dark-theme');
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', '#0B1220');
    } else {
      root.classList.remove('dark-theme');
    }
  } catch (_e) {
    // Almacenamiento restringido
  }

  try {
    var rawA11y = localStorage.getItem('biblio.a11y');
    if (!rawA11y) return;
    var cfg = JSON.parse(rawA11y);
    if (!cfg || typeof cfg !== 'object') return;

    if (cfg.contraste === 'alto-claro') root.classList.add('a11y-contrast-high');
    if (cfg.contraste === 'alto-oscuro') root.classList.add('a11y-contrast-dark');
    if (cfg.resaltarEnlaces === true) root.classList.add('a11y-highlight-links');
    if (cfg.tamanoTexto === 115 || cfg.tamanoTexto === 130 || cfg.tamanoTexto === 150) {
      root.style.setProperty('--a11y-font-scale', cfg.tamanoTexto + '%');
      root.classList.add('a11y-font-scaled');
    }
    if (cfg.espaciadoTexto === true) root.classList.add('a11y-text-spacing');
    if (cfg.alturaLinea === 1.8 || cfg.alturaLinea === 2.2) {
      root.style.setProperty('--a11y-line-height', String(cfg.alturaLinea));
      root.classList.add('a11y-line-height');
    }
    if (cfg.alineacionTexto === 'center' || cfg.alineacionTexto === 'right') {
      root.style.setProperty('--a11y-text-align', cfg.alineacionTexto);
      root.classList.add('a11y-text-aligned');
    }
    if (cfg.fuenteDislexia === true) root.classList.add('a11y-dyslexia-font');
    if (cfg.detenerAnimaciones === true) root.classList.add('a11y-no-motion');
    if (cfg.ocultarImagenes === true) root.classList.add('a11y-hide-images');
    if (cfg.cursorGrande === true) root.classList.add('a11y-large-cursor');
    if (cfg.saturacion === 'baja' || cfg.saturacion === 'alta' || cfg.saturacion === 'grises') {
      root.classList.add('a11y-sat-' + cfg.saturacion);
    }
  } catch (_e2) {
    // JSON corrupto ignorado
  }
})();
