# 📚 SISTEMA DE TEST DE OPOSICIONES - ESPECIFICACIÓN COMPLETA (PARTE 2/2)

## 📋 TABLA DE CONTENIDOS - PARTE 2
1. [API REST Endpoints](#api-endpoints)
2. [Funcionalidades Detalladas](#funcionalidades)
3. [Docker Compose Setup](#docker-compose)
4. [Variables de Entorno](#variables-de-entorno)
5. [Comandos de Desarrollo](#comandos)
6. [Seeders y Datos Iniciales](#seeders)
7. [Testing](#testing)
8. [Deployment](#deployment)

---

## 🌐 API REST ENDPOINTS

### Base URL
```
http://localhost/api/v1
```

### 🔐 Autenticación (`/auth`)

```http
POST   /auth/register          # Registro de usuario
POST   /auth/login             # Login (retorna JWT)
POST   /auth/logout            # Logout
GET    /auth/me                # Obtener usuario actual
POST   /auth/refresh           # Refrescar token JWT
POST   /auth/forgot-password   # Solicitar reset de contraseña
POST   /auth/reset-password    # Resetear contraseña con token
```

**Ejemplo Request - Register:**
```json
POST /auth/register
{
  "email": "usuario@example.com",
  "username": "estudiante01",
  "password": "password123",
  "nombre": "Juan",
  "apellidos": "García López"
}
```

**Ejemplo Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-123",
      "email": "usuario@example.com",
      "username": "estudiante01",
      "role": "STUDENT"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 👤 Usuarios (`/users`)

```http
GET    /users                  # [ADMIN] Listar usuarios
GET    /users/:id              # [ADMIN] Ver usuario
PUT    /users/:id              # [ADMIN/OWNER] Actualizar usuario
DELETE /users/:id              # [ADMIN] Eliminar usuario
PUT    /users/:id/role         # [ADMIN] Cambiar rol
```

---

### 📚 Oposiciones (`/oposiciones`)

```http
GET    /oposiciones            # Listar todas las oposiciones
GET    /oposiciones/:id        # Ver oposición específica
POST   /oposiciones            # [ADMIN] Crear oposición
PUT    /oposiciones/:id        # [ADMIN] Actualizar oposición
DELETE /oposiciones/:id        # [ADMIN] Eliminar oposición
GET    /oposiciones/:id/temas  # Obtener temas de una oposición
```

**Ejemplo Request - Crear Oposición:**
```json
POST /oposiciones
{
  "nombre": "Policía Nacional",
  "codigo": "CNP",
  "descripcion": "Cuerpo Nacional de Policía - Escala Básica"
}
```

---

### 📖 Temas (`/temas`)

```http
GET    /temas                  # Listar todos los temas
GET    /temas/:id              # Ver tema específico
POST   /temas                  # [ADMIN] Crear tema
PUT    /temas/:id              # [ADMIN] Actualizar tema
DELETE /temas/:id              # [ADMIN] Eliminar tema
GET    /temas/:id/preguntas    # Obtener preguntas de un tema
```

**Ejemplo Request - Crear Tema:**
```json
POST /temas
{
  "nombre": "Constitución Española",
  "descripcion": "Estructura, principios y derechos fundamentales",
  "oposicionId": "uuid-oposicion",
  "orden": 1
}
```

---

### ❓ Preguntas (`/preguntas`)

```http
GET    /preguntas                      # Listar preguntas (con filtros)
GET    /preguntas/:id                  # Ver pregunta específica
POST   /preguntas                      # [ADMIN] Crear pregunta
PUT    /preguntas/:id                  # [ADMIN] Actualizar pregunta
DELETE /preguntas/:id                  # [ADMIN] Eliminar pregunta
POST   /preguntas/batch                # [ADMIN] Crear múltiples preguntas
GET    /preguntas/random               # Obtener preguntas aleatorias
POST   /preguntas/:id/report           # Reportar pregunta errónea
GET    /preguntas/reportadas           # [ADMIN] Ver preguntas reportadas
PUT    /preguntas/:id/resolve-report   # [ADMIN] Resolver reporte
```

**Query Params para GET /preguntas:**
```
?temaId=uuid         # Filtrar por tema
&dificultad=2        # Filtrar por dificultad (1, 2, 3)
&oposicionId=uuid    # Filtrar por oposición
&isActive=true       # Solo activas
&reportada=true      # Solo reportadas
&page=1              # Paginación
&limit=20            # Resultados por página
```

**Ejemplo Request - Crear Pregunta:**
```json
POST /preguntas
{
  "enunciado": "De conformidad con el artículo 27 de la CE, ¿qué derecho se reconoce?",
  "opciones": {
    "A": "Todos tienen derecho a la petición individual o colectiva",
    "B": "Todos tienen derecho a la educación",
    "C": "Todos tienen derecho a la huelga",
    "D": "El derecho a contraer matrimonio"
  },
  "respuestaCorrecta": "B",
  "explicacion": "El artículo 27 CE reconoce el derecho a la educación.",
  "claveResolucion": "Art. 27 CE",
  "temaId": "uuid-tema-constitucion",
  "dificultad": 2
}
```

**Ejemplo Request - Batch Import:**
```json
POST /preguntas/batch
{
  "preguntas": [
    {
      "enunciado": "...",
      "opciones": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "respuestaCorrecta": "A",
      "temaId": "uuid-tema",
      "dificultad": 2
    },
    // ... más preguntas
  ]
}
```

---

### 📝 Tests (`/tests`)

```http
GET    /tests                  # Listar tests guardados
GET    /tests/:id              # Ver test específico
POST   /tests                  # Crear configuración de test
PUT    /tests/:id              # Actualizar test
DELETE /tests/:id              # Eliminar test
POST   /tests/generate         # Generar test aleatorio
```

**Ejemplo Request - Generar Test Aleatorio:**
```json
POST /tests/generate
{
  "oposicionId": "uuid-oposicion",
  "cantidadPreguntas": 25,
  "temaIds": ["uuid-tema-1", "uuid-tema-2"],  // Vacío = todos
  "dificultad": null,                         // null = mixto
  "tipoTest": "ALEATORIO"
}
```

**Ejemplo Response:**
```json
{
  "success": true,
  "data": {
    "testId": "uuid-test",
    "preguntas": [
      {
        "id": "uuid-pregunta-1",
        "enunciado": "...",
        "opciones": { "A": "...", "B": "...", "C": "...", "D": "..." },
        "temaId": "uuid-tema",
        "dificultad": 2
        // NO incluye respuestaCorrecta ni explicacion
      },
      // ... 24 preguntas más
    ]
  }
}
```

---

### 📊 Intentos (`/intentos`)

```http
GET    /intentos               # Listar intentos del usuario actual
GET    /intentos/:id           # Ver intento específico (con respuestas)
POST   /intentos               # Iniciar nuevo intento
PUT    /intentos/:id           # Actualizar intento (guardar progreso)
POST   /intentos/:id/submit    # Finalizar y corregir intento
DELETE /intentos/:id           # Eliminar intento
```

**Ejemplo Request - Iniciar Intento:**
```json
POST /intentos
{
  "testId": "uuid-test",
  "configuracion": {
    "cantidadPreguntas": 25,
    "dificultad": null,
    "temaIds": ["uuid-tema-1", "uuid-tema-2"]
  }
}
```

**Ejemplo Request - Submit (Finalizar Test):**
```json
POST /intentos/:id/submit
{
  "respuestas": [
    {
      "preguntaId": "uuid-pregunta-1",
      "respuestaUsuario": "A",
      "tiempoSeg": 45
    },
    {
      "preguntaId": "uuid-pregunta-2",
      "respuestaUsuario": null,  // En blanco
      "tiempoSeg": 20
    },
    // ... resto de respuestas
  ],
  "duracionTotalSeg": 1800
}
```

**Ejemplo Response - Submit:**
```json
{
  "success": true,
  "data": {
    "intentoId": "uuid-intento",
    "puntuacion": 7.6,
    "aciertos": 19,
    "fallos": 4,
    "enBlanco": 2,
    "totalPreguntas": 25,
    "duracionSeg": 1800,
    "respuestas": [
      {
        "preguntaId": "uuid-pregunta-1",
        "respuestaUsuario": "A",
        "respuestaCorrecta": "B",
        "esCorrecta": false,
        "explicacion": "..."
      },
      // ... todas las respuestas con corrección
    ]
  }
}
```

---

### 📈 Estadísticas (`/stats`)

```http
GET    /stats/general          # Estadísticas generales del usuario
GET    /stats/por-tema         # Estadísticas desglosadas por tema
GET    /stats/por-dificultad   # Estadísticas por dificultad
GET    /stats/historico        # Histórico de intentos (gráfica)
GET    /stats/preguntas-dificiles  # Preguntas más falladas
```

**Ejemplo Response - Estadísticas Generales:**
```json
{
  "success": true,
  "data": {
    "totalIntentos": 15,
    "promedioAciertos": 18.2,
    "promedioFallos": 5.1,
    "promedioEnBlanco": 1.7,
    "mejorPuntuacion": 9.2,
    "tasaAcierto": 72.8,
    "tiempoPromedioSeg": 1650,
    "preguntasRespondidas": 375,
    "temasMasFuertes": [
      { "temaId": "uuid-tema-1", "nombre": "Constitución", "tasaAcierto": 85.5 }
    ],
    "temasMasDebiles": [
      { "temaId": "uuid-tema-2", "nombre": "Derecho Penal", "tasaAcierto": 62.1 }
    ]
  }
}
```

---

### 📥 Importación (`/import`)

```http
POST   /import/legacy          # Importar desde formato legacy (pipe-separated)
POST   /import/csv             # Importar desde CSV
POST   /import/json            # Importar desde JSON
GET    /import/templates       # Descargar templates de importación
```

**Ejemplo Request - Import Legacy:**
```json
POST /import/legacy
{
  "temaId": "uuid-tema-constitucion",
  "content": "p1|De conformidad con el artículo 27 CE:|Opción A|Opción B|Opción C|Opción D|B|Constitución Española|2|ADMINISTRATIVO||Art. 27 CE\np2|De acuerdo con el artículo 104 CE:|Opción A|Opción B|Opción C|Opción D|A|Constitución Española|2|ADMINISTRATIVO||Art. 104 CE"
}
```

**Formato Legacy (Pipe-Separated):**
```
ID | Enunciado | OpcionA | OpcionB | OpcionC | OpcionD | RespuestaCorrecta | Tema | Dificultad | Categoria | Explicacion | ClaveResolucion
```

---

## 🔧 FUNCIONALIDADES DETALLADAS

### 1️⃣ Sistema de Autenticación

**Características:**
- ✅ Registro con validación de email único
- ✅ Login con JWT (access token + refresh token)
- ✅ Middleware de autenticación en rutas protegidas
- ✅ Roles: ADMIN y STUDENT
- ✅ Reset de contraseña por email (opcional)
- ✅ Rate limiting en endpoints de auth

**Flujo JWT:**
```
1. User Login → Backend valida → Retorna Access Token (15min) + Refresh Token (7d)
2. Frontend guarda tokens en localStorage
3. Cada request incluye: Authorization: Bearer <access_token>
4. Si access token expira → Frontend usa refresh token → Obtiene nuevo access token
5. Si refresh token expira → Redirigir a login
```

---

### 2️⃣ Configuración y Generación de Tests

**Flujo de Creación:**
```
1. Usuario selecciona:
   - Oposición (opcional)
   - Temas (múltiples o todos)
   - Dificultad (1, 2, 3 o mixto)
   - Cantidad de preguntas (5-100)
   - Tipo de test

2. Backend genera:
   - Selección aleatoria de preguntas según filtros
   - Mezcla aleatoria del orden
   - Mezcla aleatoria de las opciones A/B/C/D

3. Retorna:
   - ID del test generado
   - Array de preguntas SIN respuestas correctas
   - Solo incluye: id, enunciado, opciones, tema, dificultad
```

**Tipos de Test:**
- **ALEATORIO**: Preguntas aleatorias según filtros
- **OFICIAL**: Basado en convocatorias reales
- **SIMULACRO**: Simulacro de examen con tiempo
- **PERSONALIZADO**: Preguntas seleccionadas manualmente

---

### 3️⃣ Realización de Tests

**Flujo:**
```
1. POST /intentos → Crea intento, retorna preguntas
2. Usuario responde preguntas (frontend guarda respuestas localmente)
3. Usuario puede guardar progreso: PUT /intentos/:id
4. Usuario finaliza: POST /intentos/:id/submit
5. Backend corrige y retorna resultados detallados
```

**Funcionalidades del Runner:**
- ⏱️ Temporizador opcional con cuenta regresiva
- 💾 Auto-guardado de progreso cada 30 segundos
- 🔄 Navegación entre preguntas con estado
- ⚠️ Marcado de preguntas para revisión
- 📊 Barra de progreso visual
- ⌨️ Atajos de teclado (1-4 para A-D, Espacio para marcar, etc.)

---

### 4️⃣ Corrección y Resultados

**Algoritmo de Puntuación:**
```javascript
// Modelo: Acierto +1, Fallo -0.25, Blanco 0
puntuacion = (aciertos * 1) + (fallos * -0.25);
puntuacionSobre10 = (puntuacion / totalPreguntas) * 10;
tasaAcierto = (aciertos / totalPreguntas) * 100;
```

**Pantalla de Resultados:**
```
┌─────────────────────────────────┐
│  RESULTADOS DEL TEST            │
│                                 │
│  Puntuación: 7.6 / 10          │
│  ✓ Aciertos:   19 (76%)        │
│  ✗ Fallos:     4  (16%)        │
│  ○ En blanco:  2  (8%)         │
│  ⏱ Duración:   30:15           │
│                                 │
│  [Ver Repaso Detallado]        │
│  [Repetir Test]                │
│  [Volver a Inicio]             │
└─────────────────────────────────┘
```

---

### 5️⃣ Repaso y Revisión

**Pantalla de Repaso:**
- Muestra todas las preguntas con:
  - ✓ Respuesta del usuario
  - ✓ Respuesta correcta
  - ✓ Explicación detallada
  - ✓ Clave de resolución (normativa)
  - ✓ Indicador visual (verde/rojo/gris)
  
- Filtros:
  - Ver solo incorrectas
  - Ver solo en blanco
  - Ver solo correctas
  - Ver todas

---

### 6️⃣ Estadísticas y Analytics

**Dashboard de Estadísticas:**

1. **Gráfico de Evolución (Line Chart)**
   - Eje X: Fecha de intentos
   - Eje Y: Puntuación
   - Muestra tendencia de mejora

2. **Gráfico por Temas (Bar Chart)**
   - Eje X: Nombre del tema
   - Eje Y: Tasa de acierto %
   - Identifica puntos fuertes y débiles

3. **Gráfico por Dificultad (Pie Chart)**
   - Distribución de respuestas por nivel
   - Ayuda a identificar nivel actual

4. **Tabla de Histórico**
   - Fecha, Test, Puntuación, Duración
   - Ordenable y filtrable

5. **Preguntas Más Difíciles**
   - Top 10 preguntas más falladas
   - Incluye enlace a repaso

---

### 7️⃣ Panel de Mantenimiento (Admin)

**Gestión de Preguntas:**
- ✅ Listado con filtros avanzados
- ✅ Búsqueda por texto en enunciado
- ✅ Edición inline o modal
- ✅ Eliminación con confirmación
- ✅ Vista previa de cómo se verá en test
- ✅ Marcado de preguntas reportadas
- ✅ Cambio de tema/dificultad masivo

**Importación Masiva:**
```
┌─────────────────────────────────┐
│  IMPORTAR PREGUNTAS             │
│                                 │
│  Formato: Legacy (Pipe)         │
│  Tema destino: [Constitución▼] │
│                                 │
│  ┌──────────────────────────┐   │
│  │ p1|Enunciado|A|B|C|D|... │   │
│  │ p2|Enunciado|A|B|C|D|... │   │
│  └──────────────────────────┘   │
│                                 │
│  [Vista Previa]  [Importar]    │
└─────────────────────────────────┘
```

**Parser Legacy:**
```javascript
// Formato: ID | Enunciado | A | B | C | D | Correcta | Tema | Diff | Cat | Expl | Clave
function parseLegacyLine(line) {
  const parts = line.split('|').map(p => p.trim());
  
  return {
    // ID se ignora, se genera UUID
    enunciado: parts[1],
    opciones: {
      A: parts[2],
      B: parts[3],
      C: parts[4],
      D: parts[5]
    },
    respuestaCorrecta: parts[6],
    // Tema se mapea a temaId mediante nombre
    dificultad: parseInt(parts[8]) || 2,
    explicacion: parts[10] || null,
    claveResolucion: parts[11] || null
  };
}
```

---

### 8️⃣ Sistema de Reportes

**Flujo de Reporte:**
```
1. Usuario encuentra error en pregunta durante test
2. Marca con botón "Reportar Error"
3. Escribe motivo: "Respuesta incorrecta" o "Enunciado confuso"
4. Backend marca pregunta: reportadaRevision = true
5. Admin ve lista de preguntas reportadas
6. Admin revisa y corrige
7. Admin resuelve reporte: reportadaRevision = false
```

---

## 🐳 DOCKER COMPOSE SETUP

### docker-compose.yml

```yaml
version: '3.8'

services:
  # ==================== POSTGRESQL ====================
  postgres:
    image: postgres:16-alpine
    container_name: opposition-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: opposition_db
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - opposition-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d opposition_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ==================== BACKEND ====================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: opposition-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/opposition_db
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      PORT: 4100
    ports:
      - "4100:4100"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    networks:
      - opposition-network
    command: npm run start:prod

  # ==================== FRONTEND ====================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: http://localhost/api/v1
    container_name: opposition-frontend
    restart: unless-stopped
    ports:
      - "5173:80"
    depends_on:
      - backend
    networks:
      - opposition-network

  # ==================== NGINX ====================
  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    container_name: opposition-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - opposition-network

networks:
  opposition-network:
    driver: bridge

volumes:
  postgres_data:
```

### backend/Dockerfile

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Exponer puerto
EXPOSE 4100

# Comando de inicio
CMD ["npm", "run", "start:prod"]
```

### frontend/Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

# Argumentos de build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar código y construir
COPY . .
RUN npm run build

# Servidor estático con Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx/nginx.conf

```nginx
events {
  worker_connections 1024;
}

http {
  upstream backend {
    server backend:4100;
  }

  upstream frontend {
    server frontend:80;
  }

  server {
    listen 80;
    server_name localhost;

    # Frontend
    location / {
      proxy_pass http://frontend;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
      proxy_pass http://backend;
      proxy_http_version 1.1;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header Host $host;
    }
  }
}
```

---

## 🔐 VARIABLES DE ENTORNO

### .env (Root)

```bash
# ====================  GENERAL ====================
NODE_ENV=development
APP_NAME=Opposition System
APP_URL=http://localhost

# ==================== DATABASE ====================
DB_PASSWORD=supersecretpassword123

# ==================== BACKEND ====================
PORT=4100
DATABASE_URL=postgresql://admin:${DB_PASSWORD}@localhost:5432/opposition_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# ==================== FRONTEND ====================
VITE_API_URL=http://localhost/api/v1
```

---

## ⚡ COMANDOS DE DESARROLLO

### 🚀 Inicio del Proyecto (UN SOLO COMANDO)

```bash
# Iniciar todo el stack
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Verificar que todos los servicios estén corriendo
docker-compose ps
```

**Output esperado:**
```
NAME                   STATUS    PORTS
opposition-nginx       Up        0.0.0.0:80->80/tcp
opposition-frontend    Up        0.0.0.0:5173->80/tcp
opposition-backend     Up        0.0.0.0:4100->4100/tcp
opposition-db          Up        0.0.0.0:5432->5432/tcp
```

### 🛑 Detener el Proyecto (UN SOLO COMANDO)

```bash
# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (CUIDADO: Elimina la BD)
docker-compose down -v
```

### 🔧 Desarrollo Local (Sin Docker)

```bash
# ==================== BACKEND ====================
cd backend

# Instalar dependencias
npm install

# Configurar base de datos
cp .env.example .env
# Editar .env con tus credenciales

# Crear base de datos y ejecutar migraciones
npx prisma migrate dev

# Generar Prisma Client
npx prisma generate

# Seed (datos iniciales)
npm run seed

# Iniciar en modo desarrollo
npm run dev

# ==================== FRONTEND ====================
cd frontend

# Instalar dependencias
npm install

# Configurar variables
cp .env.example .env

# Iniciar en modo desarrollo
npm run dev
```

### 🗄️ Comandos de Base de Datos

```bash
# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones en producción
npx prisma migrate deploy

# Reset completo de BD (CUIDADO)
npx prisma migrate reset

# Abrir Prisma Studio (GUI de BD)
npx prisma studio

# Generar Prisma Client
npx prisma generate
```

### 📦 Build para Producción

```bash
# Build completo con Docker
docker-compose -f docker-compose.prod.yml build

# Build solo del backend
cd backend && npm run build

# Build solo del frontend
cd frontend && npm run build
```

---

## 🌱 SEEDERS Y DATOS INICIALES

### prisma/seed.js

```javascript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // 1️⃣ Crear usuario admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@opposition.com' },
    update: {},
    create: {
      email: 'admin@opposition.com',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
      nombre: 'Administrador',
      apellidos: 'Sistema'
    }
  });
  console.log('✅ Usuario admin creado');

  // 2️⃣ Crear oposiciones
  const oposicionCNP = await prisma.oposicion.create({
    data: {
      nombre: 'Policía Nacional',
      codigo: 'CNP',
      descripcion: 'Cuerpo Nacional de Policía - Escala Básica'
    }
  });

  const oposicionGC = await prisma.oposicion.create({
    data: {
      nombre: 'Guardia Civil',
      codigo: 'GC',
      descripcion: 'Guardia Civil - Escala de Cabos y Guardias'
    }
  });
  console.log('✅ Oposiciones creadas');

  // 3️⃣ Crear temas
  const temaConstitucion = await prisma.tema.create({
    data: {
      nombre: 'Constitución Española',
      descripcion: 'Estructura, principios constitucionales y derechos fundamentales',
      orden: 1,
      oposicionId: oposicionCNP.id
    }
  });

  const temaDerecho = await prisma.tema.create({
    data: {
      nombre: 'Derecho Penal',
      descripcion: 'Delitos y penas del Código Penal',
      orden: 2,
      oposicionId: oposicionCNP.id
    }
  });
  console.log('✅ Temas creados');

  // 4️⃣ Crear preguntas de ejemplo
  const pregunta1 = await prisma.pregunta.create({
    data: {
      enunciado: 'De conformidad con el artículo 27 de la Constitución Española:',
      opciones: {
        A: 'Todos tienen derecho a la petición individual o colectiva',
        B: 'Todos tienen derecho a la educación',
        C: 'Todos tienen derecho a la huelga',
        D: 'El derecho a contraer matrimonio con plena igualdad jurídica'
      },
      respuestaCorrecta: 'B',
      explicacion: 'El artículo 27 de la CE reconoce el derecho a la educación.',
      claveResolucion: 'Art. 27 CE',
      temaId: temaConstitucion.id,
      dificultad: 2
    }
  });

  const pregunta2 = await prisma.pregunta.create({
    data: {
      enunciado: 'De acuerdo con el artículo 104 de la CE, las funciones, principios básicos de actuación y estatutos de las FCSE, serán determinadas por:',
      opciones: {
        A: 'Ley Orgánica',
        B: 'Ley de Bases',
        C: 'Real Decreto',
        D: 'Orden Ministerial'
      },
      respuestaCorrecta: 'A',
      explicacion: 'El art. 104 CE establece que será una Ley Orgánica.',
      claveResolucion: 'Art. 104 CE',
      temaId: temaConstitucion.id,
      dificultad: 2
    }
  });
  console.log('✅ Preguntas de ejemplo creadas');

  console.log('🎉 Seed completado!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Ejecutar Seed:**
```bash
npm run seed
```

---

## 🧪 TESTING

### Backend Tests (Jest)

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Coverage
npm run test:coverage

# Tests e2e
npm run test:e2e
```

**Estructura de Tests:**
```
backend/src/
└── __tests__/
    ├── auth.test.js
    ├── preguntas.test.js
    ├── tests.test.js
    └── stats.test.js
```

### Frontend Tests (Vitest)

```bash
# Ejecutar tests
npm test

# Coverage
npm run test:coverage
```

---

## 🚀 DEPLOYMENT

### Producción con Docker

```bash
# Build de imágenes
docker-compose -f docker-compose.prod.yml build

# Iniciar en modo producción
docker-compose -f docker-compose.prod.yml up -d

# Ejecutar migraciones
docker-compose exec backend npx prisma migrate deploy

# Ejecutar seed
docker-compose exec backend npm run seed
```

### Variables de Entorno Producción

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@db-host:5432/opposition_prod
JWT_SECRET=<generar-secret-seguro>
JWT_REFRESH_SECRET=<generar-secret-seguro>
CORS_ORIGIN=https://yourdomain.com
```

---

## 📚 RESUMEN DE COMANDOS CLAVE

```bash
# ==================== INICIO RÁPIDO ====================
docker-compose up -d              # Iniciar todo
docker-compose down               # Detener todo

# ==================== DESARROLLO ====================
npm run dev                       # Dev backend
npm run dev                       # Dev frontend (en carpeta frontend)

# ==================== BASE DE DATOS ====================
npx prisma migrate dev            # Nueva migración
npx prisma studio                 # GUI de BD
npm run seed                      # Datos iniciales

# ==================== LOGS ====================
docker-compose logs -f            # Ver logs en vivo
docker-compose logs backend       # Logs del backend
docker-compose logs frontend      # Logs del frontend

# ==================== LIMPIEZA ====================
docker-compose down -v            # Detener y eliminar volúmenes
docker system prune -a            # Limpiar Docker completo
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Configurar Prisma schema
- [ ] Crear migraciones iniciales
- [ ] Implementar módulos (auth, users, oposiciones, temas, preguntas, tests, intentos, stats)
- [ ] Configurar JWT y middleware de auth
- [ ] Validación con Zod en todos los endpoints
- [ ] Tests unitarios y e2e
- [ ] Documentación Swagger

### Frontend
- [ ] Configurar React + Vite
- [ ] Implementar routing con React Router
- [ ] Configurar Zustand stores
- [ ] Diseñar components con MUI
- [ ] Implementar páginas (Dashboard, TestRunner, Stats, Admin)
- [ ] Configurar Axios client con interceptors JWT
- [ ] Tests con Vitest

### DevOps
- [ ] Dockerfile backend
- [ ] Dockerfile frontend
- [ ] Docker Compose completo
- [ ] Nginx reverse proxy
- [ ] Variables de entorno
- [ ] Scripts de seed
- [ ] CI/CD (opcional)

---

**🎉 FIN DE LA ESPECIFICACIÓN COMPLETA**

Este documento contiene toda la información necesaria para que una IA (o un equipo de desarrollo) pueda recrear el proyecto completo desde cero con tecnologías modernas.

