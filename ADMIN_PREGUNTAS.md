# 🎓 Panel de Administración - Gestión de Preguntas

## Acceso al Panel

### Para Administradores
1. Inicia sesión con: **admin@test.com / admin123**
2. Verás un botón **"🛡️ Admin"** en el Navbar
3. Haz clic para acceder al Panel de Administración

### Para Usuarios Normales
- El botón Admin NO aparece
- No se puede acceder a `/admin` (redirecciona automáticamente)

---

## 📥 Importar Preguntas (Formato Texto)

### Paso 1: Acceder a "Gestión de Preguntas"
1. Ve al Panel Admin
2. Haz clic en "📥 Importar Preguntas"

### Paso 2: Seleccionar Oposición y Tema
```
- Oposición: Selecciona (ej: "Policía Nacional")
- Tema: Selecciona (ej: "Constitución Española" o "📌 General")
```

### Paso 3: Formato de Texto
Las preguntas se importan en este formato exacto:

```
ID|enunciado|opcionA|opcionB|opcionC|opcionD|respuestacorrecta|explicacion|tip
```

**Ejemplo:**
```
1|¿Cuál es la capital de España?|Madrid|Barcelona|Valencia|Sevilla|A|Madrid es la capital de España desde 1561|Piensa en la ciudad más grande
2|¿Cuánto es 2+2?|3|4|5|6|B|La suma de 2+2 es 4|||
3|¿Qué es JavaScript?|Un lenguaje de programación|Una base de datos|Un servidor|Un navegador|A|JavaScript es un lenguaje interpretado||
```

**Campos:**
- **ID:** Identificador único (1, 2, 3...)
- **enunciado:** La pregunta
- **opcionA:** Primera respuesta (siempre requerida)
- **opcionB:** Segunda respuesta (siempre requerida)
- **opcionC:** Tercera respuesta (siempre requerida)
- **opcionD:** Cuarta respuesta (siempre requerida)
- **respuestacorrecta:** A, B, C o D
- **explicacion:** Explicación de la respuesta (dejar vacío si no tienes)
- **tip:** Pista útil (dejar vacío si no tienes)

### Paso 4: Copiar y Pegar
1. Copia todas las líneas (incluyendo los encabezados si los tienes)
2. Pégalas en el cuadro de texto
3. Haz clic en **"Importar Preguntas"**

### Resultado
✅ Se mostrarán cuántas preguntas se importaron correctamente
❌ Si hay errores, se mostrarán con los números de línea

---

## 📋 Gestionar Preguntas

### Ver Todas las Preguntas
1. Ve a la pestaña **"📋 Gestionar Preguntas"**
2. Verás una tabla con todas las preguntas

### Editar una Pregunta
1. Haz clic en **"Editar"** en la fila de la pregunta
2. Se abrirá un formulario con todos los campos
3. Modifica lo que necesites
4. Haz clic en **"Guardar"**

### Eliminar una Pregunta
1. Haz clic en **"Borrar"** en la fila
2. Confirma la eliminación
3. La pregunta se borrará inmediatamente

### Campos Editables
- Enunciado
- Opciones A, B, C, D
- Respuesta correcta
- Explicación
- Tip
- Dificultad (Fácil, Media, Difícil)

---

## 📊 Validaciones

### Automáticas
✅ La respuesta correcta debe ser: **A, B, C o D**
✅ Cada línea debe tener exactamente **9 campos** separados por **|**
✅ Las 4 opciones son obligatorias
✅ El enunciado no puede estar vacío

### Mensajes de Error
```
❌ "Línea X: Debe tener exactamente 9 campos separados por |"
❌ "Pregunta X: La respuesta correcta debe ser A, B, C o D"
❌ "Por favor, pega las preguntas"
❌ "Selecciona una oposición"
❌ "Selecciona un tema"
```

---

## 💡 Ejemplos Completos

### Ejemplo 1: Preguntas sobre Oposiciones
```
1|¿Cuál es el artículo 1 de la Constitución Española?|El Rey es el Jefe del Estado|Los ciudadanos son iguales ante la ley|España se constituye en Estado social y democrático de derecho|El Gobierno es el órgano ejecutivo|C|España se constituye en Estado social y democrático de derecho, proponiendo como valores superiores la libertad, la justicia, la igualdad y el pluralismo|Busca en la Constitución
2|¿Qué poder tiene el Congreso de los Diputados?|Ejecutivo|Legislativo|Judicial|Administrativo|B|El Congreso es la cámara baja del Parlamento español con poder legislativo||
3|¿Cuántos diputados hay en el Congreso?|300|350|400|450|B|El Congreso tiene 350 diputados|Número más común
```

### Ejemplo 2: Preguntas de Examen
```
101|¿Cuál es el valor de π redondeado a 2 decimales?|3.12|3.14|3.16|3.18|B|π es aproximadamente 3.14159...|Piensa en el círculo
102|¿Qué es una variable en programación?|Un valor constante|Un espacio de memoria con un nombre|Una función|Una clase|B|Una variable almacena valores que pueden cambiar||
103|¿Cuál es la capital de Francia?|Lyon|París|Marsella|Toulouse|B|París es la capital de Francia||
```

