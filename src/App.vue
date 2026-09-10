<template>
  <div class="app-shell">
    <header class="navbar">
      <button class="brand" @click="irA('inicio')">GymFit</button>

      <nav class="nav-links" aria-label="Navegación principal">
        <button @click="irA('inicio')">Inicio</button>
        <button @click="irA('clases')">Clases</button>
        <button @click="irA('nosotros')">Nosotros</button>
        <button @click="irA('contacto')">Contacto</button>

        <template v-if="!usuario">
          <button @click="irA('login')">Iniciar sesión</button>
          <button class="btn btn-small" @click="irA('registro')">Únete</button>
        </template>

        <template v-else-if="usuario.rol === 'admin'">
          <button @click="abrirAdmin">Panel admin</button>
          <button class="btn btn-small btn-soft" @click="cerrarSesion">Salir</button>
        </template>

        <template v-else>
          <button @click="abrirReservas">Mis reservas</button>
          <span class="user-pill">Hola, {{ primerNombre }} ✨</span>
          <button class="btn btn-small btn-soft" @click="cerrarSesion">Salir</button>
        </template>
      </nav>
    </header>

    <div v-if="mensaje" class="toast success">{{ mensaje }}</div>
    <div v-if="error" class="toast error">{{ error }}</div>

    <main>
      <section v-if="vista === 'inicio'" class="home">
        <div class="hero">
          <div class="hero-copy">
            <span class="eyebrow">MOVIMIENTO · BIENESTAR · COMUNIDAD</span>
            <h1>Tu espacio para entrenar, sentirte bien y conectar.</h1>
            <p>
              Pilates, Yoga, Barre y Meditación en un estudio pensado para acompañarte a crear una rutina que disfrutes.
            </p>
            <div class="hero-actions">
              <button class="btn" @click="irA('clases')">Ver clases</button>
              <button class="btn btn-outline" @click="irA(usuario ? 'reservas' : 'registro')">
                {{ usuario ? 'Mis reservas' : 'Crear mi cuenta' }}
              </button>
            </div>
            <div class="mini-stats">
              <div><strong>{{ clases.length }}</strong><span>clases disponibles</span></div>
              <div><strong>4</strong><span>disciplinas</span></div>
              <div><strong>100%</strong><span>en tu ritmo</span></div>
            </div>
          </div>

          <div class="hero-visual" aria-hidden="true">
            <div class="visual-card visual-main">
              <img class="visual-image" :src="heroImage" alt="" />
              <div class="visual-content">
                <p>Respira. Muévete.</p>
                <strong>Hazlo por ti.</strong>
              </div>
            </div>
            <div class="floating-card top">Tu momento</div>
            <div class="floating-card bottom">Tu comunidad</div>
          </div>
        </div>

        <div class="section-wrap">
          <div class="section-heading">
            <span class="eyebrow">ENCUENTRA TU FAVORITA</span>
            <h2>Un entrenamiento para cada día</h2>
            <p>Clases guiadas, grupos pequeños y horarios pensados para combinar con tu rutina.</p>
          </div>

          <div class="discipline-grid">
            <article class="discipline-card">
              <span class="discipline-icon" aria-label="Pilates">
                <svg class="discipline-svg" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M13 36C16 30 18 27 24 24C30 27 32 30 35 36" />
                  <path d="M16 21C17 17 20 14 24 14C28 14 31 17 32 21" />
                  <path d="M24 17L24 29" />
                  <path d="M13 36L18 38M35 36L30 38" />
                </svg>
              </span>
              <h3>Pilates</h3>
              <p>Fuerza, control y movilidad con movimientos conscientes.</p>
            </article>
            <article class="discipline-card">
              <span class="discipline-icon" aria-label="Yoga">
                <svg class="discipline-svg" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M24 9C20 14 18 18 18 22C18 27 21 29 24 31C27 29 30 27 30 22C30 18 28 14 24 9Z" />
                  <path d="M16 30C18 34 21 36 24 36C27 36 30 34 32 30" />
                  <path d="M24 32C24 36 24 39 24 40" />
                  <path d="M12 21C15 22 16 24 18 23" />
                </svg>
              </span>
              <h3>Yoga</h3>
              <p>Conecta respiración y movimiento mientras ganas flexibilidad.</p>
            </article>
            <article class="discipline-card">
              <span class="discipline-icon" aria-label="Barre">
                <svg class="discipline-svg" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M18 15L23 21L18 27" />
                  <path d="M30 15L25 21L30 27" />
                  <path d="M22 27L24 34L26 27" />
                  <path d="M12 36C18 34 20 34 24 36C28 34 30 34 36 36" />
                </svg>
              </span>
              <h3>Barre</h3>
              <p>Una mezcla dinámica de danza, fuerza y resistencia.</p>
            </article>
            <article class="discipline-card">
              <span class="discipline-icon" aria-label="Meditación">
                <svg class="discipline-svg" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M24 10C28 16 30 20 24 25C18 20 20 16 24 10Z" />
                  <path d="M24 25C29 26 31 28 31 32C31 35 29 37 24 38C19 37 17 35 17 32C17 28 19 26 24 25Z" />
                  <path d="M24 15C24 19 24 22 24 25" />
                  <path d="M13 34C17 32 19 31 22 32" />
                  <path d="M35 34C31 32 29 31 26 32" />
                </svg>
              </span>
              <h3>Meditación</h3>
              <p>Un espacio para bajar el ritmo y regresar a ti.</p>
            </article>
          </div>
        </div>
      </section>

      <section v-else-if="vista === 'nosotros'" class="page section-wrap info-page">
        <div class="about-hero">
          <div>
            <span class="eyebrow">CONOCE GYMFIT</span>
            <h2>Un espacio donde moverte también se siente bonito.</h2>
            <p>
              GymFit nace como una propuesta de bienestar que combina movimiento, comunidad y tecnología para hacer más sencilla la experiencia de reservar y organizar tus clases.
            </p>
            <button class="btn" @click="irA('clases')">Conocer las clases</button>
          </div>
          <div class="about-illustration" aria-hidden="true">
            <img class="about-image" :src="heroImage" alt="" />
            <strong>Tu bienestar,<br />a tu ritmo.</strong>
          </div>
        </div>

        <div class="section-heading about-heading">
          <span class="eyebrow">LO QUE NOS MUEVE</span>
          <h2>Nuestra forma de hacer las cosas</h2>
        </div>

        <div class="values-grid">
          <article><h3>Comunidad</h3><p>Queremos que cada persona encuentre un espacio amable, cercano y sin juicios.</p></article>
          <article><h3>Bienestar</h3><p>El objetivo no es hacerlo perfecto, sino construir hábitos que se puedan disfrutar y sostener.</p></article>
          <article><h3>Simplicidad</h3><p>La tecnología nos ayuda a consultar horarios, reservar y administrar clases de forma rápida.</p></article>
        </div>

        <div class="about-cta">
          <div>
            <span class="eyebrow">EMPIEZA CUANDO QUIERAS</span>
            <h3>Tu próxima clase puede empezar aquí.</h3>
            <p>Regístrate, revisa la agenda y reserva el horario que mejor se adapte a ti.</p>
          </div>
          <button class="btn" @click="irA(usuario ? 'clases' : 'registro')">{{ usuario ? 'Ver agenda' : 'Crear cuenta' }}</button>
        </div>
      </section>

      <section v-else-if="vista === 'contacto'" class="page section-wrap info-page">
        <div class="page-heading">
          <span class="eyebrow">ESTAMOS PARA TI</span>
          <h2>¿Tienes alguna pregunta?</h2>
          <p>Este formulario funciona como parte de la demostración del sitio. Puedes usarlo para enviar dudas sobre clases, horarios o reservas.</p>
        </div>

        <div class="contact-layout">
          <div class="contact-cards">
            <article><span class="contact-marker">01</span><div><strong>Visítanos</strong><p>Aguascalientes, Ags.</p></div></article>
            <article><span class="contact-marker">07:00–21:00</span><div><strong>Horario</strong><p>Lunes a sábado · 7:00 a 21:00</p></div></article>
            <article><span class="contact-marker">◎</span><div><strong>Comunidad GymFit</strong><p>Movimiento, bienestar y acompañamiento.</p></div></article>
          </div>

          <form class="contact-form" @submit.prevent="enviarContacto">
            <label>Nombre<input v-model.trim="contacto.nombre" type="text" placeholder="Tu nombre" required /></label>
            <label>Correo electrónico<input v-model.trim="contacto.email" type="email" placeholder="hola@ejemplo.com" required /></label>
            <label>Mensaje<textarea v-model.trim="contacto.mensaje" rows="5" placeholder="Cuéntanos cómo podemos ayudarte" required></textarea></label>
            <button class="btn btn-wide">Enviar mensaje</button>
            <small>En esta versión académica el envío se simula en el frontend.</small>
          </form>
        </div>
      </section>

      <section v-else-if="vista === 'clases'" class="page section-wrap">
        <div class="page-heading">
          <span class="eyebrow">AGENDA GYMFIT</span>
          <h2>Elige tu próxima clase</h2>
          <p>Consulta los lugares disponibles y reserva con tu cuenta.</p>
        </div>

        <div v-if="cargando" class="empty-state">Cargando clases...</div>
        <div v-else class="class-grid">
          <article v-for="clase in clases" :key="clase.id" class="class-card">
            <div class="class-image-wrap">
              <img class="class-image" :src="getDisciplineImage(clase.disciplina)" :alt="clase.disciplina" />
            </div>
            <div class="class-top">
              <span class="class-badge">{{ clase.disciplina || clase.nombre.split(' ')[0] }}</span>
              <span class="spots" :class="{ full: clase.disponibles <= 0 }">
                {{ clase.disponibles > 0 ? `${clase.disponibles} lugares` : 'Clase llena' }}
              </span>
            </div>
            <h3>{{ clase.nombre }}</h3>
            <p class="muted">Con {{ clase.instructor }}</p>
            <div class="class-details">
              <span class="class-date"><strong>{{ clase.dia }}</strong></span>
              <span class="class-time">{{ clase.hora }} · 01 hora</span>
              <span class="class-duration">Duración: 60 minutos</span>
            </div>
            <button class="btn btn-wide" :disabled="clase.disponibles <= 0" @click="reservar(clase.id)">
              {{ clase.disponibles > 0 ? 'Reservar clase' : 'Sin lugares' }}
            </button>
          </article>
        </div>
      </section>

      <section v-else-if="vista === 'login'" class="auth-page">
        <div class="auth-card">
          <span class="auth-icon"><img :src="heroImage" alt="" /></span>
          <span class="eyebrow">QUÉ BUENO VERTE</span>
          <h2>Bienvenida de nuevo</h2>
          <p class="muted">Ingresa con tu correo y contraseña. El sistema detectará automáticamente tu rol.</p>

          <form class="form" @submit.prevent="iniciarSesion">
            <label>Correo electrónico<input v-model.trim="login.email" type="email" placeholder="hola@ejemplo.com" required /></label>
            <label>Contraseña<input v-model="login.password" type="password" placeholder="Tu contraseña" required /></label>
            <button class="btn btn-wide" :disabled="cargando">{{ cargando ? 'Ingresando...' : 'Iniciar sesión' }}</button>
          </form>

          <p class="auth-switch">¿Aún no tienes cuenta? <button @click="irA('registro')">Regístrate aquí</button></p>
        </div>
      </section>

      <section v-else-if="vista === 'registro'" class="auth-page">
        <div class="auth-card">
          <span class="auth-icon"><img :src="heroImage" alt="" /></span>
          <span class="eyebrow">EMPIEZA CON NOSOTRAS</span>
          <h2>Crea tu cuenta</h2>
          <p class="muted">Regístrate como cliente para poder reservar y administrar tus clases.</p>

          <form class="form" @submit.prevent="registrar">
            <label>Nombre completo<input v-model.trim="registro.nombre" type="text" placeholder="Tu nombre" required /></label>
            <label>Correo electrónico<input v-model.trim="registro.email" type="email" placeholder="hola@ejemplo.com" required /></label>
            <label>Contraseña<input v-model="registro.password" type="password" minlength="6" placeholder="Mínimo 6 caracteres" required /></label>
            <label>Confirmar contraseña<input v-model="registro.confirmacion" type="password" minlength="6" placeholder="Repite tu contraseña" required /></label>
            <button class="btn btn-wide" :disabled="cargando">{{ cargando ? 'Creando cuenta...' : 'Crear mi cuenta' }}</button>
          </form>

          <p class="auth-switch">¿Ya tienes cuenta? <button @click="irA('login')">Inicia sesión</button></p>
        </div>
      </section>

      <section v-else-if="vista === 'reservas'" class="page section-wrap">
        <div class="page-heading split-heading">
          <div>
            <span class="eyebrow">MI ESPACIO</span>
            <h2>Mis reservas</h2>
            <p>Aquí puedes consultar y cancelar tus próximas clases.</p>
          </div>
          <button class="btn" @click="irA('clases')">Reservar otra clase</button>
        </div>

        <div v-if="cargando" class="empty-state">Cargando tus reservas...</div>
        <div v-else-if="reservas.length === 0" class="empty-state">
          <h3>Aún no tienes reservas</h3>
          <p>Explora nuestras clases y elige la primera.</p>
          <button class="btn" @click="irA('clases')">Ver clases</button>
        </div>
        <div v-else class="reservation-list">
          <article v-for="reserva in reservas" :key="reserva.id" class="reservation-card">
            <div>
              <span class="class-badge">{{ reserva.disciplina || 'GymFit' }}</span>
              <h3>{{ reserva.nombre }}</h3>
              <p class="muted">Con {{ reserva.instructor }} · {{ reserva.dia }} · {{ reserva.hora }}</p>
            </div>
            <button class="btn btn-danger" @click="cancelar(reserva.id)">Cancelar</button>
          </article>
        </div>
      </section>

      <section v-else-if="vista === 'admin'" class="page admin-page section-wrap">
        <div class="page-heading split-heading">
          <div>
            <span class="eyebrow">ADMINISTRACIÓN</span>
            <h2>Panel GymFit</h2>
            <p>Consulta usuarios, clases y reservas desde un solo lugar.</p>
          </div>
          <span class="admin-chip">Administrador</span>
        </div>

        <div class="admin-stats">
          <article><span class="admin-stat-icon"><img :src="heroImage" alt="" /></span><strong>{{ adminUsuarios.length }}</strong><p>clientes</p></article>
          <article><span class="admin-stat-icon"><img :src="heroImage" alt="" /></span><strong>{{ clases.length }}</strong><p>clases</p></article>
          <article><span class="admin-stat-icon"><img :src="heroImage" alt="" /></span><strong>{{ adminReservas.length }}</strong><p>reservas</p></article>
        </div>

        <div class="admin-grid">
          <section class="admin-card">
            <div class="admin-card-title"><div><span class="eyebrow">CLASES</span><h3>Nueva clase</h3></div></div>
            <form class="form compact" @submit.prevent="crearClase">
              <label>Nombre<input v-model.trim="nuevaClase.nombre" required placeholder="Pilates Reformer" /></label>
              <label>Disciplina<input v-model.trim="nuevaClase.disciplina" required placeholder="Pilates" /></label>
              <label>Instructor<input v-model.trim="nuevaClase.instructor" required placeholder="Ana" /></label>
              <div class="form-row">
                <label>Día<input v-model.trim="nuevaClase.dia" required placeholder="Lunes" /></label>
                <label>Hora<input v-model.trim="nuevaClase.hora" required placeholder="18:00" /></label>
              </div>
              <label>Cupo<input v-model.number="nuevaClase.cupo" type="number" min="1" max="50" required /></label>
              <button class="btn btn-wide">Agregar clase</button>
            </form>
          </section>

          <section class="admin-card">
            <div class="admin-card-title"><div><span class="eyebrow">AGENDA</span><h3>Clases activas</h3></div></div>
            <div class="admin-list">
              <div v-for="clase in clases" :key="clase.id" class="admin-list-row">
                <div><strong>{{ clase.nombre }}</strong><small>{{ clase.dia }} · {{ clase.hora }} · {{ clase.disponibles }}/{{ clase.cupo }} libres</small></div>
                <button class="icon-button danger" title="Eliminar clase" @click="eliminarClase(clase.id)">×</button>
              </div>
            </div>
          </section>
        </div>

        <section class="admin-card table-card">
          <div class="admin-card-title"><div><span class="eyebrow">RESERVAS</span><h3>Reservas registradas</h3></div></div>
          <div v-if="adminReservas.length === 0" class="empty-inline">No hay reservas todavía.</div>
          <div v-else class="table-wrap">
            <table>
              <thead><tr><th>Cliente</th><th>Clase</th><th>Fecha</th><th>Horario</th></tr></thead>
              <tbody><tr v-for="reserva in adminReservas" :key="reserva.id"><td>{{ reserva.usuario_nombre }}</td><td>{{ reserva.clase_nombre }}</td><td>{{ reserva.dia }}</td><td>{{ reserva.hora }}</td></tr></tbody>
            </table>
          </div>
        </section>

        <section class="admin-card table-card">
          <div class="admin-card-title"><div><span class="eyebrow">CLIENTES</span><h3>Usuarios registrados</h3></div></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th></tr></thead>
              <tbody><tr v-for="item in adminUsuarios" :key="item.id"><td>{{ item.nombre }}</td><td>{{ item.email }}</td><td><span class="role-tag">{{ item.rol }}</span></td></tr></tbody>
            </table>
          </div>
        </section>
      </section>
    </main>

    <footer>
      <strong>GymFit</strong>
      <div class="footer-links">
        <button @click="irA('nosotros')">Nosotros</button>
        <button @click="irA('contacto')">Contacto</button>
      </div>
      <span>Muévete a tu manera.</span>
      <small>Proyecto académico · 2026</small>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from './services/api'
