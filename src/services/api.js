import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Crea un archivo .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.')
  }
}

function friendlyError(error, fallback = 'Ocurrió un error al comunicarse con Supabase.') {
  const message = String(error?.message || '')

  if (error?.code === '23505') return new Error('Ya reservaste esta clase.')
  if (error?.code === '23503') return new Error('La clase seleccionada ya no existe.')
  if (message.includes('CLASE_LLENA')) return new Error('La clase ya no tiene lugares disponibles.')
  if (message.includes('SOLO_CLIENTES')) return new Error('Solo los clientes pueden reservar clases.')
  if (message.includes('Invalid login credentials')) return new Error('Correo o contraseña incorrectos.')
  if (message.includes('Email not confirmed')) return new Error('Primero confirma tu correo para iniciar sesión.')
  if (message.includes('User already registered')) return new Error('Ya existe una cuenta con ese correo.')

  return new Error(message || fallback)
}

async function getCurrentUser() {
  requireSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw friendlyError(error)
  if (!user) throw new Error('Debes iniciar sesión.')
  return user
}

async function getUserRole(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('rol, nombre, email')
    .eq('id', userId)
    .single()

  if (error) throw friendlyError(error, 'No fue posible consultar el perfil.')
  return data
}

async function obtenerClases() {
  requireSupabase()

  const { data, error } = await supabase.rpc('get_clases_con_disponibilidad')
  if (error) throw friendlyError(error, 'No fue posible consultar las clases.')

  return (data || []).map((clase) => ({
    ...clase,
    cupo: Number(clase.cupo),
    disponibles: Number(clase.disponibles)
  }))
}

async function registro(datos) {
  requireSupabase()
  const { nombre, email, password } = datos || {}

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } }
  })

  if (error) throw friendlyError(error, 'No fue posible crear la cuenta.')
  if (!data.user) throw new Error('No fue posible crear la cuenta.')

  if (!data.session) {
    throw new Error('Cuenta creada. Revisa tu correo y confirma la cuenta antes de iniciar sesión.')
  }

  return {
    token: data.session.access_token,
    usuario: {
      id: data.user.id,
      nombre,
      email: data.user.email || email,
      rol: 'cliente'
    }
  }
}

async function login(datos) {
  requireSupabase()
  const { email, password } = datos || {}

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw friendlyError(error, 'No fue posible iniciar sesión.')

  const perfil = await getUserRole(data.user.id)

  return {
    token: data.session?.access_token || '',
    usuario: {
      id: data.user.id,
      nombre: perfil?.nombre || data.user.user_metadata?.nombre || data.user.email,
      email: data.user.email,
      rol: perfil?.rol || 'cliente'
    }
  }
}

async function misReservas(_token) {
  requireSupabase()
  const user = await getCurrentUser()

  const { data: reservas, error } = await supabase
    .from('reservas')
    .select('id, clase_id, created_at')
    .eq('usuario_id', user.id)
    .order('id', { ascending: false })

  if (error) throw friendlyError(error, 'No fue posible consultar tus reservas.')

  const salida = []
  for (const reserva of reservas || []) {
    const { data: clase, error: claseError } = await supabase
      .from('clases')
      .select('*')
      .eq('id', reserva.clase_id)
      .single()

    if (claseError) throw friendlyError(claseError, 'No fue posible consultar una clase reservada.')

    salida.push({
      id: reserva.id,
      clase_id: reserva.clase_id,
      nombre: clase.nombre,
      disciplina: clase.disciplina,
      instructor: clase.instructor,
      dia: clase.dia,
      hora: clase.hora,
      cupo: clase.cupo,
      created_at: reserva.created_at
    })
  }

  return salida
}

