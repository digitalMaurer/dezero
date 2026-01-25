# Changelog

## 2026-01-25 (Sesión actual)

### MANICOMIO/ANKI - Queue-based Sequential Flow con Auto-repair
- **Backend schema** (`backend/prisma/schema.prisma`): añadidos campos `queue` (String JSON) y `queueCursor` (Int) a TestAttempt para persistir cola de preguntas secuencial.
- **Backend migration** (`backend/prisma/migrations/20260125171558_add_queue_fields/`): migración SQL para agregar campos queue/queueCursor con defaults.
- **Backend services** (nuevos):
  - `answerProcessor.js`: función `processAnswer` centralizada para procesar respuestas (shuffle remapeado, validación, cálculo de base correctas/incorrectas) sin tocar BD.
  - `attemptUpdater.js`: funciones `updateManicomioAttempt` y `updateAnkiAttempt` para actualizar intento dentro de transacción con lógica de finalización.
- **Backend controllers refactorización**:
  - `attemptsController.js`: inicializa cola shuffleada para MANICOMIO; crea TestAttempt con `queue` y `queueCursor = 0`.
  - `manicomioController.js`: implementa flujo secuencial robusto con **auto-repair de cola**:
    - `answerQuestionManicomio`: parsea cola con manejo triple de double-strings; rota pregunta respondida al final de la cola; detecta mismatch y reconstruye cola shuffleada si está truncada o desincronizada.
    - `getNextManicomioQuestion`: selecciona siguiente pregunta desde queue/cursor (no búsqueda dinámica); auto-repair si cola vacía o mismatch; persiste cursor actualizado.
  - Ambos endpoints logean estado de cola para diagnóstico.
- **Prisma imports**: todos los controladores/utils refactorizados para usar `import pkg from '@prisma/client'` + `const { PrismaClient } = pkg` (compatibilidad CommonJS/ESM).
- **Frontend refactorización**:
  - `TestCreate.jsx`: añadido selector `ankiScope` (PENDIENTES/PENDIENTES_Y_NUEVAS/NUEVAS) para modo ANKI.
  - `TestTake.jsx`: detecta modo secuencial (MANICOMIO o ANKI) y fuerza vista 'single' (sin toggle); integra `useManicomioFlow` y `useManicomioLogic` para flujo.
  - `useManicomioFlow.js`: maneja transición entre preguntas en secuencial; detecta `isAnkiMode` para no agregar preguntas nuevas (ya precargadas).
  - `QuestionControls.jsx`: parámetro `sequentialMode` para ocultar Anterior/Siguiente en flujos secuenciales.
  - `ManicomioResultDialog.jsx`: parámetro `isAnkiMode` para ajustar mensajes (ANKI no reinicia racha, completa cuando responde todas).
  - `TestTakeDialogs.jsx`: pasa `isAnkiMode` a ManicomioResultDialog.
  - `DashboardAnki.jsx`: filtra oposiciones por `visible !== false` y actualiza botones para ir a `/test/create?mode=ANKI`.
  - `Estadisticas.jsx`: añade funcionalidad de eliminar intentos de test.
- **Logs detallados**: nuevo log en answerQuestion muestra queueLength, cursor y primeras 10 preguntas para diagnosticar truncamiento.
- **Compatibilidad**: mantiene MANICOMIO con racha personalizable; ANKI termina cuando responde todas las preguntas; reintentos permitidos en ambos modos.

### Report Dialog - Opciones dinámicas preconfiguradas
- **Frontend ReportDialog** (`frontend/src/pages/TestTake/components/QuestionActions.jsx`): rediseño completo del diálogo de reportes:
  - 5 opciones preconfiguradas con descripciones:
    - 📝 Error en enunciado
    - ❌ Respuesta incorrecta
    - 🤔 Ambigüedad
    - ♻️ Pregunta duplicada
    - ⚙️ Otro problema (con campo de descripción libre)
  - UI dinámica con Cards seleccionables y hover effects
  - Campo de descripción solo visible si se selecciona "Otro"
  - Validación: solo envía si hay selección y (si es "Otro") descripción válida
- **Frontend hook** (`frontend/src/pages/TestTake/hooks/useQuestionMeta.js`): actualizado `handleSubmitReport` para aceptar objeto `{ motivo, mensaje }` (compatible legacy con string).
- **Backend controller** (`backend/src/controllers/reportsController.js`): `createQuestionReport` ahora acepta parámetro `motivo` (default 'OTRO'); registra motivo específico en logs y BD.
- **Objetivo**: facilitar identificación de reportes duplicados y acelerar resolución (motivos categorizados automáticamente).

