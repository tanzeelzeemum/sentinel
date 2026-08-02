import mongoose from 'mongoose'

const objectId = mongoose.Schema.Types.ObjectId

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  author: { type: objectId, ref: 'User', required: true },
  authorName: { type: String, trim: true, default: '' },
  authorEmail: { type: String, trim: true, lowercase: true, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { _id: true })

const threatAssessmentSchema = new mongoose.Schema({
  probability: { type: Number, min: 1, max: 5 },
  impact: { type: Number, min: 1, max: 5 },
  sourceReliability: { type: Number, min: 1, max: 5 },
  urgency: { type: Number, min: 1, max: 5 },
  score: { type: Number, min: 1, max: 25 },
  calculatedLevel: { type: String, enum: ['low', 'moderate', 'high', 'critical'] },
  assessedBy: { type: objectId, ref: 'User' },
  assessorName: { type: String, trim: true, default: '' },
  assessedAt: { type: Date }
}, { _id: false })

const caseSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Report title is required.'], trim: true, maxlength: 120 },
  caseNumber: { type: String, required: [true, 'Case number is required.'], trim: true, maxlength: 50 },
  description: { type: String, required: [true, 'Description is required.'], trim: true, maxlength: 2000 },
  category: { type: String, trim: true, maxlength: 80, default: 'General' },
  threatLevel: { type: String, required: true, enum: ['low', 'moderate', 'high', 'critical', 'Low', 'Medium', 'High', 'Critical'] },
  status: { type: String, required: true, enum: ['open', 'under-review', 'resolved', 'closed', 'Open', 'Active', 'Review', 'Closed'] },
  location: { type: String, trim: true, maxlength: 160, default: '' },
  assignedOfficer: { type: objectId, ref: 'User', default: null },
  createdBy: { type: objectId, ref: 'User', default: null },
  createdByUid: { type: String, required: true, index: true },
  createdByEmail: { type: String, required: true, trim: true }
  ,
  tags: [{ type: String, trim: true, maxlength: 40 }],
  openedAt: { type: Date, default: Date.now },
  dueDate: { type: Date, default: null },
  closedAt: { type: Date, default: null },
  notes: { type: [noteSchema], default: [] },
  threatAssessment: { type: threatAssessmentSchema, default: undefined }
}, { timestamps: true })

caseSchema.index({ caseNumber: 1 }, { unique: true, sparse: true })
caseSchema.index({ assignedOfficer: 1 })
caseSchema.index({ createdBy: 1 })

export default mongoose.model('Case', caseSchema)