import heroImage from './assets/yoga.jpg'
import pilatesImage from './assets/pilates.jpg'
import yogaImage from './assets/yoga.jpg'
import barreImage from './assets/barre.jpg'
import meditationImage from './assets/meditation.jpg'

const disciplineImages = {
  Pilates: pilatesImage,
  Yoga: yogaImage,
  Barre: barreImage,
  'Meditación': meditationImage
}

function getDisciplineImage(disciplina) {
  return disciplineImages[disciplina] || disciplineImages.Yoga
}

const vista = ref('inicio')
const usuario = ref(null)
const token = ref('')
const clases = ref([])
const reservas = ref([])
const adminUsuarios = ref([])
const adminReservas = ref([])
const cargando = ref(false)
const mensaje = ref('')
const error = ref('')

const login = reactive({ email: '', password: '' })
const registro = reactive({ nombre: '', email: '', password: '', confirmacion: '' })
const contacto = reactive({ nombre: '', email: '', mensaje: '' })
const nuevaClase = reactive({ nombre: '', disciplina: '', instructor: '', dia: '', hora: '', cupo: 10 })

const primerNombre = computed(() => usuario.value?.nombre?.split(' ')[0] || '')

function limpiarAvisos() {
  mensaje.value = ''
  error.value = ''
}