### Ejemplo 3: Con Explicaciones Vacías
```
1|Pregunta 1|Resp A|Resp B|Resp C|Resp D|A|||
2|Pregunta 2|Resp A|Resp B|Resp C|Resp D|B|||
3|Pregunta 3|Resp A|Resp B|Resp C|Resp D|C|||
```

---

## 🤖 Usar con IA (Recomendación)

### Prompt para ChatGPT/Copilot
```
Genera 10 preguntas para una oposición de Policía Nacional sobre el tema "Constitución Española".
Formato exacto:
ID|enunciado|opcionA|opcionB|opcionC|opcionD|respuestacorrecta|explicacion|tip

Instrucciones:
- Siempre 4 opciones de respuesta
- La respuesta correcta debe ser A, B, C o D
- Dejar explicacion y tip vacíos (solo el campo, separado por |)
- Las preguntas deben ser de dificultad media
- Incluir IDs del 1 al 10

Ejemplo:
1|¿Cuál es el artículo 1 de la CE?|El Rey es Jefe del Estado|España se constituye en Estado social y democrático|La lengua oficial es el español|El Gobierno es el órgano ejecutivo|B|||
```

---

## ⚙️ Opciones Tema

### Opciones Disponibles
1. **Temas de la oposición seleccionada**
   - Constitución Española
   - Derecho Penal
   - Organización del Estado
   - etc.

2. **📌 General**
   - Usar cuando quieras cambiar el tema después
   - Las preguntas se asignarán a "General"
   - Puedes editarlas después para cambiar de tema

### Cambiar Tema Después
1. Ve a "📋 Gestionar Preguntas"
2. Haz clic en "Editar" de la pregunta
3. En el diálogo, busca el campo "Tema" (si está disponible en futuras versiones)
4. Guarda los cambios

---

## 📌 Preguntas Frecuentes

### ¿Puedo importar desde Excel?
**Respuesta:** No directamente. Pero puedes:
1. Copiar las columnas de Excel
2. Pegarlas en un editor de texto
3. Cambiar los separadores a `|`
4. Pegar en el formulario

### ¿Qué pasa si hay un error en la línea?
**Respuesta:** La línea con error no se importa. Se te dirá cuántas se importaron correctamente.

### ¿Puedo editar las preguntas después?
**Respuesta:** Sí, en la pestaña "📋 Gestionar Preguntas" → "Editar"

### ¿Puedo borrar preguntas?
**Respuesta:** Sí, en la pestaña "📋 Gestionar Preguntas" → "Borrar"

### ¿Qué es la dificultad?
**Respuesta:** Cada pregunta tiene un nivel:
- **Fácil:** Preguntas básicas
- **Media:** Preguntas estándar
- **Difícil:** Preguntas complejas

Se usa para filtrar tests por dificultad.

### ¿Necesito explicación y tip?
**Respuesta:** No, son opcionales. Puedes:
- Dejar vacío: `||`
- Rellenar después en la edición
- Dejar en blanco y agregarlos con IA después

---

## 🎯 Flujo Recomendado

### 1️⃣ Primero
```
Login → Admin → Gestión de Preguntas → Importar
```

### 2️⃣ Luego
```
Copiar preguntas en formato texto → Seleccionar Oposición/Tema → Importar
```

### 3️⃣ Después
```
Ver preguntas importadas → Editar si necesario → Guardar
```

### 4️⃣ Usar en Tests
```
Las preguntas aparecerán en "Realizar Tests" automáticamente
```

---

## ✨ Tips Útiles

### Plantilla Rápida
Guarda esta plantilla para copiar/pegar:
```
|¿Tu pregunta aquí?|Opción 1|Opción 2|Opción 3|Opción 4|A|||
```

### Validar Antes de Importar
Antes de importar muchas preguntas:
1. Importa 2-3 como prueba
2. Verifica que se ven bien
3. Luego importa el resto

### Usar "General" para Pruebas
- Importa primero con tema "General"
- Verifica que funcione
- Luego edita y cambia a temas específicos

### Backup de Preguntas
Para hacer backup de preguntas (futuro):
1. Copia desde la tabla
2. Guarda en un archivo de texto
3. Mantén una copia segura

---

## 🚀 Próximas Funcionalidades

En futuras versiones se añadirán:
- [ ] Exportar preguntas a texto
- [ ] Importar desde archivos
- [ ] Editar tema en el diálogo de edición
- [ ] Búsqueda y filtros en la tabla
- [ ] Cambio de dificultad masivo
- [ ] Duplicar preguntas

---

**¡Ya puedes empezar a gestionar preguntas!** 🎉

Para preguntas o problemas, revisa la sección "Solución de Problemas" en la documentación principal.
