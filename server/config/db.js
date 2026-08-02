import mongoose from 'mongoose'

export async function connectDB() {
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI is missing. Database features are disabled.')
    return false
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB connected')
    return true
  } catch (error) {
    console.warn(`MongoDB is not available: ${error.message}`)
    return false
  }
}
