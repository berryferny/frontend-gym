<template>
  <div class="gym-container">
    <!-- Barra de Navegación -->
    <nav class="navbar">
      <h1 @click="vista = 'inicio'" class="logo">GymFit 💜</h1>
      <div class="nav-links">
        <button @click="vista = 'clases'" class="nav-btn">Clases</button>
        <button @click="vista = 'registro'" class="btn-destacado">Únete</button>
      </div>
    </nav>

    <!-- Vista 1: Landing Page Informativa -->
    <main v-if="vista === 'inicio'" class="hero">
      <div class="hero-content">
        <h2>Tu espacio para entrenar y conectar.</h2>
        <p>Pilates, Yoga y Barre en un ambiente diseñado para ti.</p>
        <button @click="vista = 'clases'" class="btn-principal">Ver Horarios</button>
      </div>
    </main>

    <!-- Vista 2: Catálogo y Reserva de Clases -->
    <section v-if="vista === 'clases'" class="seccion-clases">
      <h2>Catálogo de Clases ✨</h2>
      <div class="grid-clases">
        <div class="card-clase" v-for="clase in clases" :key="clase.id">
          <div class="clase-info">
            <h3>{{ clase.nombre }}</h3>
            <p class="instructor">Con: {{ clase.instructor }}</p>
            <p class="horario">🕒 {{ clase.horario }}</p>
          </div>
          <button @click="simularReserva(clase.nombre)" class="btn-reservar">Reservar</button>
        </div>
      </div>
      <p v-if="mensajeReserva" class="alerta-exito">{{ mensajeReserva }}</p>
    </section>

    <!-- Vista 3: Formulario de Registro -->
    <section v-if="vista === 'registro'" class="seccion-registro">
      <div class="form-card">
        <h2>Crea tu cuenta</h2>
        <form @submit.prevent="registrarUsuario" class="formulario">
          <input v-model="formRegistro.nombre" type="text" placeholder="Tu nombre" required />
          <input v-model="formRegistro.email" type="email" placeholder="Tu correo" required />
          <input v-model="formRegistro.password" type="password" placeholder="Contraseña" required />
          <button type="submit" class="btn-principal">Registrarme</button>
        </form>
        <p v-if="mensajeRegistro" class="alerta-exito">{{ mensajeRegistro }}</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Estado para navegar entre secciones
const vista = ref('inicio')

// Mensajes de simulación
const mensajeReserva = ref('')
const mensajeRegistro = ref('')

// Datos del formulario
const formRegistro = ref({
  nombre: '',
  email: '',
  password: ''
})

// Catálogo simulado de clases
const clases = ref([
  { id: 1, nombre: 'Pilates Reformer', instructor: 'Ana', horario: 'Lunes 18:00 hrs' },
  { id: 2, nombre: 'Yoga Vinyasa', instructor: 'Sofía', horario: 'Martes 19:00 hrs' },
  { id: 3, nombre: 'Barre Intense', instructor: 'Caro', horario: 'Miércoles 18:30 hrs' },
  { id: 4, nombre: 'Meditación', instructor: 'Elena', horario: 'Jueves 20:00 hrs' }
])

// Funciones de simulación
const simularReserva = (nombreClase) => {
  mensajeReserva.value = `¡Reserva confirmada para ${nombreClase}! Te esperamos.`
  setTimeout(() => mensajeReserva.value = '', 4000)
}

const registrarUsuario = () => {
  mensajeRegistro.value = `¡Bienvenida, ${formRegistro.value.nombre}! Cuenta creada con éxito.`
  formRegistro.value = { nombre: '', email: '', password: '' }
  setTimeout(() => mensajeRegistro.value = '', 4000)
}
</script>

<style scoped>
/* Estilos Globales y Paleta Chic */
.gym-container {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #4a044e;
  background-color: #faf5ff;
  min-height: 100vh;
}

/* Navegación */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 40px;
  background-color: white;
  box-shadow: 0 2px 10px rgba(192, 132, 252, 0.1);
}

.logo {
  cursor: pointer;
  color: #d946ef;
  margin: 0;
  font-size: 1.8rem;
}

.nav-links {
  display: flex;
  gap: 15px;
}

.nav-btn {
  background: none;
  border: none;
  color: #a21caf;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
}

.btn-destacado {
  background: linear-gradient(135deg, #d946ef, #c084fc);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-destacado:hover {
  transform: translateY(-2px);
}

/* Hero Section */
.hero {
  text-align: center;
  padding: 100px 20px;
  background: linear-gradient(135deg, #fdf4ff 0%, #f3e8ff 100%);
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-content h2 {
  font-size: 3rem;
  color: #701a75;
  margin-bottom: 10px;
}

.hero-content p {
  font-size: 1.2rem;
  color: #a21caf;
  margin-bottom: 30px;
}

/* Botón Principal */
.btn-principal {
  background-color: #d946ef;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(217, 70, 239, 0.3);
  transition: all 0.3s ease;
}

.btn-principal:hover {
  background-color: #c084fc;
  transform: translateY(-2px);
}

/* Clases */
.seccion-clases {
  padding: 50px 40px;
  text-align: center;
}

.seccion-clases h2 {
  color: #d946ef;
  margin-bottom: 40px;
  font-size: 2rem;
}

.grid-clases {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 25px;
  max-width: 1000px;
  margin: 0 auto;
}

.card-clase {
  background: white;
  padding: 25px;
  border-radius: 16px;
  border: 1px solid #f5d0fe;
  box-shadow: 0 8px 20px rgba(192, 132, 252, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.clase-info h3 {
  color: #701a75;
  margin-top: 0;
}

.instructor {
  color: #c084fc;
  font-weight: 500;
}

.horario {
  color: #a21caf;
  background-color: #faf5ff;
  padding: 8px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.btn-reservar {
  background-color: white;
  color: #d946ef;
  border: 2px solid #d946ef;
  padding: 8px 15px;
  border-radius: 20px;
  font-weight: bold;
  margin-top: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reservar:hover {
  background-color: #d946ef;
  color: white;
}

/* Formulario */
.seccion-registro {
  display: flex;
  justify-content: center;
  padding: 60px 20px;
}

.form-card {
  background: white;
  padding: 40px;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(192, 132, 252, 0.15);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.form-card h2 {
  color: #d946ef;
  margin-bottom: 25px;
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

input {
  padding: 12px 15px;
  border: 2px solid #f0abfc;
  border-radius: 12px;
  outline: none;
  font-size: 1rem;
  color: #4a044e;
  background-color: white;
  transition: border-color 0.3s;
}

input:focus {
  border-color: #d946ef;
}

input::placeholder {
  color: #c084fc;
}

/* Alertas */
.alerta-exito {
  margin-top: 20px;
  color: #10b981;
  background-color: #ecfdf5;
  padding: 10px;
  border-radius: 8px;
  font-weight: bold;
}
</style>