async function crearReserva(_token, claseId) {
  requireSupabase()
  const user = await getCurrentUser()

  const { data, error } = await supabase
    .from('reservas')
    .insert({ usuario_id: user.id, clase_id: Number(claseId) })
    .select('id')
    .single()

  if (error) throw friendlyError(error, 'No fue posible crear la reserva.')
  return { id: data.id, mensaje: 'Reserva creada correctamente.' }
}

async function cancelarReserva(_token, reservaId) {
  requireSupabase()
  const user = await getCurrentUser()

  const { error } = await supabase
    .from('reservas')
    .delete()
    .eq('id', Number(reservaId))
    .eq('usuario_id', user.id)

  if (error) throw friendlyError(error, 'No fue posible cancelar la reserva.')
  return { mensaje: 'Reserva cancelada.' }
}

async function adminUsuarios(_token) {
  requireSupabase()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, nombre, email, rol, created_at')
    .eq('rol', 'cliente')
    .order('created_at', { ascending: false })

  if (error) throw friendlyError(error, 'No fue posible consultar los usuarios.')
  return data || []
}

async function adminReservas(_token) {
  requireSupabase()

  const { data: reservas, error } = await supabase
    .from('reservas')
    .select('id, created_at, usuario_id, clase_id')
    .order('id', { ascending: false })

  if (error) throw friendlyError(error, 'No fue posible consultar las reservas.')

  const salida = []
  for (const reserva of reservas || []) {
    const [{ data: usuario, error: userError }, { data: clase, error: claseError }] = await Promise.all([
      supabase.from('profiles').select('nombre, email').eq('id', reserva.usuario_id).single(),
      supabase.from('clases').select('nombre, disciplina, dia, hora').eq('id', reserva.clase_id).single()
    ])

    if (userError) throw friendlyError(userError, 'No fue posible consultar el cliente de una reserva.')
    if (claseError) throw friendlyError(claseError, 'No fue posible consultar la clase de una reserva.')

    salida.push({
      id: reserva.id,
      created_at: reserva.created_at,
      usuario_nombre: usuario.nombre,
      usuario_email: usuario.email,
      clase_nombre: clase.nombre,
      disciplina: clase.disciplina,
      dia: clase.dia,
      hora: clase.hora
    })
  }

  return salida
}

async function requireAdminSession() {
  const user = await getCurrentUser()
  const profile = await getUserRole(user.id)
  if (profile.rol !== 'admin') throw new Error('No tienes permisos de administrador.')
  return user
}

async function crearClase(_token, datos) {
  requireSupabase()
  await requireAdminSession()

  const payload = {
    nombre: datos.nombre,
    disciplina: datos.disciplina,
    instructor: datos.instructor,
    dia: datos.dia,
    hora: datos.hora,
    cupo: Number(datos.cupo)
  }

  const { data, error } = await supabase
    .from('clases')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw friendlyError(error, 'No fue posible crear la clase.')
  return data
}

async function actualizarClase(_token, claseId, datos) {
  requireSupabase()
  await requireAdminSession()

  const payload = {
    nombre: datos.nombre,
    disciplina: datos.disciplina,
    instructor: datos.instructor,
    dia: datos.dia,
    hora: datos.hora,
    cupo: Number(datos.cupo)
  }

  const { data, error } = await supabase
    .from('clases')
    .update(payload)
    .eq('id', Number(claseId))
    .select('*')
    .single()

  if (error) throw friendlyError(error, 'No fue posible actualizar la clase.')
  return data
}

async function eliminarClase(_token, claseId) {
  requireSupabase()
  await requireAdminSession()

  const { error } = await supabase
    .from('clases')
    .delete()
    .eq('id', Number(claseId))

  if (error) throw friendlyError(error, 'No fue posible eliminar la clase.')
  return { mensaje: 'Clase eliminada.' }
}

export default {
  obtenerClases,
  registro,
  login,
  misReservas,
  crearReserva,
  cancelarReserva,
  adminUsuarios,
  adminReservas,
  crearClase,
  actualizarClase,
  eliminarClase
}
