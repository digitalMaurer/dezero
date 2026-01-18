# 🚀 INICIAR PROYECTO EN LOCAL (SIN DOCKER)

## ⚠️ REQUISITOS PREVIOS

Asegúrate de que tienes:
- ✅ Node.js v20 instalado: `node --version` → v20.16.0
- ✅ PostgreSQL 16 instalado y corriendo
- ✅ Backend con dependencias: INSTALADAS ✓
- ✅ Frontend con dependencias: INSTALADAS ✓

---

## 📝 PASO 1: Configurar Backend .env

Asegúrate que `backend/.env` tiene:

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/oposiciones_db"
JWT_SECRET=tu_super_secreto_seguro_aqui_min_32_caracteres_production
JWT_EXPIRES_IN=7d
PORT=4100
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
```

(Si no lo tienes, cópialo desde `.env.example`)

---

## 🗄️ PASO 2: Crear Base de Datos (UNA SOLA VEZ)

Abre **PowerShell** y ejecuta:

```powershell
psql -U postgres -h localhost
```

Luego dentro de psql:
```sql
CREATE DATABASE oposiciones_db;
\q
```

---

## 🔄 PASO 3: Migraciones Prisma (UNA SOLA VEZ)

En **PowerShell**:

```powershell
cd "c:\Users\ersev\Desktop\PROYECTOS WEBTEST\dezero\backend"
npm run prisma:migrate
```

Verás preguntas, responde `yes` cuando pregunte.

---

## 🚀 PASO 4: INICIAR SERVICIOS

### **TERMINAL 1 - Backend**

```powershell
cd "c:\Users\ersev\Desktop\PROYECTOS WEBTEST\dezero\backend"
npm run dev
```

**ESPERA A VER:**
```
✅ Servidor corriendo en puerto 4100
```

---

### **TERMINAL 2 - Frontend** (abre nueva terminal)

```powershell
cd "c:\Users\ersev\Desktop\PROYECTOS WEBTEST\dezero\frontend"
npm run dev
```

**ESPERA A VER:**
```
VITE v5.x.x  ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

## ✨ LISTO!

Accede a: **http://localhost:5173**

1. Crea una cuenta nueva
2. Verifica que puedes loguearte
3. Ve al Dashboard

---

## 🛑 Para parar

- Presiona `Ctrl+C` en cada terminal

---

## 📊 Próximo paso

Una vez confirmado que funciona, continuamos con:
**FASE 2: Implementar Controladores (Temas, Preguntas, Tests)**