## 2026-01-21

### Refactor Backend - Modularización de controladores y selector de preguntas
- **Backend services** (`backend/src/services/questionSelector.js`): extracción de lógica de selección de preguntas por modo (ALEATORIO, FILTRADO, ANKI, REPASO, SIMULACRO_EXAMEN, FAVORITOS, MANICOMIO) a servicio centralizado con estrategia por modo.
  - `isPreguntaValid` compartido: valida **4 opciones** (A,B,C,D) para evitar preguntas incompletas.
  - `selectQuestionsForAttempt`: función unificada que recibe `mode`, `oposicionId`, `temasSeleccionados`, `cantidad`, `dificultad`, `filtroTipo`, `filtroOrden`, `userId`.
  - Modo FILTRADO ahora **requiere** `filtroTipo` (valida en selector, responde 400 si falta).
- **Backend controllers refactorización**:
  - `attemptsController.js`: simplificado para usar `selectQuestionsForAttempt`; envuelve creación de test + attempt en **transacción Prisma** (evita intentos huérfanos si falla algo).
  - `manicomioController.js`: reutiliza `isPreguntaValid` compartido desde selector.
  - Eliminadas ~200 líneas de lógica duplicada de selección entre controladores.

### Refactor Frontend - Modularización de TestTake
- **Frontend hooks** (nuevos):
  - `useQuestionMeta.js`: gestiona report/favorito/tip/anki (estados, sincronización con resultado MANICOMIO, llamadas API).
  - `useTestTimer.js`: controla tiempo transcurrido/pausa, estima tiempo total (2min×preguntas), expone `elapsedTime`, `isPaused`, `togglePause`, `tiempoRestante`.
- **Frontend componentes** (nuevos con comentarios descriptivos):
  - `TestTakeDialogs.jsx`: centraliza todos los diálogos (revisión, reporte, rendirse, eliminar, modal MANICOMIO).
  - `TestActionsBar.jsx`: barra de acciones principales (rendirse/eliminar) con tooltips.
- **TestTake.jsx**: reducido ~150 líneas; ahora consume hooks y componentes dedicados sin lógica inline de timer/favoritos/dialogs.
  - Imports limpiados (sin `Tooltip`, `TextField`, `Dialog*` directos).
  - Lógica de meta-pregunta (report/favorito/tip/anki) encapsulada en hook.

## 2026-01-20

### MANICOMIO - Lógica inteligente de repaso (Commit: 81abec3)
- **getNextManicomioQuestion** (`testsController.js`): implementada lógica de aprendizaje espaciado:
  - Pool = **No respondidas + Incorrectas (reintentos) + 10% Correctas (repaso)**
  - Separación clara: `respondidas_correctas`, `respondidas_incorrectas`, `no_respondidas`
  - Repaso solo si ≥10 correctas (evita error cuando aún no hay suficientes)
  - Logging detallado: muestra cuántas hay de cada categoría
  - Incorrectas **siempre** disponibles para reintento (sin bloqueo)
  - Correctas excluidas del pool regular, pero 10% se reintroduce para refrescar memoria

### AdminPreguntas - Paginación y filtro por tema (Commit: fb5c9cb)
- **Frontend AdminPreguntas** (`AdminPreguntas.jsx`): cambio radical de UX en "Gestionar":
  - Eliminado hardcodeado `limit: 1000, page: 1`
  - Añadido estado: `preguntasPage`, `preguntasLimit`, `paginationInfo`, `filtroTemaPreguntas`, `temasParaFiltro`
  - useEffect reactivo: recarga al cambiar paginación o filtro
  - `loadPreguntas` ahora pasa `temaId` si hay filtro seleccionado
  - `loadAllTemasForFilter`: carga todos los temas de todas las oposiciones al inicio (sin duplicados)
  - UI: Selector "Filtrar por tema" (todos los temas disponibles), selector "Por página" (10/25/50/100), botones Anterior/Siguiente con estado
  - Muestra "Página X de Y" con contador real desde paginationInfo
  - Deselecciona todas las filas al cambiar filtro/paginación

### Tip - Soporte completo (Commit: d365bc1)
- **Creación/Actualización** (`preguntasController.js`): aceptan y guardan `tip` en creación y actualización de preguntas.

