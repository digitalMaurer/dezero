# 🚀 Mejoras Futuras - DeZero

## 📋 Estado Actual
- ✅ Sistema MANICOMIO completamente funcional
- ✅ Flujo multi-paso de creación de tests
- ✅ Todas las pruebas pasando
- ✅ Recuperación automática de preguntas bloqueadas
- ✅ Validación completa del shuffle de opciones

---

## 🔧 Mejoras de TestCreate.jsx

### Arquitectura
- [ ] **Extraer componentes de pasos** → Crear carpeta `/components` con:
  - `TestModeSelector.jsx`
  - `OposicionSelector.jsx`
  - `ThemeSelector.jsx`
  - `TestConfiguration.jsx`
- [ ] **Hook personalizado** → `useTestCreateForm()` para centralizar lógica del formulario
- [ ] **Cacheo de datos** → Context/Zustand para oposiciones y temas

### UX/UI
- [ ] **Progress bar visual** entre pasos
- [ ] **Animaciones de transición** entre pasos
- [ ] **Tooltips/Help icons** explicando cada modo de test
- [ ] **Historial de tests recientes** para acceso rápido
- [ ] **Persistencia en localStorage** del estado del formulario
- [ ] **Validaciones adicionales** (ej: SIMULACRO requiere ≥5 temas)

### Rendimiento
- [ ] **Lazy loading** de oposiciones en caso de ser muchas
- [ ] **Virtualization** de lista de temas si hay muchos
- [ ] **Memoización** de componentes de pasos

---

## 🎮 Mejoras de TestTake.jsx

### Arquitectura
- [ ] **Componente <ManicomioModal/>** para workflow del modal (reduce TestTake a 300 líneas)
- [ ] **Hook useAnswerValidation()** centralizando validación de respuestas
- [ ] **Hook useTestTimer()** para contador de tiempo real
- [ ] **Separar componentes monolíticos** (TestHeader, QuestionMap, etc.)

### Performance
- [ ] **Optimizar re-renders** con `useMemo`/`useCallback`
- [ ] **Virtualization** para QuestionMap si hay >50 preguntas
- [ ] **Precargar siguiente pregunta** mientras usuario responde
- [ ] **Lazy loading de imágenes** en preguntas

### Funcionalidades
- [ ] **Keyboard shortcuts**:
  - `Enter` → Responder pregunta
  - `Flechas` → Navegar entre opciones
  - `Ctrl+S` → Guardar progreso
  - `Ctrl+R` → Reportar pregunta
- [ ] **Contador de tiempo** sincronizado en tiempo real
- [ ] **Auto-save** cada 30 segundos en localStorage
- [ ] **Análisis en tiempo real** (% acierto, velocidad, racha)
- [ ] **Recuperación silenciosa** de preguntas bloqueadas (sin alert)

### UX
- [ ] **Modo oscuro** toggle
- [ ] **Indicador visual de preguntas sin responder**
- [ ] **Cambio suave de preguntas** (fade/slide animation)
- [ ] **Toast notifications** en lugar de alerts

### Errores/Debugging
- [ ] **Retry automático** en caso de error de conexión
- [ ] **Logging de eventos** para analytics
- [ ] **Better error messages** al usuario
- [ ] **Sentry integration** para monitoreo

---

## 🧪 Testing

### Unit Tests
- [ ] TestCreate formulario lógica
- [ ] Validación de selección de temas
- [ ] Mapeo de modos a configuraciones

### Integration Tests
- [ ] Flujo completo: Crear test → Responder → Finalizar (todos los modos)
- [ ] MANICOMIO: racha, reset, objetivo alcanzado
- [ ] Shuffle: validar siempre misma mezcla para misma pregunta

### E2E Tests
- [ ] Flujo MANICOMIO completo hasta 30 correctas
- [ ] Recuperación de pregunta bloqueada
- [ ] Persistencia entre reloads

---

## 📊 Backend Improvements

### Tests Controller
- [ ] [ ] Validar que respuestaCorrecta remapeada es consistente
- [ ] [ ] Mejorar logs de MANICOMIO
- [ ] [ ] Cache de preguntas por tema

### Shuffle Utils
- [ ] [ ] Documentar algoritmo Fisher-Yates con seed
- [ ] [ ] Tests unitarios del shuffle

---

## 🎨 UI/UX General

- [ ] **Design system** unificado (colores, tipografía, espaciado)
- [ ] **Responsive improvements** para móviles (TestTake muy grande)
- [ ] **Accessibility** (ARIA labels, keyboard navigation)
- [ ] **PWA** (offline support, installable)

---

## 📱 Prioridad de Implementación

### 🔴 Alta (Próxima sesión)
1. Keyboard shortcuts en TestTake
2. Mejorar UX de recuperación de pregunta bloqueada
3. Auto-save en localStorage

### 🟡 Media (Siguientes 2 sesiones)
1. Extraer componentes en TestCreate
2. Hook useTestCreateForm()
3. Animations entre pasos

### 🟢 Baja (Backlog)
1. Modo oscuro
2. PWA features
3. Analytics/Sentry
4. E2E tests

---

## 📝 Notas de Implementación

- **No tocar código funcional ahora** - Todo está estable
- Los comentarios TODO están en los archivos fuente
- Cada mejora debe ir en un commit separado
- Priorizar por impacto en UX

