# 🚀 GUÍA DE DESARROLLO LOCAL (SIN DOCKER)

## ✅ Requisitos
- [x] Node.js v20+ instalado
- [ ] PostgreSQL 16 instalado en tu PC

---

## 📥 Paso 1: Instalar PostgreSQL

Descarga e instala:
https://www.postgresql.org/download/windows/

**Durante la instalación:**
- Usuario: `postgres`
- Contraseña: `postgres123`
- Puerto: `5432`

Luego reinicia tu PC.

---

## 🔧 Paso 2: Crear Base de Datos

Abre PowerShell y ejecuta:

```powershell
psql -U postgres -h localhost -d postgres
```

Luego dentro de psql:
```sql
CREATE DATABASE oposiciones_db;
\q
```

---

## 🚀 Paso 3: Backend

**Terminal 1:**

```powershell
cd "c:\Users\ersev\Desktop\PROYECTOS WEBTEST\dezero\backend"

# Primera vez (crear tablas):
npm run prisma:migrate

# Iniciar servidor:
npm run dev
```

Deberías ver:
```
✅ Servidor corriendo en puerto 4100
```

---

## 🎨 Paso 4: Frontend

**Terminal 2:**

```powershell
cd "c:\Users\ersev\Desktop\PROYECTOS WEBTEST\dezero\frontend"
npm run dev
```

Deberías ver:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
```

---

## ✨ Acceso

- Frontend: **http://localhost:5173**
- Backend: **http://localhost:4100/api/v1**

**Crea una cuenta de prueba y logúeate.**

---

## 📊 Comandos Útiles Backend

```powershell
# Ver interfaz gráfica de BD
npm run prisma:studio

# Crear nueva migración
npm run prisma:migrate

# Generar cliente Prisma
npm run prisma:generate

# Cargar datos de prueba
npm run prisma:seed

# Tests
npm test
```

---

## 🛑 Parar servicios

- `Ctrl+C` en cada terminal

---

**¡Listo! Ahora continuamos con la Fase 2: Controladores del Backend**
