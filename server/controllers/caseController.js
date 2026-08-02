import Case from '../models/Case.js'
import Alert from '../models/Alert.js'
import AppError from '../utils/AppError.js'
import asyncHandler from '../utils/asyncHandler.js'

const allowedFields = ['title', 'caseNumber', 'description', 'threatLevel', 'status']
const reportFields = body => Object.fromEntries(Object.entries(body).filter(([key]) => allowedFields.includes(key)))
const findOwnedCase = (id, uid) => Case.findOne({ _id: id, createdByUid: uid })
const syncAlert = async caseFile => {
  const isPriority = ['High', 'Critical'].includes(caseFile.threatLevel)
  if (!isPriority) return Alert.deleteOne({ caseId: caseFile._id })
  return Alert.findOneAndUpdate({ caseId: caseFile._id }, { caseNumber: caseFile.caseNumber, title: caseFile.title, threatLevel: caseFile.threatLevel, createdByUid: caseFile.createdByUid, createdByEmail: caseFile.createdByEmail, $setOnInsert: { status: 'New' } }, { new: true, upsert: true, setDefaultsOnInsert: true })
}

export const getCases = asyncHandler(async (req, res) => {
  const cases = await Case.find({ createdByUid: req.user.uid }).sort({ updatedAt: -1 })
  res.json({ success: true, cases })
})

export const getCaseById = asyncHandler(async (req, res) => {
  const caseFile = await findOwnedCase(req.params.id, req.user.uid)
  if (!caseFile) throw new AppError('Report not found or access is not allowed.', 404)
  res.json({ success: true, case: caseFile })
})

export const createCase = asyncHandler(async (req, res) => {
  const caseFile = await Case.create({
    ...reportFields(req.body),
    createdByUid: req.user.uid,
    createdByEmail: req.user.email || 'unknown@example.com'
  })
  await syncAlert(caseFile)
  res.status(201).json({ success: true, case: caseFile })
})

export const updateCase = asyncHandler(async (req, res) => {
  const caseFile = await Case.findOneAndUpdate(
    { _id: req.params.id, createdByUid: req.user.uid },
    reportFields(req.body),
    { new: true, runValidators: true }
  )
  if (!caseFile) throw new AppError('Report not found or access is not allowed.', 404)
  await syncAlert(caseFile)
  res.json({ success: true, case: caseFile })
})

export const deleteCase = asyncHandler(async (req, res) => {
  const caseFile = await Case.findOneAndDelete({ _id: req.params.id, createdByUid: req.user.uid })
  if (!caseFile) throw new AppError('Report not found or access is not allowed.', 404)
  await Alert.deleteOne({ caseId: caseFile._id })
  res.json({ success: true, message: 'Report deleted successfully' })
})
