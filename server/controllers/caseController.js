import mongoose from 'mongoose'
import Alert from '../models/Alert.js'
import Case from '../models/Case.js'
import User from '../models/User.js'
import AppError from '../utils/AppError.js'
import asyncHandler from '../utils/asyncHandler.js'

const canonicalThreat = { Low: 'low', Medium: 'moderate', High: 'high', Critical: 'critical', low: 'low', moderate: 'moderate', high: 'high', critical: 'critical' }
const canonicalStatus = { Open: 'open', Active: 'open', Review: 'under-review', Closed: 'closed', open: 'open', 'under-review': 'under-review', resolved: 'resolved', closed: 'closed' }
const threatValues = ['low', 'moderate', 'high', 'critical']
const statusValues = ['open', 'under-review', 'resolved', 'closed']
const objectId = value => mongoose.Types.ObjectId.isValid(value)
const deny = () => new AppError('You do not have permission to perform this action.', 403)

function normalizeThreat(value) {
  return canonicalThreat[value] || value
}

function normalizeStatus(value) {
  return canonicalStatus[value] || value
}

function cleanString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

function cleanTags(value) {
  if (Array.isArray(value)) return value.map(item => cleanString(item)).filter(Boolean).slice(0, 20)
  if (typeof value === 'string') return value.split(',').map(item => item.trim()).filter(Boolean).slice(0, 20)
  return []
}

function cleanDate(value, field) {
  if (value === '' || value === null || value === undefined) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new AppError(`${field} must be a valid date.`, 400)
  return date
}

function validateId(id, label = 'Case') {
  if (!objectId(id)) throw new AppError(`${label} id is invalid.`, 400)
}

function normalizeCase(caseFile) {
  if (!caseFile) return caseFile
  const item = caseFile.toObject ? caseFile.toObject({ virtuals: true }) : { ...caseFile }
  item.threatLevel = normalizeThreat(item.threatLevel)
  item.status = normalizeStatus(item.status)
  return item
}

export function calculateThreatAssessment(values) {
  const score = values.probability * values.impact
  const calculatedLevel = score <= 5 ? 'low' : score <= 10 ? 'moderate' : score <= 15 ? 'high' : 'critical'
  return { score, calculatedLevel }
}

function canView(user, caseFile) {
  if (user.role === 'admin' || user.role === 'analyst') return true
  return String(caseFile.createdBy || '') === String(user.id) ||
    String(caseFile.assignedOfficer?._id || caseFile.assignedOfficer || '') === String(user.id) ||
    caseFile.createdByUid === user.uid
}

function canOfficerModify(user, caseFile) {
  if (user.role === 'admin') return true
  if (user.role !== 'officer') return false
  return canView(user, caseFile)
}

function baseQueryFor(user) {
  if (user.role === 'admin' || user.role === 'analyst') return {}
  return { $or: [{ createdBy: user.id }, { assignedOfficer: user.id }, { createdByUid: user.uid }] }
}

function readFields(body, mode = 'update') {
  const next = {}
  if ('title' in body || mode === 'create') {
    next.title = cleanString(body.title)
    if (!next.title) throw new AppError('Case title is required.', 400)
  }
  if ('caseNumber' in body || mode === 'create') {
    next.caseNumber = cleanString(body.caseNumber)
    if (!next.caseNumber) throw new AppError('Case number is required.', 400)
  }
  if ('description' in body || mode === 'create') {
    next.description = cleanString(body.description)
    if (!next.description) throw new AppError('Description is required.', 400)
  }
  if ('category' in body) next.category = cleanString(body.category, 'General') || 'General'
  if ('location' in body) next.location = cleanString(body.location)
  if ('threatLevel' in body || mode === 'create') {
    next.threatLevel = normalizeThreat(body.threatLevel || 'low')
    if (!threatValues.includes(next.threatLevel)) throw new AppError('Threat level is invalid.', 400)
  }
  if ('status' in body || mode === 'create') {
    next.status = normalizeStatus(body.status || 'open')
    if (!statusValues.includes(next.status)) throw new AppError('Status is invalid.', 400)
    next.closedAt = next.status === 'closed' ? new Date() : null
  }
  if ('tags' in body) next.tags = cleanTags(body.tags)
  if ('openedAt' in body) next.openedAt = cleanDate(body.openedAt, 'Opened date')
  if ('dueDate' in body) next.dueDate = cleanDate(body.dueDate, 'Due date')
  return next
}

