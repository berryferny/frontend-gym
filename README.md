# GymFit 💜

GymFit es una aplicación web desarrollada con **Vue 3** y **Vite** para simular la experiencia de un estudio de entrenamiento enfocado en actividades como Pilates, Yoga, Barre y Meditación.

Actualmente, el proyecto incluye:

- Página de inicio con información general del gimnasio.
- Catálogo de clases con instructor y horario.
- Simulación de reserva de clases.
- Formulario de registro de usuarios.
- Navegación entre secciones sin recargar la página.
- Diseño responsivo con una interfaz visual en tonos morados y rosas.

> Por el momento, las reservas y el registro son simulados en el frontend y no están conectados a una base de datos o backend.

## Tecnologías utilizadas

- Vue 3
- Vite
- JavaScript
- HTML
- CSS

## Requisitos

Antes de ejecutar el proyecto necesitas tener instalado:

- [Node.js](https://nodejs.org/)
- npm, incluido con Node.js
- Git, si vas a clonar el repositorio desde GitHub

Puedes comprobar que Node.js y npm estén instalados con:

```bash
node -v
npm -v
```

## Cómo correr el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/berryferny/frontend-gym.git
```

### 2. Entrar a la carpeta del proyecto

```bash
cd frontend-gym
```

### 3. Instalar las dependencias

```bash
npm install
```

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Vite mostrará en la terminal una dirección local similar a:

```text
http://localhost:5173/
```

Abre esa dirección en tu navegador para visualizar la aplicación.

## Si ya tienes el proyecto descargado

Solo entra a la carpeta del proyecto y ejecuta:

```bash
npm install
npm run dev
```

## Compilar para producción

Para generar una versión optimizada del proyecto:

```bash
npm run build
```

Los archivos compilados se guardarán en la carpeta `dist`.

Para revisar localmente la versión compilada puedes ejecutar:

```bash
npm run preview
```