### MANICOMIO - Cargar todas preguntas y evitar repetición (Commits previos)
- **createTestAttempt** (`testsController.js`): cambio radical para MANICOMIO: en lugar de cargar 1 pregunta inicial, ahora carga **TODAS las preguntas que coinciden con los criterios** (tema, dificultad) desde el inicio, mezcladas aleatoriamente.
- **getNextManicomioQuestion** (`testsController.js`): utiliza `attempt.test.questions` (todas cargadas) en lugar de queries dinámicas a BD; devuelve `tip` y `explicacion`.
- **answerQuestionManicomio** (`testsController.js`): obtiene preguntas desde `test.questions` (no BD), valida que pertenezcan al test, permite reintentos de incorrectas, bloquea solo si ya fue correcta, ajusta streak/contadores.
- Logging: simplificado sin mostrar arrays de IDs para no saturar consola.

### Tip - DB y Frontend (Commits previos)
- **DB** (`prisma/schema.prisma`): campo `tip String?` opcional en modelo `Pregunta` + migración `20260120164542_add_tip_field`.
- **API respuesta** (`testsController.js`): getNextManicomioQuestion incluye `tip` en merged response.
- **Frontend** (`TestTake.jsx`): modal muestra enunciado, tip editable (TextField), explicación; handleSaveTip actualiza servidor.

### Cambios de arquitectura
- MANICOMIO cambió de modelo dinámico (cargar preguntas bajo demanda) a modelo estático (cargar todas al inicio, con sistema de repaso inteligente).
- Eliminadas búsquedas dinámicas innecesarias a BD en cada siguiente pregunta.
- Shuffle determinístico (`shuffleUtils.js`): por ID de pregunta, garantiza misma mezcla siempre (validación de respuestas).

## Historial de commits (últimos 20)
```
9e5257f feat: dynamic report dialog with predefined reasons
7b216ba fix: rebuild manicomio queue when it is truncated
d4b0808 feat: manicomio sequential queue and anki scope flows
77cd81a feat(manicomio): mostrar tip/explicacion y editar tip en modal
29bf835 feat(db): agregar campo tip a modelo Pregunta
ae949dc docs: agregar comentarios de mejoras futuras y README centralizado
0f80bb5 refactor(frontend): rediseñar TestCreate con flujo multi-paso
767c000 fix(frontend): recuperación automática cuando pregunta bloqueada
7287749 feat(frontend): mejoras UI en modo MANICOMIO
48dfc3a feat(frontend): modal MANICOMIO con resultado antes continuar
b4c814c fix(frontend): validación relajada y múltiples formatos respuesta
882ad4a fix(backend): corregir lógica shuffle y validación MANICOMIO
3c234fc Complete TestTake refactorization con todos los componentes
4bdd872 Refactor TestTake en componentes modulares y hooks
50d4770 Validar preguntas completas - evitar vacías/incompletas
7edb859 Flujo directo MANICOMIO sin pasar por TestCreate
25407a4 Corregir errores 400 MANICOMIO - preguntas dinámicas
429dc6f Corregir 400 en getNextManicomioQuestion - pregunta vacía
65b33dc Carga dinámica de preguntas MANICOMIO
10cdf69 Incluir streakTarget en respuesta backend
25624e5 Referencias hardcodeadas de 30 aciertos a dinámicas
26353f6 MANICOMIO con objetivos personalizables
f4bcc47 ALEATORIO cargar todas las preguntas si cantidad vacío
```



### MANICOMIO - Lógica inteligente de repaso (Commit: 81abec3)

### MANICOMIO - Lógica inteligente de repaso (Commit: 81abec3)
- **getNextManicomioQuestion** (`testsController.js`): implementada lógica de aprendizaje espaciado:
  - Pool = **No respondidas + Incorrectas (reintentos) + 10% Correctas (repaso)**
  - Separación clara: `respondidas_correctas`, `respondidas_incorrectas`, `no_respondidas`
  - Repaso solo si ≥10 correctas (evita error cuando aún no hay suficientes)
  - Logging detallado: muestra cuántas hay de cada categoría
  - Incorrectas **siempre** disponibles para reintento (sin bloqueo)
  - Correctas excluidas del pool regular, pero 10% se reintroduce para refrescar memoria

