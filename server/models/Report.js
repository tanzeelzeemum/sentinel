import mongoose from 'mongoose'

const objectId = mongoose.Schema.Types.ObjectId

const reportSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Report title is required.'], trim: true, maxlength: 140 },
  caseId: { type: objectId, ref: 'Case', default: null, index: true },
  status: { type: String, enum: ['unassigned', 'linked', 'reviewed'], default: 'unassigned', index: true },
  description: { type: String, required: [true, 'Description is required.'], trim: true, maxlength: 3000 },
  incidentDate: { type: Date, required: [true, 'Incident date is required.'] },
  location: { type: String, trim: true, maxlength: 160, default: '' },
  sourceReliability: { type: Number, required: true, min: 1, max: 5, validate: { validator: Number.isInteger, message: 'Source reliability must be an integer from 1 to 5.' } },
  informationCredibility: { type: Number, required: true, min: 1, max: 5, validate: { validator: Number.isInteger, message: 'Information credibility must be an integer from 1 to 5.' } },
  evidenceDescription: { type: String, trim: true, maxlength: 2000, default: '' },
  submittedBy: { type: objectId, ref: 'User', required: true, index: true },
  submittedByUid: { type: String, required: true, index: true },
  submittedByEmail: { type: String, required: true, trim: true, lowercase: true }
}, { timestamps: true })

reportSchema.index({ title: 'text', description: 'text' })
reportSchema.index({ createdAt: -1 })

export default mongoose.model('Report', reportSchema)
