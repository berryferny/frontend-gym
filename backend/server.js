import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import sqlite3 from 'sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, 'data')
fs.mkdirSync(dataDir, { recursive: true })

const sqlite = sqlite3.verbose()
const db = new sqlite.Database(path.join(dataDir, 'gymfit.db'))
db.run('PRAGMA foreign_keys = ON')

const app = express()
const PORT = Number(process.env.PORT || 3000)
const JWT_SECRET = process.env.JWT_SECRET || 'gymfit-dev-secret-change-me'
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: CLIENT_ORIGIN }))
app.use(express.json())

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function callback(error) {
      if (error) reject(error)
      else resolve({ id: this.lastID, changes: this.changes })
    })
  })
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) reject(error)
      else resolve(row)
    })
  })
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) reject(error)
      else resolve(rows)
    })
  })
}

function publicUser(user) {
  return { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    JWT_SECRET,
    { expiresIn: '8h' }
  )
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) return res.status(401).json({ mensaje: 'Debes iniciar sesión.' })

  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ mensaje: 'Tu sesión expiró. Inicia sesión nuevamente.' })
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'No tienes permisos de administrador.' })
  }
  next()
}

async function initDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS clases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      disciplina TEXT NOT NULL,
      instructor TEXT NOT NULL,
      dia TEXT NOT NULL,
      hora TEXT NOT NULL,
      cupo INTEGER NOT NULL DEFAULT 10 CHECK (cupo > 0),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS reservas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      clase_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(usuario_id, clase_id),
      FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY(clase_id) REFERENCES clases(id) ON DELETE CASCADE
    )
  `)

  const admin = await get('SELECT id FROM usuarios WHERE email = ?', ['admin@gymfit.com'])
  if (!admin) {
    const password = await bcrypt.hash('GymFit2026!', 10)
    await run(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      ['Administración GymFit', 'admin@gymfit.com', password, 'admin']
    )
  }

  const classCount = await get('SELECT COUNT(*) AS total FROM clases')
  if (classCount.total === 0) {
    const seedClasses = [
      ['Pilates Reformer', 'Pilates', 'Ana', 'Lunes', '18:00', 10],
      ['Yoga Vinyasa', 'Yoga', 'Sofía', 'Martes', '19:00', 12],
      ['Barre Intense', 'Barre', 'Caro', 'Miércoles', '18:30', 10],
      ['Meditación & Breathwork', 'Meditación', 'Elena', 'Jueves', '20:00', 15],
      ['Pilates Flow', 'Pilates', 'Mariana', 'Sábado', '09:00', 12],
      ['Yoga Suave', 'Yoga', 'Sofía', 'Sábado', '10:30', 14]
    ]

    for (const item of seedClasses) {
      await run(
        'INSERT INTO clases (nombre, disciplina, instructor, dia, hora, cupo) VALUES (?, ?, ?, ?, ?, ?)',
        item
      )
    }
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, servicio: 'GymFit API' })
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const nombre = String(req.body.nombre || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (!nombre || !email || !password) {
      return res.status(400).json({ mensaje: 'Nombre, correo y contraseña son obligatorios.' })
    }
    if (password.length < 6) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres.' })
    }

    const existing = await get('SELECT id FROM usuarios WHERE email = ?', [email])
    if (existing) return res.status(409).json({ mensaje: 'Ya existe una cuenta con ese correo.' })

    const hashed = await bcrypt.hash(password, 10)
    const result = await run(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, hashed, 'cliente']
    )
    const user = await get('SELECT * FROM usuarios WHERE id = ?', [result.id])

    res.status(201).json({ token: createToken(user), usuario: publicUser(user) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'No fue posible crear la cuenta.' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')
    const user = await get('SELECT * FROM usuarios WHERE email = ?', [email])

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' })
    }

    res.json({ token: createToken(user), usuario: publicUser(user) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'No fue posible iniciar sesión.' })
  }
})

app.get('/api/clases', async (_req, res) => {
  try {
    const clases = await all(`
      SELECT c.id, c.nombre, c.disciplina, c.instructor, c.dia, c.hora, c.cupo,
             MAX(c.cupo - COUNT(r.id), 0) AS disponibles
      FROM clases c
      LEFT JOIN reservas r ON r.clase_id = c.id
      GROUP BY c.id
      ORDER BY c.id ASC
    `)
    res.json(clases)
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'No fue posible consultar las clases.' })
  }
})

app.post('/api/reservas', requireAuth, async (req, res) => {
  try {
    if (req.user.rol !== 'cliente') {
      return res.status(403).json({ mensaje: 'Solo los clientes pueden reservar clases.' })
    }

    const claseId = Number(req.body.claseId)
    if (!Number.isInteger(claseId)) {
      return res.status(400).json({ mensaje: 'Selecciona una clase válida.' })
    }

    const clase = await get('SELECT * FROM clases WHERE id = ?', [claseId])
    if (!clase) return res.status(404).json({ mensaje: 'La clase no existe.' })

    const duplicate = await get(
      'SELECT id FROM reservas WHERE usuario_id = ? AND clase_id = ?',
      [req.user.id, claseId]
    )
    if (duplicate) return res.status(409).json({ mensaje: 'Ya reservaste esta clase.' })

    const count = await get('SELECT COUNT(*) AS total FROM reservas WHERE clase_id = ?', [claseId])
    if (count.total >= clase.cupo) {
      return res.status(409).json({ mensaje: 'La clase ya no tiene lugares disponibles.' })
    }

    const result = await run(
      'INSERT INTO reservas (usuario_id, clase_id) VALUES (?, ?)',
      [req.user.id, claseId]
    )
    res.status(201).json({ id: result.id, mensaje: 'Reserva creada correctamente.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'No fue posible crear la reserva.' })
  }
})

app.get('/api/reservas/mias', requireAuth, async (req, res) => {
  try {
    const reservas = await all(`
      SELECT r.id, r.created_at, c.id AS clase_id, c.nombre, c.disciplina,
             c.instructor, c.dia, c.hora
      FROM reservas r
      INNER JOIN clases c ON c.id = r.clase_id
      WHERE r.usuario_id = ?
      ORDER BY r.id DESC
    `, [req.user.id])
    res.json(reservas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'No fue posible consultar tus reservas.' })
  }
})

app.delete('/api/reservas/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const reserva = await get('SELECT * FROM reservas WHERE id = ?', [id])
    if (!reserva) return res.status(404).json({ mensaje: 'La reserva no existe.' })

    if (req.user.rol !== 'admin' && reserva.usuario_id !== req.user.id) {
      return res.status(403).json({ mensaje: 'No puedes cancelar esta reserva.' })
    }

    await run('DELETE FROM reservas WHERE id = ?', [id])
    res.json({ mensaje: 'Reserva cancelada.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'No fue posible cancelar la reserva.' })
  }
})

app.get('/api/admin/usuarios', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const usuarios = await all(
      "SELECT id, nombre, email, rol, created_at FROM usuarios WHERE rol = 'cliente' ORDER BY id DESC"
    )
    res.json(usuarios)
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'No fue posible consultar los usuarios.' })
  }
})

app.get('/api/admin/reservas', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const reservas = await all(`
      SELECT r.id, r.created_at, u.nombre AS usuario_nombre, u.email AS usuario_email,
             c.nombre AS clase_nombre, c.disciplina, c.dia, c.hora
      FROM reservas r
      INNER JOIN usuarios u ON u.id = r.usuario_id
      INNER JOIN clases c ON c.id = r.clase_id
      ORDER BY r.id DESC
    `)
    res.json(reservas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'No fue posible consultar las reservas.' })
  }
})

app.post('/api/admin/clases', requireAuth, requireAdmin, async (req, res) => {
  try {
    const nombre = String(req.body.nombre || '').trim()
    const disciplina = String(req.body.disciplina || '').trim()
    const instructor = String(req.body.instructor || '').trim()
    const dia = String(req.body.dia || '').trim()
    const hora = String(req.body.hora || '').trim()
    const cupo = Number(req.body.cupo)

    if (!nombre || !disciplina || !instructor || !dia || !hora || !Number.isInteger(cupo) || cupo < 1) {
      return res.status(400).json({ mensaje: 'Completa correctamente todos los datos de la clase.' })
    }

    const result = await run(
      'INSERT INTO clases (nombre, disciplina, instructor, dia, hora, cupo) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, disciplina, instructor, dia, hora, cupo]
    )
    const clase = await get('SELECT * FROM clases WHERE id = ?', [result.id])
    res.status(201).json(clase)
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'No fue posible crear la clase.' })
  }
})

app.put('/api/admin/clases/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const actual = await get('SELECT * FROM clases WHERE id = ?', [id])
    if (!actual) return res.status(404).json({ mensaje: 'La clase no existe.' })

    const nombre = String(req.body.nombre ?? actual.nombre).trim()
    const disciplina = String(req.body.disciplina ?? actual.disciplina).trim()
    const instructor = String(req.body.instructor ?? actual.instructor).trim()
    const dia = String(req.body.dia ?? actual.dia).trim()
    const hora = String(req.body.hora ?? actual.hora).trim()
    const cupo = Number(req.body.cupo ?? actual.cupo)

    const reservas = await get('SELECT COUNT(*) AS total FROM reservas WHERE clase_id = ?', [id])
    if (!Number.isInteger(cupo) || cupo < reservas.total) {
      return res.status(400).json({ mensaje: `El cupo no puede ser menor a las ${reservas.total} reservas actuales.` })
    }

    await run(
      'UPDATE clases SET nombre = ?, disciplina = ?, instructor = ?, dia = ?, hora = ?, cupo = ? WHERE id = ?',
      [nombre, disciplina, instructor, dia, hora, cupo, id]
    )
    const clase = await get('SELECT * FROM clases WHERE id = ?', [id])
    res.json(clase)
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'No fue posible actualizar la clase.' })
  }
})

app.delete('/api/admin/clases/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await run('DELETE FROM clases WHERE id = ?', [Number(req.params.id)])
    if (!result.changes) return res.status(404).json({ mensaje: 'La clase no existe.' })
    res.json({ mensaje: 'Clase eliminada.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'No fue posible eliminar la clase.' })
  }
})

app.use((_req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada.' })
})

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`GymFit API disponible en http://localhost:${PORT}`)
      if (!process.env.JWT_SECRET) {
        console.warn('Aviso: usando JWT_SECRET de desarrollo. Configura backend/.env para producción.')
      }
    })
  })
  .catch((error) => {
    console.error('No se pudo inicializar la base de datos:', error)
    process.exit(1)
  })
