// Suprimir warnings de moment.js que vienen de dependencias externas
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  const originalError = console.error;

  const shouldSilence = (args) => {
    const msg = args?.map?.((a) => String(a)).join(' ') || '';
    // moment deprecations
    if (
      msg.includes('deprecateSimple') ||
      msg.includes('defineLocale') ||
      msg.includes('getSetGlobalLocale') ||
      msg.includes('moment.updateLocale') ||
      msg.includes('moment')
    ) {
      return true;
    }
    // React Router future flags
    if (msg.includes('React Router Future Flag Warning')) {
      return true;
    }
    return false;
  };

  console.warn = function(...args) {
    if (shouldSilence(args)) return;
    originalWarn.apply(console, args);
  };

  console.error = function(...args) {
    if (shouldSilence(args)) return;
    originalError.apply(console, args);
  };

  // Si moment está presente, suprimir deprecations en origen
  if (window.moment) {
    window.moment.suppressDeprecationWarnings = true;

    // Parche: si se llama defineLocale sobre un locale existente, redirige a updateLocale
    const originalDefineLocale = window.moment.defineLocale;
    if (typeof originalDefineLocale === 'function') {
      window.moment.defineLocale = (name, config) => {
        try {
          const exists = window.moment.locales?.().includes?.(name);
          if (exists) {
            return window.moment.updateLocale(name, config);
          }
        } catch (e) {
          // Silenciar errores en chequeo de locales
        }
        return originalDefineLocale(name, config);
      };
    }
  }
}
