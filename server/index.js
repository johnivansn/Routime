import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
import multer from 'multer'
import { google } from 'googleapis'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'
import { promises as fs } from 'node:fs'

dotenv.config({ path: new URL('./.env', import.meta.url) })

const PORT = process.env.PORT || 4321
const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_DB = process.env.MONGODB_DB || 'routime'
const MONGODB_COLLECTION = process.env.MONGODB_COLLECTION || 'sync'
const DRIVE_FOLDER_RAW = process.env.DRIVE_FOLDER_ID
const DRIVE_PUBLIC = process.env.DRIVE_PUBLIC !== 'false'
const GOOGLE_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS
const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET
const GOOGLE_OAUTH_REDIRECT = process.env.GOOGLE_OAUTH_REDIRECT

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in server/.env')
  process.exit(1)
}
if (!DRIVE_FOLDER_RAW) {
  console.error('Missing DRIVE_FOLDER_ID in server/.env')
  process.exit(1)
}

const client = new MongoClient(MONGODB_URI)
await client.connect()
const collection = client.db(MONGODB_DB).collection(MONGODB_COLLECTION)

const resolveFolderId = (value) => {
  if (!value) return value
  if (value.includes('drive.google.com')) {
    const match = value.match(/folders\/([^/?]+)/)
    return match ? match[1] : value
  }
  return value
}

const DRIVE_FOLDER_ID = resolveFolderId(DRIVE_FOLDER_RAW)
const tokenPath = fileURLToPath(new URL('./oauth-token.json', import.meta.url))

const getDriveClient = async () => {
  if (GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CLIENT_SECRET && GOOGLE_OAUTH_REDIRECT) {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_OAUTH_CLIENT_ID,
      GOOGLE_OAUTH_CLIENT_SECRET,
      GOOGLE_OAUTH_REDIRECT
    )
    try {
      const tokenRaw = await fs.readFile(tokenPath, 'utf-8')
      const tokens = JSON.parse(tokenRaw)
      oauth2Client.setCredentials(tokens)
    } catch {
      throw new Error('No autorizado. Visita /oauth2/start')
    }
    return { drive: google.drive({ version: 'v3', auth: oauth2Client }), oauth2Client }
  }

  if (!GOOGLE_CREDENTIALS) {
    throw new Error('Faltan credenciales Google en server/.env')
  }
  const credentialsPath = fileURLToPath(new URL(GOOGLE_CREDENTIALS, import.meta.url))
  const driveAuth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  return { drive: google.drive({ version: 'v3', auth: driveAuth }) }
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '20mb' }))

const getTimestamp = (item = {}) => item.updatedAt ?? item.createdAt ?? 0

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 120 * 1024 * 1024 },
})

const mergeById = (current = [], incoming = []) => {
  const map = new Map(current.map((item) => [item.id, item]))
  for (const item of incoming) {
    const existing = map.get(item.id)
    if (!existing || getTimestamp(item) >= getTimestamp(existing)) {
      map.set(item.id, item)
    }
  }
  return [...map.values()]
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/proxy', async (req, res) => {
  const rawUrl = req.query.url
  const id = req.query.id
  if (!rawUrl && !id) {
    res.status(400).json({ error: 'url o id requerido' })
    return
  }

  const target = id
    ? `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`
    : String(rawUrl)

  try {
    const response = await fetch(target, { redirect: 'follow' })
    if (!response.ok) {
      res.status(response.status).send('No se pudo obtener el recurso.')
      return
    }
    const contentType = response.headers.get('content-type')
    if (contentType) {
      res.setHeader('content-type', contentType)
    }
    res.setHeader('cache-control', 'public, max-age=86400')
    const buffer = Buffer.from(await response.arrayBuffer())
    res.send(buffer)
  } catch (error) {
    console.error(error)
    res.status(500).send('Error al proxyear el recurso.')
  }
})

app.get('/oauth2/start', async (_req, res) => {
  if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET || !GOOGLE_OAUTH_REDIRECT) {
    res.status(400).json({ error: 'OAuth no configurado.' })
    return
  }
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_REDIRECT
  )
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive'],
    prompt: 'consent',
  })
  res.redirect(url)
})

app.get('/oauth2/callback', async (req, res) => {
  if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET || !GOOGLE_OAUTH_REDIRECT) {
    res.status(400).json({ error: 'OAuth no configurado.' })
    return
  }
  const code = req.query.code
  if (!code) {
    res.status(400).json({ error: 'Código OAuth faltante.' })
    return
  }
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_REDIRECT
  )
  const { tokens } = await oauth2Client.getToken(code)
  await fs.writeFile(tokenPath, JSON.stringify(tokens), 'utf-8')
  res.send('Autorización completada. Puedes cerrar esta pestaña.')
})

app.post('/upload', upload.array('files', 12), async (req, res) => {
  try {
    const files = req.files || []
    if (!files.length) {
      res.status(400).json({ error: 'No se recibieron archivos.' })
      return
    }

    const { drive } = await getDriveClient()
    const uploads = await Promise.all(
      files.map(async (file) => {
        const created = await drive.files.create({
          requestBody: {
            name: file.originalname,
            parents: [DRIVE_FOLDER_ID],
          },
          media: {
            mimeType: file.mimetype,
            body: Readable.from(file.buffer),
          },
          supportsAllDrives: true,
          fields: 'id,name,mimeType',
        })

        const fileId = created.data.id
        if (fileId && DRIVE_PUBLIC) {
          await drive.permissions.create({
            fileId,
            supportsAllDrives: true,
            requestBody: { type: 'anyone', role: 'reader' },
          })
        }

        const publicUrl = fileId ? `https://drive.google.com/uc?export=view&id=${fileId}` : null
        return {
          id: fileId,
          name: created.data.name,
          mimeType: created.data.mimeType,
          url: publicUrl,
        }
      })
    )

    res.json({ files: uploads })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'No se pudo subir a Drive.'
    if (message.includes('No autorizado')) {
      res.status(401).json({ error: message })
      return
    }
    res.status(500).json({ error: message })
  }
})

app.get('/sync/export', async (req, res) => {
  const clientId = req.query.clientId
  if (!clientId) {
    res.status(400).json({ error: 'clientId requerido' })
    return
  }
  const doc = await collection.findOne({ _id: clientId })
  if (!doc) {
    res.json({ exercises: [], routines: [], exportedAt: new Date().toISOString() })
    return
  }
  res.json({
    exercises: doc.exercises ?? [],
    routines: doc.routines ?? [],
    exportedAt: new Date().toISOString(),
  })
})

app.post('/sync/import', async (req, res) => {
  const mode = req.query.mode === 'merge' ? 'merge' : 'replace'
  const { clientId, exercises = [], routines = [] } = req.body || {}
  if (!clientId) {
    res.status(400).json({ error: 'clientId requerido' })
    return
  }

  if (mode === 'replace') {
    await collection.updateOne(
      { _id: clientId },
      {
        $set: {
          exercises,
          routines,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    )
    res.json({ ok: true })
    return
  }

  const current = await collection.findOne({ _id: clientId })
  const mergedExercises = mergeById(current?.exercises ?? [], exercises)
  const mergedRoutines = mergeById(current?.routines ?? [], routines)

  await collection.updateOne(
    { _id: clientId },
    {
      $set: {
        exercises: mergedExercises,
        routines: mergedRoutines,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  )

  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`Sync server running on http://localhost:${PORT}`)
})
