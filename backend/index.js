import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = express();
const server = createServer(app)

// Cors with socket io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  // These for faster performance
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
})

// middlewares
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))
app.use(express.json())

// Path to store pads data
const PADS_FILE = 'pads.json'

// To read pads
const readPads = () => {
  try {
    if (fs.existsSync(PADS_FILE)) {
      const data = fs.readFileSync(PADS_FILE);
      return JSON.parse(data);
    }
    return {};
  } catch (err) {
    console.error("Error reading pads:", err);
  }
  return {};
}

// To write pads to file
const writePads = (pads) => {
  try {
    fs.writeFileSync(PADS_FILE, JSON.stringify(pads, null, 2))
  } catch (error) {
    console.log("Error writing pads: ", error)
  }
}

// socket io connection handling
io.on('connection', (socket) => {
  console.log("User connected : ", socket.id)

  // join a pad
  socket.on('join-pad', (padId) => {
    socket.join(padId)
    console.log(`User ${socket.id} joined pad : ${padId}`)
  })

  // leave a pad
  socket.on('leave-pad', (padId) => {
    socket.leave(padId)
    console.log(`User ${socket.id} left pad : ${padId}`)
  })

  // real time content changes - THIS IS THE KEY PART
  socket.on('pad-update', (data) => {
    const { padId, content } = data
    console.log(`Received update for pad ${padId} from user ${socket.id}`)

    // Save to file
    const pads = readPads()
    pads[padId] = {
      ...pads[padId],
      content,
      lastModified: new Date().toISOString()
    }
    writePads(pads)

    // Broadcast to all OTHER users in the same pad room
    socket.to(padId).emit('pad-updated', {
      content,
      lastModified: pads[padId].lastModified
    })

    console.log(`Broadcasted update for pad ${padId} to other users`)
  })

  // disconnect 
  socket.on('disconnect', () => {
    console.log('User disconnected : ', socket.id)
  })
})

// REST API routes remain the same
app.get('/pad/:id', (req, res) => {
  const { id } = req.params
  const pads = readPads()

  if (pads[id]) {
    res.json({
      id,
      content: pads[id].content,
      lastModified: pads[id].lastModified
    })
  } else {
    const newPad = {
      content: "",
      lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    pads[id] = newPad
    writePads(pads)

    res.json({
      id,
      content: pads[id].content,
      lastModified: pads[id].lastModified
    })
  }
})

app.post('/pad/:id', (req, res) => {
  const { id } = req.params
  const { content } = req.body

  if (typeof content != 'string') {
    return res.status(400).json({ error: 'Content must be of string type' })
  }

  const pads = readPads()

  pads[id] = {
    ...pads[id],
    content,
    lastModified: new Date().toISOString()
  }

  writePads(pads)

  res.json({
    success: true,
    id,
    lastModified: pads[id].lastModified
  })
})

app.get('/pads', (req, res) => {
  const pads = readPads()
  const padsList = Object.keys(pads).map(id => ({
    id,
    lastModified: pads[id].lastModified,
    createdAt: pads[id].createdAt
  }))
  res.json({
    success: true,
    pads: padsList
  })
})

app.delete('/pad/:id', (req, res) => {
  const { id } = req.params
  const pads = readPads()
  if (pads[id]) {
    delete pads[id]
    writePads(pads)
    res.json({ success: true, message: 'Pad Deleted' })
  } else {
    res.status(404).json({ error: " Pad not found" })
  }
})

app.get('/', (req, res) => {
  res.send("ScratchPad Backend is running ! ");
})

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
})