### AdminPreguntas - Paginación y filtro por tema (Commit: fb5c9cb)
- **Frontend AdminPreguntas** (`AdminPreguntas.jsx`): cambio radical de UX en "Gestionar":
  - Eliminado hardcodeado `limit: 1000, page: 1`
  - Añadido estado: `preguntasPage`, `preguntasLimit`, `paginationInfo`, `filtroTemaPreguntas`, `temasParaFiltro`
  - useEffect reactivo: recarga al cambiar paginación o filtro
  - `loadPreguntas` ahora pasa `temaId` si hay filtro seleccionado
  - `loadAllTemasForFilter`: carga todos los temas de todas las oposiciones al inicio (sin duplicados)
  - UI: Selector "Filtrar por tema" (todos los temas disponibles), selector "Por página" (10/25/50/100), botones Anterior/Siguiente con estado
  - Muestra "Página X de Y" con contador real desde paginationInfo
  - Deselecciona todas las filas al cambiar filtro/paginación

### Tip - Soporte completo (Commit: d365bc1)
- **Creación/Actualización** (`preguntasController.js`): aceptan y guardan `tip` en creación y actualización de preguntas.

### MANICOMIO - Cargar todas preguntas y evitar repetición (Commits previos)
- **createTestAttempt** (`testsController.js`): cambio radical para MANICOMIO: en lugar de cargar 1 pregunta inicial, ahora carga **TODAS las preguntas que coinciden con los criterios** (tema, dificultad) desde el inicio, mezcladas aleatoriamente.
- **getNextManicomioQuestion** (`testsController.js`): utiliza `attempt.test.questions` (todas cargadas) en lugar de queries dinámicas a BD; devuelve `tip` y `explicacion`.
- **answerQuestionManicomio** (`testsController.js`): obtiene preguntas desde `test.questions` (no BD), valida que pertenezcan al test, permite reintentos de incorrectas, bloquea solo si ya fue correcta, ajusta streak/contadores.
- Logging: simplificado sin mostrar arrays de IDs para no saturar consola.

### Tip - DB y Frontend (Commits previos)
- **DB** (`prisma/schema.prisma`): campo `tip String?` opcional en modelo `Pregunta` + migración `20260120164542_add_tip_field`.
- **API respuesta** (`testsController.js`): getNextManicomioQuestion incluye `tip` en merged response.
- **Frontend** (`TestTake.jsx`): modal muestra enunciado, tip editable (TextField), explicación; handleSaveTip actualiza servidor.

### Cambios de arquitectura
- MANICOMIO cambió de modelo dinámico (cargar preguntas bajo demanda) a modelo estático (cargar todas al inicio, con sistema de repaso inteligente).
- Eliminadas búsquedas dinámicas innecesarias a BD en cada siguiente pregunta.
- Shuffle determinístico (`shuffleUtils.js`): por ID de pregunta, garantiza misma mezcla siempre (validación de respuestas).

## Historial de commits (últimos 20)
```
77cd81a feat(manicomio): mostrar tip/explicacion y editar tip en modal
29bf835 feat(db): agregar campo tip a modelo Pregunta
ae949dc docs: agregar comentarios de mejoras futuras y README centralizado
0f80bb5 refactor(frontend): rediseñar TestCreate con flujo multi-paso
767c000 fix(frontend): recuperación automática cuando pregunta bloqueada
7287749 feat(frontend): mejoras UI en modo MANICOMIO
48dfc3a feat(frontend): modal MANICOMIO con resultado antes continuar
b4c814c fix(frontend): validación relajada y múltiples formatos respuesta
882ad4a fix(backend): corregir lógica shuffle y validación MANICOMIO
3c234fc Complete TestTake refactorization con todos los componentes
4bdd872 Refactor TestTake en componentes modulares y hooks
50d4770 Validar preguntas completas - evitar vacías/incompletas
7edb859 Flujo directo MANICOMIO sin pasar por TestCreate
25407a4 Corregir errores 400 MANICOMIO - preguntas dinámicas
429dc6f Corregir 400 en getNextManicomioQuestion - pregunta vacía
65b33dc Carga dinámica de preguntas MANICOMIO
10cdf69 Incluir streakTarget en respuesta backend
25624e5 Referencias hardcodeadas de 30 aciertos a dinámicas
26353f6 MANICOMIO con objetivos personalizables
f4bcc47 ALEATORIO cargar todas las preguntas si cantidad vacío
```
