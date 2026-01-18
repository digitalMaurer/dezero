# 📚 SISTEMA DE TEST DE OPOSICIONES - ESPECIFICACIÓN COMPLETA (PARTE 1/2)

## 📋 TABLA DE CONTENIDOS - PARTE 1
1. [Visión General del Proyecto](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura del Sistema](#arquitectura)
4. [Estructura de Carpetas](#estructura-de-carpetas)
5. [Base de Datos PostgreSQL](#base-de-datos)
6. [Modelos de Datos](#modelos-de-datos)

---

## 🎯 VISIÓN GENERAL DEL PROYECTO

### Descripción
Sistema web completo para **preparación de oposiciones** que permite gestionar preguntas, realizar tests personalizados, llevar estadísticas detalladas de rendimiento y mantener un repositorio organizado de contenido de estudio.

### Objetivos Principales
- **Gestión de Preguntas**: CRUD completo con importación masiva desde formatos legacy
- **Sistema de Tests**: Generación de tests aleatorios filtrados por tema, dificultad y oposición
- **Seguimiento de Progreso**: Estadísticas detalladas por usuario, tema y pregunta
- **Mantenimiento de Contenido**: Panel administrativo para gestionar preguntas, temas y oposiciones
- **Importación Legacy**: Soporte para importar preguntas desde formatos de texto pipe-separated

### Características Clave
✅ **Autenticación**: Sistema completo de usuarios con roles (admin/estudiante)  
✅ **Tests Personalizados**: Configuración avanzada (cantidad, tema, dificultad, modo)  
✅ **Corrección Automática**: Feedback inmediato con explicaciones  
✅ **Estadísticas Avanzadas**: Gráficos de progreso, análisis por tema, histórico de intentos  
✅ **Gestión Modular**: Oposiciones → Temas → Preguntas (jerarquía completa)  
✅ **Reportes de Errores**: Sistema para marcar preguntas incorrectas para revisión  
✅ **Importación Masiva**: Parser inteligente de formatos legacy  
✅ **Responsive**: Diseño adaptable a móviles y tablets  

---

## 🛠️ STACK TECNOLÓGICO

### Frontend
```yaml
Framework: React 18+
Build Tool: Vite 5+
Routing: React Router DOM v6
State Management: Zustand (o Context API)
UI Components: Material-UI (MUI) v5
Charts: Chart.js 4+ con react-chartjs-2
HTTP Client: Axios
Form Validation: React Hook Form + Zod
Styling: CSS Modules + MUI Theme
```

### Backend
```yaml
Runtime: Node.js 20 LTS
Framework: Express.js 4+
Database: PostgreSQL 16
ORM: Prisma 5+
Authentication: JWT + bcrypt
Validation: Zod
Logging: Winston
API Docs: Swagger/OpenAPI 3.0
Testing: Jest + Supertest
```

### DevOps & Infraestructura
```yaml
Containerization: Docker 24+ & Docker Compose
Reverse Proxy: Nginx (en Docker)
Process Manager: PM2 (opcional, dentro del contenedor)
Environment: dotenv
CI/CD: GitHub Actions (opcional)
```

### Herramientas de Desarrollo
```yaml
Package Manager: npm o pnpm
Code Quality: ESLint + Prettier
Git Hooks: Husky + lint-staged
API Testing: Postman Collection incluida
```

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                     DOCKER COMPOSE                          │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Nginx    │  │   Frontend   │  │     Backend      │   │
│  │ (Proxy :80)│◄─┤  React+Vite  │◄─┤  Express+Prisma  │   │
│  └────────────┘  │  (Port 5173) │  │   (Port 4100)    │   │
│                  └──────────────┘  └─────────┬────────┘   │
│                                              │              │
│                                    ┌─────────▼─────────┐   │
│                                    │   PostgreSQL 16   │   │
│                                    │   (Port 5432)     │   │
│                                    └───────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos Principal

```
Usuario → Nginx → React App → API REST (Express) → Prisma ORM → PostgreSQL
                     ↓
              State Management (Zustand)
                     ↓
              React Components + MUI
```

### Principios de Arquitectura

1. **Separación de Responsabilidades**: Frontend, Backend y DB completamente desacoplados
2. **API RESTful**: Endpoints claros siguiendo convenciones REST
3. **Stateless Backend**: JWT para autenticación sin sesiones del lado del servidor
4. **Database First**: Prisma schema como source of truth
5. **Modular Components**: Cada módulo (oposiciones, temas, preguntas, tests, intentos) es independiente
6. **Error Handling Centralizado**: Middleware de errores en backend, error boundaries en frontend
7. **Validación Dual**: Validación en frontend (UX) y backend (seguridad)

---

## 📁 ESTRUCTURA DE CARPETAS

```
opposition-system/
├── docker-compose.yml              # Orquestación de servicios
├── .env.example                    # Variables de entorno template
├── README.md                       # Este documento (parte 1 y 2 combinadas)
├── postman/                        # Colección Postman de la API
│   └── API_Collection.json
│
├── backend/                        # 🔧 BACKEND NODE.JS
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma          # Definición de modelos y relaciones
│   │   ├── migrations/            # Migraciones SQL generadas
│   │   └── seed.js                # Script de datos iniciales
│   │
│   └── src/
│       ├── index.js               # Entry point del servidor
│       ├── config/
│       │   ├── database.js        # Configuración Prisma Client
│       │   ├── auth.js            # Configuración JWT
│       │   └── cors.js            # Configuración CORS
│       │
│       ├── middleware/
│       │   ├── auth.middleware.js         # Verificación JWT
│       │   ├── error.middleware.js       # Manejo global de errores
│       │   ├── validation.middleware.js  # Validación Zod
│       │   └── logger.middleware.js      # Logging de requests
│       │
│       ├── modules/
│       │   ├── auth/                      # 🔐 Autenticación
│       │   │   ├── auth.controller.js
│       │   │   ├── auth.service.js
│       │   │   ├── auth.routes.js
│       │   │   └── auth.validation.js
│       │   │
│       │   ├── users/                     # 👤 Usuarios
│       │   │   ├── user.controller.js
│       │   │   ├── user.service.js
│       │   │   ├── user.routes.js
│       │   │   └── user.validation.js
│       │   │
│       │   ├── oposiciones/               # 📚 Oposiciones
│       │   │   ├── oposicion.controller.js
│       │   │   ├── oposicion.service.js
│       │   │   ├── oposicion.routes.js
│       │   │   └── oposicion.validation.js
│       │   │
│       │   ├── temas/                     # 📖 Temas
│       │   │   ├── tema.controller.js
│       │   │   ├── tema.service.js
│       │   │   ├── tema.routes.js
│       │   │   └── tema.validation.js
│       │   │
│       │   ├── preguntas/                 # ❓ Preguntas
│       │   │   ├── pregunta.controller.js
│       │   │   ├── pregunta.service.js
│       │   │   ├── pregunta.routes.js
│       │   │   └── pregunta.validation.js
│       │   │
│       │   ├── tests/                     # 📝 Tests
│       │   │   ├── test.controller.js
│       │   │   ├── test.service.js
│       │   │   ├── test.routes.js
│       │   │   └── test.validation.js
│       │   │
│       │   ├── intentos/                  # 📊 Intentos/Resultados
│       │   │   ├── intento.controller.js
│       │   │   ├── intento.service.js
│       │   │   ├── intento.routes.js
│       │   │   └── intento.validation.js
│       │   │
│       │   ├── stats/                     # 📈 Estadísticas
│       │   │   ├── stats.controller.js
│       │   │   ├── stats.service.js
│       │   │   └── stats.routes.js
│       │   │
│       │   └── import/                    # 📥 Importación
│       │       ├── import.controller.js
│       │       ├── import.service.js
│       │       ├── import.routes.js
│       │       └── parsers/
│       │           └── legacy-parser.js   # Parser formato pipe
│       │
│       └── utils/
│           ├── validators.js      # Validadores reutilizables
│           ├── errors.js          # Clases de error custom
│           ├── logger.js          # Winston logger
│           └── response.js        # Helpers de respuesta HTTP
│
├── frontend/                      # ⚛️ FRONTEND REACT
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   ├── index.html
│   │
│   ├── public/
│   │   ├── favicon.ico
│   │   └── assets/
│   │
│   └── src/
│       ├── main.jsx              # Entry point
│       ├── App.jsx               # Componente raíz
│       │
│       ├── api/
│       │   ├── client.js         # Axios instance configurada
│       │   ├── auth.api.js
│       │   ├── oposiciones.api.js
│       │   ├── temas.api.js
│       │   ├── preguntas.api.js
│       │   ├── tests.api.js
│       │   ├── intentos.api.js
│       │   └── stats.api.js
│       │
│       ├── store/                # Zustand stores
│       │   ├── authStore.js
│       │   ├── testStore.js
│       │   └── statsStore.js
│       │
│       ├── hooks/                # Custom React hooks
│       │   ├── useAuth.js
│       │   ├── useTest.js
│       │   ├── useStats.js
│       │   └── useNotification.js
│       │
│       ├── components/           # Componentes reutilizables
│       │   ├── common/
│       │   │   ├── Button.jsx
│       │   │   ├── Input.jsx
│       │   │   ├── Select.jsx
│       │   │   ├── Card.jsx
│       │   │   ├── Modal.jsx
│       │   │   ├── Loader.jsx
│       │   │   └── ErrorBoundary.jsx
│       │   │
│       │   ├── layout/
│       │   │   ├── Header.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   ├── Footer.jsx
│       │   │   └── Layout.jsx
│       │   │
│       │   ├── test/
│       │   │   ├── TestCard.jsx
│       │   │   ├── QuestionCard.jsx
│       │   │   ├── TestConfig.jsx
│       │   │   ├── TestProgress.jsx
│       │   │   └── TestResults.jsx
│       │   │
│       │   ├── stats/
│       │   │   ├── StatsChart.jsx
│       │   │   ├── ProgressBar.jsx
│       │   │   └── StatsTable.jsx
│       │   │
│       │   └── admin/
│       │       ├── QuestionForm.jsx
│       │       ├── QuestionList.jsx
│       │       ├── ImportForm.jsx
│       │       └── TemaManager.jsx
│       │
│       ├── pages/                # Páginas/Vistas principales
│       │   ├── Home.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Dashboard.jsx
│       │   ├── TestConfig.jsx
│       │   ├── TestRunner.jsx
│       │   ├── TestReview.jsx
│       │   ├── Stats.jsx
│       │   ├── History.jsx
│       │   ├── Admin/
│       │   │   ├── Maintenance.jsx
│       │   │   ├── Questions.jsx
│       │   │   ├── Themes.jsx
│       │   │   └── Import.jsx
│       │   └── NotFound.jsx
│       │
│       ├── router/
│       │   ├── index.jsx         # Configuración React Router
│       │   ├── PrivateRoute.jsx
│       │   └── AdminRoute.jsx
│       │
│       ├── theme/                # MUI Theme customization
│       │   └── index.js
│       │
│       ├── utils/
│       │   ├── validators.js
│       │   ├── formatters.js
│       │   └── constants.js
│       │
│       └── styles/
│           └── global.css
│
└── nginx/                        # ⚙️ NGINX REVERSE PROXY
    ├── Dockerfile
    └── nginx.conf                # Configuración proxy
```

---

## 🗄️ BASE DE DATOS POSTGRESQL

### Esquema Prisma Completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== USUARIOS Y AUTENTICACIÓN ====================

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  password  String   // Hash bcrypt
  role      Role     @default(STUDENT)
  
  // Perfil
  nombre    String?
  apellidos String?
  avatar    String?
  
  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  lastLogin DateTime?
  isActive  Boolean  @default(true)
  
  // Relaciones
  intentos  Intento[]
  
  @@index([email])
  @@index([username])
  @@map("users")
}

enum Role {
  ADMIN
  STUDENT
}

// ==================== OPOSICIONES ====================

model Oposicion {
  id          String   @id @default(uuid())
  nombre      String   @unique
  descripcion String?
  codigo      String?  @unique // Ej: "CNP", "GC", "ADMIN"
  
  // Metadata
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  temas       Tema[]
  tests       Test[]
  
  @@index([nombre])
  @@map("oposiciones")
}

// ==================== TEMAS ====================

model Tema {
  id           String    @id @default(uuid())
  nombre       String
  descripcion  String?
  orden        Int       @default(0) // Para ordenar temas
  
  // Relación con oposición
  oposicionId  String
  oposicion    Oposicion @relation(fields: [oposicionId], references: [id], onDelete: Cascade)
  
  // Metadata
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  // Relaciones
  preguntas    Pregunta[]
  
  @@unique([oposicionId, nombre])
  @@index([oposicionId])
  @@map("temas")
}

// ==================== PREGUNTAS ====================

model Pregunta {
  id                String    @id @default(uuid())
  
  // Contenido
  enunciado         String    @db.Text
  opciones          Json      // { A: "...", B: "...", C: "...", D: "..." }
  respuestaCorrecta String    // "A", "B", "C" o "D"
  explicacion       String?   @db.Text
  claveResolucion   String?   // Referencia legal o normativa
  
  // Clasificación
  temaId            String?
  tema              Tema?     @relation(fields: [temaId], references: [id], onDelete: SetNull)
  dificultad        Int       @default(2) // 1=Fácil, 2=Media, 3=Difícil
  
  // Estado
  isActive          Boolean   @default(true)
  reportadaRevision Boolean   @default(false)
  reportadaEn       DateTime?
  motivoReporte     String?   @db.Text
  
  // Metadata
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relaciones
  respuestas        Respuesta[]
  
  @@index([temaId])
  @@index([dificultad])
  @@index([reportadaRevision])
  @@map("preguntas")
}

// ==================== TESTS ====================

model Test {
  id          String    @id @default(uuid())
  nombre      String
  descripcion String?
  
  // Configuración
  oposicionId String?
  oposicion   Oposicion? @relation(fields: [oposicionId], references: [id], onDelete: SetNull)
  
  cantidadPreguntas Int
  dificultad        Int?      // null = mixto
  temaIds           String[]  // Array de IDs de temas (si está vacío = todos)
  
  // Tipo de test
  tipoTest    TipoTest  @default(ALEATORIO)
  
  // Metadata
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relaciones
  intentos    Intento[]
  
  @@index([oposicionId])
  @@map("tests")
}

enum TipoTest {
  ALEATORIO       // Preguntas aleatorias según filtros
  OFICIAL         // Test oficial de convocatoria
  SIMULACRO       // Simulacro de examen
  PERSONALIZADO   // Test creado manualmente
}

// ==================== INTENTOS (RESULTADOS) ====================

model Intento {
  id            String    @id @default(uuid())
  
  // Relaciones
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  testId        String?
  test          Test?     @relation(fields: [testId], references: [id], onDelete: SetNull)
  
  // Configuración del intento
  configuracion Json      // Guarda la config del test en el momento
  
  // Resultados
  respuestas    Respuesta[]
  
  puntuacion    Float
  aciertos      Int
  fallos        Int
  enBlanco      Int
  totalPreguntas Int
  
  // Tiempo
  iniciadoEn    DateTime  @default(now())
  finalizadoEn  DateTime?
  duracionSeg   Int?      // Duración en segundos
  
  // Estado
  completado    Boolean   @default(false)
  
  @@index([userId])
  @@index([testId])
  @@index([iniciadoEn])
  @@map("intentos")
}

// ==================== RESPUESTAS ====================

model Respuesta {
  id              String    @id @default(uuid())
  
  // Relaciones
  intentoId       String
  intento         Intento   @relation(fields: [intentoId], references: [id], onDelete: Cascade)
  
  preguntaId      String
  pregunta        Pregunta  @relation(fields: [preguntaId], references: [id], onDelete: Cascade)
  
  // Respuesta del usuario
  respuestaUsuario String?  // "A", "B", "C", "D" o null (en blanco)
  esCorrecta       Boolean
  
  // Tiempo
  tiempoSeg        Int?     // Tiempo empleado en esta pregunta
  
  @@unique([intentoId, preguntaId])
  @@index([intentoId])
  @@index([preguntaId])
  @@map("respuestas")
}
```

---

## 📊 MODELOS DE DATOS

### User (Usuario)
```typescript
interface User {
  id: string;                // UUID
  email: string;             // Único
  username: string;          // Único
  password: string;          // Hash bcrypt
  role: 'ADMIN' | 'STUDENT';
  nombre?: string;
  apellidos?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}
```

### Oposicion
```typescript
interface Oposicion {
  id: string;           // UUID
  nombre: string;       // Único, ej: "Policía Nacional"
  descripcion?: string;
  codigo?: string;      // Único, ej: "CNP"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  temas: Tema[];
}
```

### Tema
```typescript
interface Tema {
  id: string;           // UUID
  nombre: string;       // ej: "Constitución Española"
  descripcion?: string;
  orden: number;        // Para ordenar temas
  oposicionId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  preguntas: Pregunta[];
}
```

### Pregunta
```typescript
interface Pregunta {
  id: string;                    // UUID
  enunciado: string;
  opciones: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  respuestaCorrecta: 'A' | 'B' | 'C' | 'D';
  explicacion?: string;
  claveResolucion?: string;      // ej: "Art. 27 CE"
  temaId?: string;
  dificultad: 1 | 2 | 3;         // Fácil, Media, Difícil
  isActive: boolean;
  reportadaRevision: boolean;
  reportadaEn?: Date;
  motivoReporte?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Test
```typescript
interface Test {
  id: string;                    // UUID
  nombre: string;
  descripcion?: string;
  oposicionId?: string;
  cantidadPreguntas: number;
  dificultad?: 1 | 2 | 3;        // null = mixto
  temaIds: string[];             // Vacío = todos los temas
  tipoTest: 'ALEATORIO' | 'OFICIAL' | 'SIMULACRO' | 'PERSONALIZADO';
  createdAt: Date;
  updatedAt: Date;
}
```

### Intento (Resultado)
```typescript
interface Intento {
  id: string;                    // UUID
  userId: string;
  testId?: string;
  configuracion: object;         // Config del test en JSON
  puntuacion: number;            // Ej: 7.5
  aciertos: number;
  fallos: number;
  enBlanco: number;
  totalPreguntas: number;
  iniciadoEn: Date;
  finalizadoEn?: Date;
  duracionSeg?: number;
  completado: boolean;
  respuestas: Respuesta[];
}
```

### Respuesta
```typescript
interface Respuesta {
  id: string;                    // UUID
  intentoId: string;
  preguntaId: string;
  respuestaUsuario?: 'A' | 'B' | 'C' | 'D'; // null = en blanco
  esCorrecta: boolean;
  tiempoSeg?: number;            // Tiempo en esta pregunta
}
```

---

## 📝 CONTINUACIÓN EN PARTE 2

La **PARTE 2** incluirá:
- API Endpoints completos (REST)
- Funcionalidades detalladas por módulo
- Configuración Docker Compose
- Scripts de inicio/parada
- Variables de entorno
- Comandos de desarrollo
- Seeders y datos iniciales
- Testing y deployment

**Ver:** `README_NUEVO_PROYECTO_PARTE2.md`
