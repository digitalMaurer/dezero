# 📚 Sistema de Test de Oposiciones

Un sistema web completo para preparación de oposiciones con gestión de preguntas, tests personalizados, estadísticas de progreso y panel administrativo.

## 🚀 Quick Start con Docker

### Prerrequisitos
- Docker 24+
- Docker Compose 2+

### Iniciar el proyecto

```bash
# Clonar o entrar en el directorio del proyecto
cd dezero

# Construir e iniciar los contenedores
docker-compose up --build

# En otra terminal, ejecutar migraciones de base de datos
docker exec oposiciones_backend npm run prisma:migrate

# (Opcional) Cargar datos de prueba
docker exec oposiciones_backend npm run prisma:seed
```

### Acceder a la aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4100/api/v1
- **Nginx (Proxy)**: http://localhost
- **Base de datos**: localhost:5432

### Credenciales de desarrollo

```
Database:
  User: oposiciones
  Password: oposiciones123
  Database: oposiciones_db
```

---

## 📁 Estructura del Proyecto

```
dezero/
├── backend/                    # API Express + Prisma
│   ├── src/
│   │   ├── index.js           # Punto de entrada del servidor
│   │   ├── routes/            # Definición de rutas
│   │   ├── controllers/       # Lógica de negocios
│   │   ├── middleware/        # Middlewares (auth, error, etc)
│   │   └── utils/             # Utilidades (JWT, logger, etc)
│   ├── prisma/
│   │   ├── schema.prisma      # Definición de base de datos
│   │   └── seed.js            # Datos iniciales
│   ├── package.json
│   └── Dockerfile
│
├── frontend/                   # React + Vite + MUI
│   ├── src/
│   │   ├── pages/             # Páginas (Login, Dashboard, etc)
│   │   ├── components/        # Componentes reutilizables
│   │   ├── services/          # Servicios (API calls)
│   │   ├── store/             # Estado global (Zustand)
│   │   ├── styles/            # CSS global
│   │   ├── App.jsx            # Componente raíz
│   │   └── main.jsx           # Punto de entrada
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml         # Orquestación de contenedores
├── nginx.conf                 # Configuración del proxy inverso
└── README.md                  # Este archivo
```

---

## 🛠️ Stack Tecnológico

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Validation**: Zod

### Frontend
- **Framework**: React 18
- **Build**: Vite 5
- **UI Library**: Material-UI (MUI)
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod

### Infraestructura
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Database**: PostgreSQL

---

## 📋 Desarrollo Local (sin Docker)

### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env

# Correr migraciones
npm run prisma:migrate

# Iniciar servidor en modo desarrollo
npm run dev
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev
```

---

## 🔑 Variables de Entorno

### Backend (backend/.env)
```env
DATABASE_URL=postgresql://oposiciones:oposiciones123@localhost:5432/oposiciones_db
JWT_SECRET=tu_super_secreto_seguro_aqui_min_32_caracteres
JWT_EXPIRES_IN=7d
PORT=4100
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
```

### Frontend (frontend/.env)
```env
VITE_API_URL=http://localhost:4100/api/v1
```

---

## 📚 Endpoints de API

### Autenticación
- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Obtener usuario actual
- `POST /api/v1/auth/logout` - Logout

### Oposiciones
- `GET /api/v1/oposiciones` - Listar todas
- `GET /api/v1/oposiciones/:id` - Obtener una
- `POST /api/v1/oposiciones` - [ADMIN] Crear
- `PUT /api/v1/oposiciones/:id` - [ADMIN] Actualizar
- `DELETE /api/v1/oposiciones/:id` - [ADMIN] Eliminar

### Temas
- `GET /api/v1/temas` - Listar
- `GET /api/v1/temas/:id` - Obtener
- `POST /api/v1/temas` - [ADMIN] Crear
- `PUT /api/v1/temas/:id` - [ADMIN] Actualizar
- `DELETE /api/v1/temas/:id` - [ADMIN] Eliminar

### Preguntas
- `GET /api/v1/preguntas` - Listar
- `GET /api/v1/preguntas/:id` - Obtener
- `POST /api/v1/preguntas` - [ADMIN] Crear
- `PUT /api/v1/preguntas/:id` - [ADMIN] Actualizar
- `DELETE /api/v1/preguntas/:id` - [ADMIN] Eliminar

### Tests
- `GET /api/v1/tests` - Listar
- `GET /api/v1/tests/:id` - Obtener
- `POST /api/v1/tests` - [ADMIN] Crear
- `PUT /api/v1/tests/:id` - [ADMIN] Actualizar
- `DELETE /api/v1/tests/:id` - [ADMIN] Eliminar

---

## 🐳 Comandos Docker

```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar servicios
docker-compose down

# Parar y eliminar volúmenes
docker-compose down -v

# Ejecutar comando en un contenedor
docker-compose exec backend npm run prisma:migrate

# Reconstruir imágenes
docker-compose build --no-cache
```

---

## 🗄️ Gestión de Base de Datos

### Crear migraciones
```bash
npm run prisma:migrate
```

### Ver interfaz gráfica de Prisma
```bash
npm run prisma:studio
```

### Generar cliente Prisma
```bash
npm run prisma:generate
```

### Cargar datos de prueba
```bash
npm run prisma:seed
```

---

## 📊 Características del Sistema

### Gestión de Preguntas
- CRUD completo
- Múltiples formatos de importación
- Categorización por temas y dificultad
- Control de versiones y historial

### Sistema de Tests
- Generación aleatoria de tests
- Filtrado avanzado (tema, dificultad, cantidad)
- Modo práctico y examen
- Feedback inmediato con explicaciones

### Estadísticas
- Gráficos de progreso
- Análisis por tema
- Histórico de intentos
- Predicción de rendimiento

### Panel Administrativo
- Gestión de usuarios
- CRUD de oposiciones, temas y preguntas
- Importación masiva
- Reportes y analíticos

---

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt (10 rondas)
- JWT para autenticación stateless
- CORS configurado para localhost
- Validación de entrada con Zod
- Protección contra SQL injection (Prisma)
- Roles de usuario (ADMIN, STUDENT)

---

## 🧪 Testing

```bash
# Backend
cd backend
npm test
npm run test:watch

# Frontend
cd frontend
npm test
npm run test:watch
```

---

## 📦 Build para Producción

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Servir contenido de dist/
```

---

## 🚀 Deployment

### Con Docker
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Variables de producción
```env
NODE_ENV=production
JWT_SECRET=<generar-secreto-seguro>
DATABASE_URL=<url-base-datos-produccion>
CORS_ORIGIN=<dominio-produccion>
```

---

## 📄 Licencia

Este proyecto está bajo la licencia ISC.

---

## 👨‍💻 Desarrollo

### Contribuciones
Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📞 Soporte

Para reportar bugs o sugerir mejoras, abre un issue en el repositorio.

---

**✨ ¡Gracias por usar Sistema de Test de Oposiciones! ✨**
