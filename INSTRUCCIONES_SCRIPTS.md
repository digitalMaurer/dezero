# 🚀 Scripts de Inicio y Detención

## 📂 Archivos Disponibles

Se han creado **4 scripts ejecutables** para facilitar el uso del sistema:

### Opción 1: Scripts `.bat` (Recomendado - Más Compatible)
- **INICIAR.bat** - Inicia el sistema completo
- **DETENER.bat** - Detiene el sistema completo

### Opción 2: Scripts `.ps1` (PowerShell)
- **INICIAR.ps1** - Inicia el sistema (con colores y más detalles)
- **DETENER.ps1** - Detiene el sistema (con colores y más detalles)

---

## ✅ Cómo Usar los Scripts `.bat`

### Para INICIAR el Sistema:

1. **Haz doble clic** en `INICIAR.bat`
2. Se abrirán **2 ventanas de terminal**:
   - ✅ Backend (puerto 4100)
   - ✅ Frontend (puerto 5173)
3. Espera a que aparezca el mensaje de éxito
4. Presiona cualquier tecla para **abrir el navegador automáticamente**
5. El sistema estará listo en http://localhost:5173

### Para DETENER el Sistema:

1. **Haz doble clic** en `DETENER.bat`
2. El script detendrá automáticamente:
   - ❌ Backend (puerto 4100)
   - ❌ Frontend (puerto 5173)
3. Se cerrarán las ventanas de terminal
4. Presiona cualquier tecla para cerrar el script

---

## 💻 Cómo Usar los Scripts `.ps1`

### Configuración Inicial (Solo la Primera Vez)

Si es la primera vez que usas scripts PowerShell, puede que necesites habilitar la ejecución:

```powershell
# Ejecutar como Administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Para INICIAR el Sistema:

**Opción A - Doble Clic:**
1. Haz clic derecho en `INICIAR.ps1`
2. Selecciona "Ejecutar con PowerShell"

**Opción B - PowerShell:**
```powershell
cd "c:\Users\ersev\Desktop\PROYECTOS WEBTEST\dezero"
.\INICIAR.ps1
```

### Para DETENER el Sistema:

**Opción A - Doble Clic:**
1. Haz clic derecho en `DETENER.ps1`
2. Selecciona "Ejecutar con PowerShell"

**Opción B - PowerShell:**
```powershell
cd "c:\Users\ersev\Desktop\PROYECTOS WEBTEST\dezero"
.\DETENER.ps1
```

---

## 🎯 Comparación de Scripts

| Característica | `.bat` | `.ps1` |
|----------------|--------|--------|
| Compatibilidad | ✅ Todos los Windows | ⚠️ Requiere PowerShell |
| Doble clic directo | ✅ Sí | ⚠️ Clic derecho + menu |
| Colores en consola | ❌ No | ✅ Sí |
| Mensajes detallados | ⚠️ Básicos | ✅ Completos |
| Verificación de puertos | ⚠️ Básica | ✅ Avanzada |
| **Recomendado para** | Usuarios normales | Usuarios avanzados |

---

## 📝 Lo que Hacen los Scripts

### INICIAR
1. ✅ Verifica si ya hay procesos corriendo
2. ✅ Inicia el backend en una terminal separada
3. ✅ Inicia el frontend en otra terminal
4. ✅ Espera a que todo esté listo
5. ✅ Abre el navegador automáticamente
6. ✅ Muestra las URLs de acceso

### DETENER
1. ❌ Busca procesos en puerto 4100 (Backend)
2. ❌ Busca procesos en puerto 5173 (Frontend)
3. ❌ Detiene ambos procesos de forma segura
4. ❌ Cierra las ventanas de terminal
5. ❌ Confirma que todo se detuvo correctamente

---

## 🔧 Solución de Problemas

### Problema: "El script no hace nada al hacer doble clic"
**Solución para .bat:**
- Ejecuta como Administrador (clic derecho → "Ejecutar como administrador")

**Solución para .ps1:**
- Habilita la ejecución de scripts (ver "Configuración Inicial" arriba)

### Problema: "Puerto ya en uso"
**Solución:**
1. Ejecuta `DETENER.bat` o `DETENER.ps1`
2. Espera 5 segundos
3. Vuelve a ejecutar `INICIAR.bat` o `INICIAR.ps1`

### Problema: "No se abre el navegador"
**Solución:**
- Abre manualmente http://localhost:5173 en tu navegador
- El sistema está corriendo aunque no se abra automáticamente

### Problema: Las terminales se cierran inmediatamente
**Causas posibles:**
1. No se instalaron las dependencias
   ```powershell
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

