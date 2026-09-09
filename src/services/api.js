const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.mensaje || 'Ocurrió un error al comunicarse con el servidor.')
  }

  return data
}

export default {
  obtenerClases() {
    return request('/clases')
  },

  registro(datos) {
    return request('/auth/register', { method: 'POST', body: datos })
  },

  login(datos) {
    return request('/auth/login', { method: 'POST', body: datos })
  },

  misReservas(token) {
    return request('/reservas/mias', { token })
  },

  crearReserva(token, claseId) {
    return request('/reservas', { method: 'POST', token, body: { claseId } })
  },

  cancelarReserva(token, reservaId) {
    return request(`/reservas/${reservaId}`, { method: 'DELETE', token })
  },

  adminUsuarios(token) {
    return request('/admin/usuarios', { token })
  },

  adminReservas(token) {
    return request('/admin/reservas', { token })
  },

  crearClase(token, datos) {
    return request('/admin/clases', { method: 'POST', token, body: datos })
  },

  actualizarClase(token, claseId, datos) {
    return request(`/admin/clases/${claseId}`, { method: 'PUT', token, body: datos })
  },

  eliminarClase(token, claseId) {
    return request(`/admin/clases/${claseId}`, { method: 'DELETE', token })
  }
}
