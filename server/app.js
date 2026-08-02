import cors from 'cors'
import express from 'express'
import caseRoutes from './routes/caseRoutes.js'
import alertRoutes from './routes/alertRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import reportRoutes from './routes/reportRoutes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

const app = express()
const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:5173', 'http://127.0.0.1:5173']

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Origin not allowed by CORS'))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Sentinel API is running' }))
app.use("/api/cases", caseRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/profile', profileRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