async function syncAlert(caseFile) {
  const threatLevel = normalizeThreat(caseFile.threatLevel)
  const isPriority = ['high', 'critical'].includes(threatLevel)
  if (!isPriority) {
    await Alert.findOneAndUpdate({ caseId: caseFile._id }, { status: 'Resolved', caseNumber: caseFile.caseNumber, title: caseFile.title, createdByUid: caseFile.createdByUid, createdByEmail: caseFile.createdByEmail }, { returnDocument: 'after', runValidators: true })
    return null
  }
  return Alert.findOneAndUpdate(
    { caseId: caseFile._id },
    {
      caseNumber: caseFile.caseNumber,
      title: caseFile.title,
      threatLevel,
      createdByUid: caseFile.createdByUid,
      createdByEmail: caseFile.createdByEmail,
      $setOnInsert: { status: 'New' }
    },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, runValidators: true }
  )
}

async function validateAssignedOfficer(assignedOfficer, required = false) {
  if (!assignedOfficer) {
    if (required) throw new AppError('Assigned officer is required.', 400)
    return null
  }
  validateId(assignedOfficer, 'Assigned officer')
  const officer = await User.findById(assignedOfficer)
  if (!officer) throw new AppError('Assigned officer was not found.', 404)
  if (officer.role !== 'officer' || officer.status !== 'active') throw new AppError('Assigned user must be an active officer.', 400)
  return officer._id
}

async function getVisibleCase(id, user) {
  validateId(id)
  const caseFile = await Case.findById(id).populate('assignedOfficer', 'name email role status').populate('createdBy', 'name email role status').populate('notes.author', 'name email role status').populate('threatAssessment.assessedBy', 'name email role status')
  if (!caseFile || !canView(user, caseFile)) throw new AppError('Case not found or access is not allowed.', 404)
  return caseFile
}

export const getCaseOfficers = asyncHandler(async (req, res) => {
  const officers = await User.find({ role: 'officer', status: 'active' }).select('name email role status').sort({ email: 1 })
  res.json({ success: true, officers })
})

export const getCases = asyncHandler(async (req, res) => {
  const query = { ...baseQueryFor(req.user) }
  const and = []
  if (req.query.search) {
    const safe = cleanString(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    and.push({ $or: [{ title: new RegExp(safe, 'i') }, { caseNumber: new RegExp(safe, 'i') }] })
  }
  if (req.query.category) and.push({ category: cleanString(req.query.category) })
  if (req.query.threatLevel) {
    const threatLevel = normalizeThreat(req.query.threatLevel)
    if (!threatValues.includes(threatLevel)) throw new AppError('Threat level filter is invalid.', 400)
    and.push({ threatLevel: { $in: [threatLevel, ...Object.keys(canonicalThreat).filter(key => canonicalThreat[key] === threatLevel)] } })
  }
  if (req.query.status) {
    const status = normalizeStatus(req.query.status)
    if (!statusValues.includes(status)) throw new AppError('Status filter is invalid.', 400)
    and.push({ status: { $in: [status, ...Object.keys(canonicalStatus).filter(key => canonicalStatus[key] === status)] } })
  }
  if (req.query.assignedOfficer) {
    validateId(req.query.assignedOfficer, 'Assigned officer')
    and.push({ assignedOfficer: req.query.assignedOfficer })
  }
  if (and.length) query.$and = and
  const cases = await Case.find(query).populate('assignedOfficer', 'name email role status').populate('createdBy', 'name email role status').sort({ createdAt: -1 })
  res.json({ success: true, cases: cases.map(normalizeCase), policy: req.user.role === 'analyst' ? 'Analysts can read cases for analytical review and may only add notes or threat assessments.' : undefined })
})

export const getCaseById = asyncHandler(async (req, res) => {
  const caseFile = await getVisibleCase(req.params.id, req.user)
  const alert = await Alert.findOne({ caseId: caseFile._id })
  res.json({ success: true, case: normalizeCase(caseFile), alert })
})

export const createCase = asyncHandler(async (req, res) => {
  if (!['admin', 'officer'].includes(req.user.role)) throw deny()
  const input = readFields(req.body || {}, 'create')
  if (req.user.role === 'admin' && req.body?.assignedOfficer) input.assignedOfficer = await validateAssignedOfficer(req.body.assignedOfficer)
  const caseFile = await Case.create({
    ...input,
    openedAt: input.openedAt || new Date(),
    createdBy: req.user.id,
    createdByUid: req.user.uid,
    createdByEmail: req.user.email
  })
  await syncAlert(caseFile)
  res.status(201).json({ success: true, case: normalizeCase(caseFile) })
})

export const updateCase = asyncHandler(async (req, res) => {
  validateId(req.params.id)
  const current = await Case.findById(req.params.id)
  if (!current) throw new AppError('Case not found or access is not allowed.', 404)
  if (!canOfficerModify(req.user, current)) throw deny()
  const input = readFields(req.body || {}, 'update')
  if (req.user.role === 'admin' && 'assignedOfficer' in (req.body || {})) input.assignedOfficer = req.body.assignedOfficer ? await validateAssignedOfficer(req.body.assignedOfficer) : null
  Object.assign(current, input)
  const caseFile = await current.save()
  await syncAlert(caseFile)
  res.json({ success: true, case: normalizeCase(caseFile) })
})

export const deleteCase = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw deny()
  validateId(req.params.id)
  const caseFile = await Case.findByIdAndDelete(req.params.id)
  if (!caseFile) throw new AppError('Case not found.', 404)
  await Alert.findOneAndUpdate({ caseId: caseFile._id }, { status: 'Resolved' }, { returnDocument: 'after', runValidators: true })
  res.json({ success: true, message: 'Case deleted successfully.' })
})

