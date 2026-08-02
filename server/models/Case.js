import mongoose from 'mongoose'

const caseSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Report title is required.'], trim: true, maxlength: 120 },
  caseNumber: { type: String, required: [true, 'Case number is required.'], trim: true, maxlength: 50 },
  description: { type: String, required: [true, 'Description is required.'], trim: true, maxlength: 2000 },
  threatLevel: { type: String, required: true, enum: ['Low', 'Medium', 'High', 'Critical'] },
  status: { type: String, required: true, enum: ['Open', 'Active', 'Review', 'Closed'] },
  createdByUid: { type: String, required: true, index: true },
  createdByEmail: { type: String, required: true, trim: true }
}, { timestamps: true })

export default mongoose.model('Case', caseSchema)
