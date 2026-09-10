import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.')
  }
}

async function getCurrentUser() {
  requireSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw new Error(error.message)
  if (!user) throw new Error('Debes iniciar sesión.')
  return user
}

async function getUserRole(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('rol, nombre, email')
    .eq('id', userId)
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function obtenerClases() {
  requireSupabase()
  const { data: clases, error } = await supabase
    .from('clases')
    .select('*')
    .order('id', { ascending: true })

  if (error) throw new Error(error.message)

  const salida = []
  for (const item of clases || []) {
    const { count, error: countError } = await supabase
      .from('reservas')
      .select('id', { count: 'exact', head: true })
      .eq('clase_id', item.id)

    if (countError) throw new Error(countError.message)

    salida.push({
      ...item,
      disponibles: Math.max(item.cupo - (count || 0), 0)
    })
  }

  return salida
}

async function registro(datos) {
  requireSupabase()
  const { nombre, email, password } = datos || {}

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre }
    }
  })

  if (error) throw new Error(error.message)

  const user = data.user
  const token = data.session?.access_token || ''

  return {
    token,
    usuario: {
      id: user?.id,
      nombre,
      email,
      rol: 'cliente'
    }
  }
}

async function login(datos) {
  requireSupabase()
  const { email, password } = datos || {}

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)

  const user = data.user
  const session = data.session
  const perfil = await getUserRole(user.id)

  return {
    token: session?.access_token || '',
    usuario: {
      id: user.id,
      nombre: perfil?.nombre || user.user_metadata?.nombre || user.email,
      email: user.email,
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

  if (error) throw new Error(error.message)

  const salida = []
  for (const reserva of reservas || []) {
    const { data: clase, error: claseError } = await supabase
      .from('clases')
      .select('*')
      .eq('id', reserva.clase_id)
      .single()

    if (claseError) throw new Error(claseError.message)

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

  const { data: clase, error: claseError } = await supabase
    .from('clases')
    .select('*')
    .eq('id', claseId)
    .single()

  if (claseError) throw new Error(claseError.message)

  const { count, error: countError } = await supabase
    .from('reservas')
    .select('id', { count: 'exact', head: true })
    .eq('clase_id', claseId)

  if (countError) throw new Error(countError.message)

  if (count >= clase.cupo) {
    throw new Error('La clase ya no tiene lugares disponibles.')
  }

  const { data: existing, error: existingError } = await supabase
    .from('reservas')
    .select('id')
    .eq('usuario_id', user.id)
    .eq('clase_id', claseId)
    .limit(1)

  if (existingError) throw new Error(existingError.message)
  if ((existing || []).length > 0) {
    throw new Error('Ya reservaste esta clase.')
  }

  const { error: insertError } = await supabase
    .from('reservas')
    .insert({ usuario_id: user.id, clase_id: claseId })

  if (insertError) throw new Error(insertError.message)

  return { mensaje: 'Reserva creada correctamente.' }
}

async function cancelarReserva(_token, reservaId) {
  requireSupabase()
  const user = await getCurrentUser()
  const profile = await getUserRole(user.id)

  const { data: reserva, error: findError } = await supabase
    .from('reservas')
    .select('id, usuario_id')
    .eq('id', reservaId)
    .single()

  if (findError) throw new Error(findError.message)

  if (profile.rol !== 'admin' && reserva.usuario_id !== user.id) {
    throw new Error('No puedes cancelar esta reserva.')
  }

  const query = supabase.from('reservas').delete().eq('id', reservaId)
  if (profile.rol !== 'admin') {
    query.eq('usuario_id', user.id)
  }

  const { error } = await query
  if (error) throw new Error(error.message)

  return { mensaje: 'Reserva cancelada.' }
}

async function adminUsuarios(_token) {
  requireSupabase()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

async function adminReservas(_token) {
  requireSupabase()
  const { data: reservas, error } = await supabase
    .from('reservas')
    .select('id, created_at, usuario_id, clase_id')
    .order('id', { ascending: false })

  if (error) throw new Error(error.message)

  const salida = []
  for (const reserva of reservas || []) {
    const { data: usuario, error: userError } = await supabase
      .from('profiles')
      .select('nombre, email')
      .eq('id', reserva.usuario_id)
      .single()

    if (userError) throw new Error(userError.message)

    const { data: clase, error: claseError } = await supabase
      .from('clases')
      .select('nombre, disciplina, dia, hora')
      .eq('id', reserva.clase_id)
      .single()

    if (claseError) throw new Error(claseError.message)

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

async function crearClase(_token, datos) {
  requireSupabase()
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

  if (error) throw new Error(error.message)
  return data
}

async function actualizarClase(_token, claseId, datos) {
  requireSupabase()
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
    .eq('id', claseId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function eliminarClase(_token, claseId) {
  requireSupabase()
  const { error } = await supabase
    .from('clases')
    .delete()
    .eq('id', claseId)

  if (error) throw new Error(error.message)

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
