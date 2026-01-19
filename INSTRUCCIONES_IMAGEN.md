## Importar Preguntas con Imagen - Instrucciones

### ✅ Implementación completada

Se ha añadido la funcionalidad para **Importar Preguntas con Imagen** en la sección de Gestión de Preguntas del panel de administración.

### 🎯 Características

1. **Nueva pestaña "Importar con Imagen"** en AdminPreguntas
2. **Subida de imagen** (formatos: jpeg, png, webp, gif; máx 2MB)
3. **Formulario completo** para crear pregunta con todos los campos
4. **Vista previa** de la imagen antes de guardar
5. **Almacenamiento** de imagen en `/uploads/preguntas/` (servido estáticamente)

### 🔧 Cambios realizados

#### Backend
- ✅ Campo `imageUrl` añadido a modelo Pregunta (schema + migración)
- ✅ Endpoint `POST /api/v1/preguntas/upload-image` con multer
- ✅ Servir archivos estáticos desde `/uploads`
- ✅ Controlador `uploadPreguntaImage` para procesar subidas
- ✅ Validación de formato y tamaño de imagen

#### Frontend
- ✅ Nueva tab "🖼️ Importar con Imagen"
- ✅ Estados para: selectedOposicionImage, selectedTemaImage, imageFile, imagePreview, imageForm
- ✅ Función `handleImageFileChange` para previsualizar imagen
- ✅ Función `handleCreateWithImage` para subir imagen + crear pregunta
- ✅ Función `resetImageForm` para limpiar formulario
- ✅ Servicio `preguntasService.uploadImage(formData)` en apiServices

### 📋 Próximos pasos

**Ejecutar después de reiniciar el servidor backend:**

```bash
cd backend
npx prisma generate
npm run dev
```

Si `prisma generate` falla por permisos:
1. Detén el servidor backend (Ctrl+C)
2. Ejecuta `npx prisma generate`
3. Reinicia el servidor

### 🖥️ Uso

1. Ir a **Gestión de Preguntas** → **Importar con Imagen**
2. Seleccionar Oposición y Tema
3. Cargar imagen (botón "Seleccionar imagen")
4. Completar formulario (enunciado, opciones A/B/C, respuesta correcta)
5. Hacer clic en **Crear Pregunta con Imagen**

La pregunta se guarda con la URL de la imagen y se puede visualizar durante los tests.