2. Node.js no está instalado
   - Verifica con: `node --version`
   - Descarga de: https://nodejs.org

---

## 🎨 Personalización

### Cambiar los puertos:

Si necesitas usar otros puertos, edita:

**Para Backend:**
1. Abre `backend/.env`
2. Cambia `PORT=4100` por el puerto deseado

**Para Frontend:**
1. Abre `frontend/vite.config.js`
2. Cambia el puerto en la configuración del servidor

**Luego actualiza los scripts:**
- Busca `4100` y `5173` en los archivos `.bat` o `.ps1`
- Reemplaza por los nuevos puertos

---

## 📌 Atajos de Teclado Útiles

Cuando las terminales están abiertas:

- **Ctrl + C** - Detener el servidor en esa terminal
- **Ctrl + Z** - Suspender (no recomendado)
- **Cerrar ventana (X)** - Cierra pero el proceso sigue corriendo ⚠️

**Importante:** Si cierras las ventanas con la X, los procesos seguirán corriendo. Usa `DETENER.bat` para cerrarlos correctamente.

---

## ✨ Ventajas de Usar los Scripts

### Sin Scripts (Manual)
```powershell
# Terminal 1
cd backend
npm run dev

# Terminal 2 (otra terminal)
cd frontend
npm run dev

# Navegador (manual)
# Abrir http://localhost:5173

# Para detener
# Ctrl+C en cada terminal
```

### Con Scripts (Automatizado)
```powershell
# Doble clic en INICIAR.bat
# ¡Todo automático!

# Doble clic en DETENER.bat
# ¡Todo limpio!
```

**Ahorro de tiempo:** ⏱️ ~30 segundos cada vez

---

## 🚦 Indicadores de Estado

### Backend Iniciado Correctamente
```
✅ Servidor corriendo en puerto 4100
✅ Base de datos conectada
```

### Frontend Iniciado Correctamente
```
VITE v5.4.21  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Sistema Detenido Correctamente
```
✅ Backend detenido
✅ Frontend detenido
✅ Puertos liberados
```

---

## 📖 Guía Rápida

### Primera Vez
1. ✅ Instalar dependencias: `npm install` en backend y frontend (ya hecho)
2. ✅ Ejecutar migraciones: `npx prisma migrate dev` (ya hecho)
3. ✅ Cargar datos: `npm run seed` (ya hecho)
4. 🚀 Doble clic en `INICIAR.bat`

### Uso Diario
1. 🚀 Doble clic en `INICIAR.bat`
2. 💻 Trabajar en el sistema
3. ❌ Doble clic en `DETENER.bat`

### Si Cambias el Código
- **Backend:** El servidor se reinicia automáticamente (nodemon)
- **Frontend:** Los cambios se reflejan automáticamente (Vite HMR)
- **No necesitas detener/iniciar** mientras desarrollas

---

## 🎯 Recomendaciones

### Para Usuarios Normales
✅ Usa los scripts `.bat` (INICIAR.bat y DETENER.bat)
- Más simple
- Doble clic directo
- Funciona siempre

### Para Desarrolladores
✅ Usa los scripts `.ps1` (INICIAR.ps1 y DETENER.ps1)
- Mensajes con colores
- Verificaciones avanzadas
- Mejor feedback

---

## 📞 ¿Necesitas Ayuda?

Si los scripts no funcionan:

1. **Verifica Node.js:**
   ```powershell
   node --version
   npm --version
   ```

2. **Verifica las dependencias:**
   ```powershell
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

3. **Verifica la base de datos:**
   ```powershell
   cd backend
   npx prisma migrate dev
   npm run seed
   ```

4. **Cierra procesos manualmente:**
   ```powershell
   Get-Process node | Stop-Process -Force
   ```

---

**¡Disfruta del sistema con un solo clic!** 🚀
