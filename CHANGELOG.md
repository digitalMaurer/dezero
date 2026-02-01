# Changelog

## 2026-02-01

### Sistema de preguntas oficiales y gestión individual mejorada
- **Backend**:
  - `schema.prisma`: agregado campo `esOficial Boolean @default(false)` a modelo `Pregunta`.
  - `preguntasController.js`: validación de boolean `esOficial` en create/update, exportación en todas las respuestas.
  - `attemptsController.js`: incluye `tema` y `esOficial` en respuestas de test.
  - `manicomioController.js`: incluye `esOficial` en response del siguiente ejercicio.

- **Frontend**:
  - `AdminPreguntasManage.jsx`: nuevo diálogo de gestión individual con UI compacta.
    - Tema selector arriba para cambiar asignación.
    - Mostrar estado oficial/no oficial.
    - Botones en una línea: Eliminar | Marcar/Quitar oficial | Siguiente | Mover a tema.
    - Header azul con gradiente y contador de pregunta (ej: 1/50).
  - `QuestionActions.jsx` (en TestTake): chip interactivo mostrando "Oficial"/"No oficial", clickeable por admins.
  - `TestTake.jsx`: función `handleToggleOficial` para cambiar estado durante test.
  - `AdminPreguntasImportText.jsx`: checkbox "Marcar todas como oficiales" al importar preguntas.
  - `AdminPreguntasEditDialog.jsx`: checkbox para marcar pregunta como oficial en la edición.
  - `useAdminPreguntasLogic.js`: funciones `handleMovePreguntaToTema`, `handleUpdatePreguntaOficial`.

- **Funcionalidad**:
  - Campo `esOficial` visible en tabla de preguntas (chip: Sí/No con colores).
  - Gestión individual: navegar 1-a-1 por preguntas, cambiar tema, marcar oficial, eliminar.
  - Importación masiva con opción de marcar todas como oficiales.
  - En tests: admins pueden ver y cambiar estado oficial de preguntas durante el test.
  - Fallback seguro: `esOficial ?? false` si falta en cache.

### Visualización de tema en tests online con toggle
- **Backend**:
  - `attemptsController.js`: incluye `tema` en la respuesta de `createTestAttempt` y `getTestAttempt`.
  - Todas las preguntas del test ahora incluyen información del tema desde el inicio.

- **Frontend**:
  - `useTestData.js`: mantiene campo `tema` en el mapeo de preguntas y fuerza recarga si el cache no contiene temas.
  - `QuestionDisplay.jsx`: muestra el nombre del tema encima del enunciado (condicional con prop `showTema`).
  - `TestActionsBar.jsx`: nuevo botón "Mostrar/Ocultar tema" junto a Rendirse, Eliminar y Exportar PDF.
  - `TestTake.jsx`: estado `showTema` que permite al usuario ocultar/mostrar el tema en todas las preguntas.
  
- **Funcionalidad**:
  - El tema se muestra por defecto durante el test online (igual que en el PDF exportado).
  - El usuario puede ocultarlo pulsando el botón "🙈 Ocultar tema" o mostrarlo con "👁️ Mostrar tema".
  - Aplica tanto en vista individual como en vista de lista.

## 2026-01-29

### Resolución rápida de reportes desde edición de preguntas
- **Frontend**:
  - Al editar una pregunta desde un reporte, tras guardar, aparece un modal de confirmación "¿Ha resuelto el reporte?".
  - Si el usuario confirma, el reporte se elimina automáticamente.
  - El flujo no afecta la gestión normal de preguntas ni otros apartados.
  - Corrección de integración y feedback visual para admins.

## 2026-01-26 (Sesión actual - continuación)

### Exportación de Tests a PDF
- **Backend**:
  - `pdfGenerator.js` (nuevo): función `generateTestPDF` con layout profesional
    - Portada: título, oposición, fecha, temas incluidos
    - Preguntas: enunciado con tema, 4 opciones A/B/C/D con checkboxes, imágenes adjuntas
    - Plantilla de respuestas: tabla 2 columnas, casillas vacías para marcar, numeración automática
    - Soporte para imágenes en preguntas (verifica existencia antes de incluir)
    - Opción `withAnswers`: muestra respuesta correcta (✓ en verde), tips y explicaciones
  - `attemptsController.js`: endpoint `exportTestToPDF` con parámetro `withAnswers` query
  - `tests.js`: ruta `GET /tests/attempts/:id/export-pdf` con auth
  - Librería: instalado `pdfkit` (18 packages, MIT license)
  
- **Frontend**:
  - `TestActionsBar.jsx`: botón "📄 Exportar PDF" con icono PictureAsPdfIcon, indicador carga
  - `TestTake.jsx`: función `handleExportPDF` con descarga automática, estado `exportingPDF`
  - `apiServices.js`: método `exportAttemptToPDF(attemptId, withAnswers)` con `responseType: 'blob'`
  
