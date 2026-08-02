import 'dotenv/config'
import app from './app.js'
import { connectDB } from './config/db.js'

const port = process.env.PORT || 5000

app.listen(port, () => console.log(`Sentinel API running on port ${port}`))
connectDB()
