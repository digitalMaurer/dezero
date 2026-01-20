# Changelog

## 2026-01-20 (Sesión actual)

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
