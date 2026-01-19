// Suprimir warnings de moment.js que vienen de dependencias externas
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = function(...args) {
    // Suprimir warnings relacionados con moment.js deprecation
    if (
      args[0]?.includes?.('deprecateSimple') ||
      args[0]?.includes?.('defineLocale') ||
      args[0]?.includes?.('getSetGlobalLocale') ||
      args[0]?.includes?.('moment')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}