- **Impacto funcional**:
  - ✅ Botón disponible durante test en cualquier momento
  - ✅ Descarga inmediata al click con nombre `test-{attemptId}.pdf`
  - ✅ Apto para imprimir (A4, márgenes 50px, estilos legibles)
  - ✅ Opción futura: `withAnswers=true` para PDF con soluciones (admin/revisión)

## 2026-01-25

### Duplicados - Mejoras UI, Auto-refresh y Filtrado Global en Tests
- **Backend enhancements**:
  - `questionSimilarity.js`: `scanSimilarQuestions` ahora excluye preguntas con `duplicateStatus = 'DUPLICATED'` (merged), devuelve grupos ordenados por cantidad de similares
  - `preguntasController.js`: 
    - `getPreguntas` filtra `duplicateStatus = 'ACTIVE'` por defecto; devuelve `totalDuplicated` y `totalAll` en pagination
    - `generateRandomTest` excluye duplicadas con filtro en where clause
  - `ankiController.js`: `getDueQuestionsForTemas` y `getAnkiStatsByOposicion` filtran `duplicateStatus = 'ACTIVE'`
  - `temasController.js`: `getTemas` enriquece respuesta con conteos: `_count.preguntas` (solo activas), `_count.preguntasTotal` (todas), `_count.preguntasDuplicated`
  - `oposicionesController.js`: `getOposiciones` enriquece con mismo desglose de conteos
  - `questionSelector.js`: 
    - `buildBaseWhere()` incluye `duplicateStatus: 'ACTIVE'` para todos los modos
    - SIMULACRO_EXAMEN, FAVORITOS, ANKI, ALEATORIO, FILTRADO - todos excluyen duplicadas
  - `filtroPreguntas.js`: `getPreguntasConFiltro` filtra `duplicateStatus: 'ACTIVE'`
  - Logs en terminal: merge muestra pregunta maestra, IDs duplicadas, usuario y estrategia; false-positive muestra par marcado
  
- **Frontend refactorización**:
  - `AdminPreguntasDuplicates.jsx`: 
    - Cambio **Collapse → Dialog modal** para ver detalles de grupos (mejor UX, más espacio)
    - Componente `DuplicateGroupDialog` con tabla interna: checkboxes para seleccionar duplicados, radio para elegir maestra desde cualquier pregunta
    - Estado reseteado al abrir nuevo grupo con useEffect (fix: contador de "Unificar" no se acumulaba)
    - Tabla principal: columnas ID | Base | Similares | Score Máx | Acciones (botón "Ver detalles")
    - Auto-refresh tras merge/false-positive: llama a `handleScanDuplicates()` para actualizar lista
  - `useAdminPreguntasLogic.js`: 
    - `handleMergeGroup()` y `handleMarkFalsePositive()` refrescan lista automáticamente tras acción
    - Estado `duplicateGroups` en lugar de `duplicatePairs`
  - `Oposiciones.jsx`: muestra "(X duplicadas)" en naranja junto al contador de preguntas

- **Impacto funcional**:
  - ✅ Tests NUNCA incluyen preguntas duplicadas (fusionadas)
  - ✅ Contadores en UI (oposiciones, temas, tests) reflejan solo preguntas activas
  - ✅ Después de fusionar: contador baja automáticamente, escaneo refresca, preguntas no reaparecen
  - ✅ Admin ve desglose: "2961 preguntas (2 duplicadas)" en tarjeta de oposición
  - ✅ Dialog modal clara para gestionar grupos sin desplazar tabla principal

### Duplicados - Detección, falsos positivos y merge (Commits: aeb37a0, cd4ef7b)
- **Backend**: campos `duplicateStatus`/`masterPreguntaId` en Pregunta, tablas `pregunta_merge_history` y `duplicate_false_positives`, migración `20260125190000_add_duplicate_flags`, servicio `questionSimilarity` con stopwords y exclusión de falsos positivos. Endpoints admin: `/preguntas/:id/similar`, `/preguntas/duplicates/false-positive`, `/preguntas/duplicates/merge` y nuevo `/preguntas/duplicates/scan` para escaneo automático por tema/global.
- **Frontend Admin**: pestaña **Duplicados** ahora escanea automáticamente por tema sin elegir pregunta base; controles de umbral/límite; tabla de pares con score y acciones rápidas: "A/B maestra" (merge) y "No es duplicada" (false positive). Cliente API expone `scanDuplicates` además de las acciones de merge/falso positivo.
- **Nota**: falta reasignar referencias de `test_questions` y `attempt_responses` al hacer merge en backend (próxima mejora).

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

## Historial de commits principales
```
fc0ff78 feat: Exportación de tests a PDF
cd4ef7b feat: Sistema duplicados - UI Dialog, filtrado global y auto-refresh
aeb37a0 feat: Sistema de duplicados - detección, merge y falsos positivos
&77cd81a feat(manicomio): mostrar tip/explicacion y editar tip en modal
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
