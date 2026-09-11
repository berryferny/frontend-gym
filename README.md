# GymFit 💜

GymFit es una aplicación web académica para un estudio de bienestar con clases de **Pilates, Yoga, Barre y Meditación**. Permite registro e inicio de sesión, consulta de clases, reservas y cancelaciones. También incluye un panel de administración para consultar clientes y reservas y gestionar clases.

La versión actual utiliza **Vue 3 + Vite** en el frontend y **Supabase** como backend en la nube para autenticación, base de datos PostgreSQL y acceso a datos.

## Funcionalidades

### Cliente
- Registro e inicio de sesión con Supabase Auth.
- Consulta de clases y lugares disponibles.
- Reserva de clases.
- Consulta y cancelación de reservas.

### Administrador
- Inicio de sesión con rol `admin`.
- Consulta de clientes y reservas.
- Alta, actualización y eliminación de clases.

## Tecnologías

- Vue 3
- Vite
- JavaScript
- HTML y CSS
- Supabase Auth
- Supabase PostgreSQL
- Row Level Security (RLS)
- GitHub

## Arquitectura

```text
Navegador
   |
   v
Vue 3 + Vite
   |
   | Supabase JS / API
   v
Supabase
   |-- Auth
   |-- PostgreSQL
   |-- RLS
   `-- funciones SQL
```

> La carpeta `backend/` contiene la implementación anterior con Express + SQLite y se conserva como respaldo del desarrollo. El frontend actual no depende de ese servidor para funcionar.

## Requisitos

Se recomienda **Node.js 22** y npm.

```bash
node -v
npm -v
```

## 1. Clonar e instalar

```bash
git clone https://github.com/berryferny/frontend-gym.git
cd frontend-gym
npm install
```

## 2. Configurar Supabase

Crea un proyecto en Supabase y abre **SQL Editor**. Ejecuta completo:

```text
supabase/schema.sql
```

Ese script crea:

- `profiles`
- `clases`
- `reservas`
- clases de demostración
- trigger de creación de perfiles
- políticas RLS
- cálculo seguro de disponibilidad
- validación de cupo antes de insertar una reserva

## 3. Variables de entorno

Copia `.env.example` como `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA_SUPABASE
```

También se admite `VITE_SUPABASE_PUBLISHABLE_KEY` en lugar de `VITE_SUPABASE_ANON_KEY`.

**Nunca uses una clave `service_role` en el frontend.**

## 4. Configurar autenticación

En Supabase ve a **Authentication**. Para una demo rápida puedes desactivar temporalmente la confirmación de correo; si se mantiene activada, cada usuario deberá confirmar su email antes de iniciar sesión.

Al registrarse, el sistema crea automáticamente un registro en `profiles` con rol `cliente`.

### Crear administrador

1. Crea o registra el usuario que usarás como administrador.
2. En SQL Editor ejecuta:

```sql
update public.profiles
set rol = 'admin'
where email = 'admin@gymfit.com';
```

La contraseña del administrador se administra desde Supabase Auth y no debe escribirse en el repositorio.

## 5. Ejecutar GymFit

Solo necesitas una terminal:

```bash
npm run dev
```

Vite mostrará una dirección similar a:

```text
http://localhost:5173
```

## Datos y seguridad

### Disponibilidad

Las clases se consultan mediante la función SQL `get_clases_con_disponibilidad()`, que calcula lugares libres usando todas las reservas sin exponer datos privados de otros usuarios.

### Reservas

La tabla `reservas` tiene una restricción única por usuario y clase. Un trigger valida el cupo dentro de PostgreSQL y bloquea el registro si la clase ya está llena, incluso cuando dos usuarios intentan reservar casi al mismo tiempo.

### RLS

- Un cliente puede consultar su propio perfil y sus propias reservas.
- Un administrador puede consultar clientes y reservas.
- Las clases son visibles públicamente.
- Solo administradores pueden crear, editar o eliminar clases.

## Estructura principal

```text
frontend-gym/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.vue
│   ├── main.js
│   ├── style.css
│   ├── assets/
│   └── services/
│       └── api.js
├── supabase/
│   └── schema.sql
├── backend/          # versión anterior / respaldo
├── .env.example
├── package.json
└── README.md
```

## Flujo recomendado para la demostración

1. Abrir GymFit y mostrar las clases.
2. Registrar un cliente.
3. Reservar una clase.
4. Mostrar `Mis reservas`.
5. Cancelar o conservar la reserva.
6. Iniciar sesión como administrador.
7. Mostrar usuarios y reservas.
8. Crear una clase nueva y comprobar que aparece en el catálogo.

## Objetivo académico

GymFit cubre el alcance del **Sitio Gym** mediante un sitio informativo, autenticación, catálogo de clases, reservas persistentes y gestión administrativa. Al usar Supabase, la misma base de datos y servicios pueden reutilizarse posteriormente desde una aplicación móvil.
