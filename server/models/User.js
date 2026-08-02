import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true, index: true },
  name: { type: String, trim: true, default: '' },
  email: { type: String, required: true, trim: true, lowercase: true, index: true },
  role: { type: String, enum: ['admin', 'officer', 'analyst'], default: 'officer' },
  department: { type: String, trim: true, default: '' },
  organization: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true })

export default mongoose.model('User', userSchema)
