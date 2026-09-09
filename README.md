# GymFit 💜

GymFit es una aplicación web académica para la administración de un estudio de bienestar con clases de **Pilates, Yoga, Barre y Meditación**. El proyecto permite que los clientes se registren, inicien sesión, consulten las clases disponibles, realicen reservas y administren sus reservas. También incluye un panel de administración para consultar clientes y reservas, además de crear o eliminar clases.

El sistema fue diseñado como base para una futura aplicación móvil: el frontend consume una **API REST**, por lo que los mismos servicios de usuarios, clases y reservas pueden reutilizarse posteriormente desde una app móvil.

## Funcionalidades

### Cliente

- Registro de cuenta.
- Inicio de sesión.
- Consulta de clases y lugares disponibles.
- Reserva de clases.
- Consulta de reservas personales.
- Cancelación de reservas.
- Persistencia de sesión en el navegador.

### Administrador

- Inicio de sesión con rol de administrador.
- Dashboard con resumen de clientes, clases y reservas.
- Consulta de usuarios registrados.
- Consulta de todas las reservas.
- Creación de nuevas clases.
- Eliminación de clases.
- Endpoints disponibles para actualización de clases.

## Tecnologías

### Frontend

- Vue 3
- Vite
- JavaScript
- HTML
- CSS

### Backend

- Node.js
- Express
- SQLite
- JSON Web Tokens (JWT)
- bcryptjs para cifrado de contraseñas

## Arquitectura

```text
Navegador
   |
   | HTTP / JSON
   v
Vue 3 + Vite
   |
   | API REST
   v
Node.js + Express
   |
   v
SQLite
```

El frontend se ejecuta normalmente en `http://localhost:5173` y la API en `http://localhost:3000`.

## Requisitos

Necesitas tener instalado:

- Node.js 20 o superior recomendado.
- npm.
- Git, si vas a clonar el repositorio.

Comprueba la instalación con:

```bash
node -v
npm -v
```

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/berryferny/frontend-gym.git
cd frontend-gym
```

### 2. Instalar el frontend

Desde la carpeta principal:

```bash
npm install
```

### 3. Instalar el backend

```bash
cd backend
npm install
cd ..
```

No es necesario crear manualmente la base de datos. La API genera `backend/data/gymfit.db` automáticamente la primera vez que inicia y agrega clases de demostración.

## Cómo correr el proyecto

Debes mantener **dos terminales abiertas**.

### Terminal 1: backend

```bash
cd backend
npm run dev
```

La API quedará disponible en:

```text
http://localhost:3000
```

Puedes comprobar que está funcionando visitando:

```text
http://localhost:3000/api/health
```

### Terminal 2: frontend

Desde la carpeta principal del proyecto:

```bash
npm run dev
```

Vite mostrará una dirección similar a:

```text
http://localhost:5173
```

Abre esa dirección en tu navegador.

## Cuenta de administrador para la demostración

La base de datos crea automáticamente esta cuenta de prueba:

```text
Correo: admin@gymfit.com
Contraseña: GymFit2026!
```

Los usuarios normales deben registrarse desde la pantalla **Únete**. Por seguridad, el formulario público nunca permite seleccionar el rol de administrador.

> La cuenta anterior es únicamente para fines académicos y demostración local. En un sistema real las credenciales deben configurarse de forma segura y no publicarse en el repositorio.

## Variables de entorno del backend

El proyecto funciona localmente sin configuración adicional, pero puedes copiar `backend/.env.example` como `backend/.env` para personalizarlo:

```env
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=cambia-esta-clave-por-una-segura
```

## API REST principal

### Autenticación

```text
POST /api/auth/register
POST /api/auth/login
```

### Clases

```text
GET /api/clases
```

### Reservas del cliente

```text
POST   /api/reservas
GET    /api/reservas/mias
DELETE /api/reservas/:id
```

### Administración

```text
GET    /api/admin/usuarios
GET    /api/admin/reservas
POST   /api/admin/clases
PUT    /api/admin/clases/:id
DELETE /api/admin/clases/:id
```

Los endpoints privados utilizan un token JWT enviado en el encabezado `Authorization: Bearer <token>`.

## Compilar el frontend para producción

```bash
npm run build
```

Los archivos compilados se generan dentro de `dist`.

Para probar la compilación localmente:

```bash
npm run preview
```

## Estructura principal

```text
frontend-gym/
├── src/
│   ├── App.vue
│   ├── main.js
│   ├── style.css
│   └── services/
│       └── api.js
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── package.json
└── README.md
```

## Objetivo académico

Este proyecto cumple el alcance del **Sitio Gym** al incluir un sitio informativo, registro e inicio de sesión, catálogo de clases, reservas funcionales, persistencia de datos y un API REST básico de usuarios y reservas que puede reutilizarse posteriormente en Desarrollo Móvil.