function avisar(texto, tipo = 'success') {
  limpiarAvisos()
  if (tipo === 'error') error.value = texto
  else mensaje.value = texto
  window.setTimeout(limpiarAvisos, 4200)
}

async function irA(destino) {
  limpiarAvisos()

  if (destino === 'clases') {
    await cargarClases()
  }

  vista.value = destino
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function enviarContacto() {
  const nombre = contacto.nombre.split(' ')[0]
  Object.assign(contacto, { nombre: '', email: '', mensaje: '' })
  avisar(`Gracias, ${nombre}. Recibimos tu mensaje`)
}

function guardarSesion(data) {
  token.value = data.token
  usuario.value = data.usuario
  localStorage.setItem('gymfit_token', data.token)
  localStorage.setItem('gymfit_usuario', JSON.stringify(data.usuario))
}

function cerrarSesion() {
  token.value = ''
  usuario.value = null
  reservas.value = []
  adminUsuarios.value = []
  adminReservas.value = []
  localStorage.removeItem('gymfit_token')
  localStorage.removeItem('gymfit_usuario')
  avisar('Sesión cerrada correctamente.')
  irA('inicio')
}

async function cargarClases() {
  try {
    clases.value = await api.obtenerClases()
  } catch (e) {
    avisar(e.message, 'error')
  }
}

async function iniciarSesion() {
  cargando.value = true
  limpiarAvisos()
  try {
    const data = await api.login(login)
    guardarSesion(data)
    login.email = ''
    login.password = ''
    avisar(`¡Bienvenida, ${data.usuario.nombre}!`)
    if (data.usuario.rol === 'admin') await abrirAdmin()
    else await abrirReservas()
  } catch (e) {
    avisar(e.message, 'error')
  } finally {
    cargando.value = false
  }
}

async function registrar() {
  if (registro.password !== registro.confirmacion) {
    avisar('Las contraseñas no coinciden.', 'error')
    return
  }

  cargando.value = true
  limpiarAvisos()
  try {
    const data = await api.registro({ nombre: registro.nombre, email: registro.email, password: registro.password })
    guardarSesion(data)
    Object.assign(registro, { nombre: '', email: '', password: '', confirmacion: '' })
    avisar('¡Cuenta creada! Ya puedes reservar tu primera clase.')
    await abrirReservas()
  } catch (e) {
    avisar(e.message, 'error')
  } finally {
    cargando.value = false
  }
}

async function reservar(claseId) {
  if (!usuario.value) {
    avisar('Inicia sesión para reservar una clase.', 'error')
    irA('login')
    return
  }
  if (usuario.value.rol === 'admin') {
    avisar('Las cuentas de administrador no realizan reservas.', 'error')
    return
  }

  cargando.value = true
  try {
    await api.crearReserva(token.value, claseId)
    await cargarClases()
    avisar('Reserva confirmada. Te esperamos.')
  } catch (e) {
    avisar(e.message, 'error')
  } finally {
    cargando.value = false
  }
}

async function abrirReservas() {
  if (!usuario.value) return irA('login')
  cargando.value = true
  irA('reservas')
  try {
    reservas.value = await api.misReservas(token.value)
  } catch (e) {
    avisar(e.message, 'error')
  } finally {
    cargando.value = false
  }
}

async function cancelar(id) {
  try {
    await api.cancelarReserva(token.value, id)
    reservas.value = await api.misReservas(token.value)
    await cargarClases()
    avisar('Reserva cancelada.')
  } catch (e) {
    avisar(e.message, 'error')
  }
}

async function abrirAdmin() {
  if (usuario.value?.rol !== 'admin') return irA('inicio')
  cargando.value = true
  irA('admin')
  try {
    const [usuarios, reservasData] = await Promise.all([
      api.adminUsuarios(token.value),
      api.adminReservas(token.value)
    ])
    adminUsuarios.value = usuarios
    adminReservas.value = reservasData
    await cargarClases()
  } catch (e) {
    avisar(e.message, 'error')
  } finally {
    cargando.value = false
  }
}

async function crearClase() {
  try {
    await api.crearClase(token.value, nuevaClase)
    Object.assign(nuevaClase, { nombre: '', disciplina: '', instructor: '', dia: '', hora: '', cupo: 10 })
    await cargarClases()
    avisar('Clase agregada correctamente.')
  } catch (e) {
    avisar(e.message, 'error')
  }
}

async function eliminarClase(id) {
  if (!window.confirm('¿Eliminar esta clase? También se eliminarán sus reservas.')) return
  try {
    await api.eliminarClase(token.value, id)
    await abrirAdmin()
    avisar('Clase eliminada.')
  } catch (e) {
    avisar(e.message, 'error')
  }
}

onMounted(async () => {
  const savedToken = localStorage.getItem('gymfit_token')
  const savedUser = localStorage.getItem('gymfit_usuario')
  if (savedToken && savedUser) {
    token.value = savedToken
    try { usuario.value = JSON.parse(savedUser) } catch { cerrarSesion() }
  }
  await cargarClases()
})
</script>