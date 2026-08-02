import mongoose from 'mongoose'

const profileSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  fullName: { type: String, trim: true, maxlength: 120, default: '' },
  role: { type: String, trim: true, maxlength: 120, default: '' },
  department: { type: String, trim: true, maxlength: 120, default: '' },
  organization: { type: String, trim: true, maxlength: 120, default: '' }
}, { timestamps: true })

export default mongoose.model('Profile', profileSchema)
