import mongoose from 'mongoose'

const alertSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  caseNumber: { type: String, required: true },
  title: { type: String, required: true },
  threatLevel: { type: String, enum: ['high', 'critical', 'High', 'Critical'], required: true },
  status: { type: String, enum: ['New', 'Acknowledged', 'Resolved'], default: 'New' },
  createdByUid: { type: String, required: true, index: true },
  createdByEmail: { type: String, required: true }
}, { timestamps: true })

export default mongoose.model('Alert', alertSchema)