export const updateCaseStatus = asyncHandler(async (req, res) => {
  const status = normalizeStatus(req.body?.status)
  if (!statusValues.includes(status)) throw new AppError('Status is invalid.', 400)
  const current = await getVisibleCase(req.params.id, req.user)
  if (req.user.role === 'analyst') throw deny()
  if (!canOfficerModify(req.user, current)) throw deny()
  current.status = status
  current.closedAt = status === 'closed' ? new Date() : null
  const caseFile = await current.save()
  res.json({ success: true, case: normalizeCase(caseFile) })
})

export const assignOfficer = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw deny()
  validateId(req.params.id)
  const officerId = await validateAssignedOfficer(req.body?.assignedOfficer, true)
  const caseFile = await Case.findByIdAndUpdate(req.params.id, { assignedOfficer: officerId }, { returnDocument: 'after', runValidators: true }).populate('assignedOfficer', 'name email role status').populate('createdBy', 'name email role status')
  if (!caseFile) throw new AppError('Case not found.', 404)
  res.json({ success: true, case: normalizeCase(caseFile) })
})

export const addCaseNote = asyncHandler(async (req, res) => {
  const current = await getVisibleCase(req.params.id, req.user)
  if (req.user.role === 'officer' && !canOfficerModify(req.user, current)) throw deny()
  const text = cleanString(req.body?.text)
  if (!text) throw new AppError('Note text is required.', 400)
  current.notes.push({ text, author: req.user.id, authorName: req.user.email, authorEmail: req.user.email, createdAt: new Date() })
  const caseFile = await current.save()
  res.status(201).json({ success: true, case: normalizeCase(caseFile) })
})

export const updateThreatAssessment = asyncHandler(async (req, res) => {
  const current = await getVisibleCase(req.params.id, req.user)
  if (req.user.role === 'officer' && !canOfficerModify(req.user, current)) throw deny()
  const fields = ['probability', 'impact', 'sourceReliability', 'urgency']
  const values = Object.fromEntries(fields.map(field => [field, Number(req.body?.[field])]))
  if (fields.some(field => !Number.isInteger(values[field]) || values[field] < 1 || values[field] > 5)) throw new AppError('Threat assessment values must be integers from 1 to 5.', 400)
  const { score, calculatedLevel } = calculateThreatAssessment(values)
  current.threatAssessment = { ...values, score, calculatedLevel, assessedBy: req.user.id, assessorName: req.user.email, assessedAt: new Date() }
  current.threatLevel = calculatedLevel
  const caseFile = await current.save()
  await syncAlert(caseFile)
  res.json({ success: true, case: normalizeCase(caseFile), threatAssessment: caseFile.threatAssessment })
})
