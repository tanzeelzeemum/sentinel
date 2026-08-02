import mongoose from 'mongoose'
import Case from '../models/Case.js'
import Report from '../models/Report.js'
import AppError from '../utils/AppError.js'
import asyncHandler from '../utils/asyncHandler.js'

const objectId = value => mongoose.Types.ObjectId.isValid(value)
const deny = () => new AppError('You do not have permission to perform this action.', 403)

function validateId(id, label) {
  if (!objectId(id)) throw new AppError(`${label} id is invalid.`, 400)
}

function cleanString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

function cleanDate(value) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) throw new AppError('Incident date must be a valid date.', 400)
  return date
}

function cleanRating(value, label) {
  const rating = Number(value)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new AppError(`${label} must be an integer from 1 to 5.`, 400)
  return rating
}

function canViewCase(user, caseFile) {
  if (user.role === 'admin' || user.role === 'analyst') return true
  return String(caseFile.createdBy || '') === String(user.id) ||
    String(caseFile.assignedOfficer?._id || caseFile.assignedOfficer || '') === String(user.id) ||
    caseFile.createdByUid === user.uid
}

async function getAuthorizedCase(caseId, user) {
  validateId(caseId, 'Case')
  const caseFile = await Case.findById(caseId)
  if (!caseFile || !canViewCase(user, caseFile)) throw new AppError('Related case not found or access is not allowed.', 404)
  return caseFile
}

async function resolveCaseId(caseId, user) {
  if (caseId === undefined) return undefined
  if (caseId === null || caseId === '') return null
  const caseFile = await getAuthorizedCase(caseId, user)
  return caseFile._id
}

async function getAuthorizedReport(reportId, user) {
  validateId(reportId, 'Report')
  const report = await Report.findById(reportId).populate('caseId', 'caseNumber title createdBy assignedOfficer createdByUid createdByEmail').populate('submittedBy', 'name email role status')
  if (!report) throw new AppError('Report not found or access is not allowed.', 404)
  if (!report.caseId) {
    if (user.role === 'admin' || (user.role === 'officer' && String(report.submittedBy?._id || report.submittedBy || '') === String(user.id))) return report
    throw new AppError('Report not found or access is not allowed.', 404)
  }
  if (!canViewCase(user, report.caseId)) throw new AppError('Report not found or access is not allowed.', 404)
  return report
}

function readReportFields(body, mode = 'update') {
  const input = {}
  if ('title' in body || mode === 'create') {
    input.title = cleanString(body.title)
    if (!input.title) throw new AppError('Report title is required.', 400)
  }
  if ('description' in body || mode === 'create') {
    input.description = cleanString(body.description)
    if (!input.description) throw new AppError('Description is required.', 400)
  }
  if ('incidentDate' in body || mode === 'create') input.incidentDate = cleanDate(body.incidentDate)
  if ('location' in body) input.location = cleanString(body.location)
  if ('sourceReliability' in body || mode === 'create') input.sourceReliability = cleanRating(body.sourceReliability, 'Source reliability')
  if ('informationCredibility' in body || mode === 'create') input.informationCredibility = cleanRating(body.informationCredibility, 'Information credibility')
  if ('evidenceDescription' in body) input.evidenceDescription = cleanString(body.evidenceDescription)
  return input
}

function canMutateReport(user, report) {
  if (user.role === 'admin') return true
  return user.role === 'officer' && String(report.submittedBy?._id || report.submittedBy || '') === String(user.id)
}

function reportQueryForUser(user) {
  if (user.role === 'admin' || user.role === 'analyst') return {}
  return { $or: [{ createdBy: user.id }, { assignedOfficer: user.id }, { createdByUid: user.uid }] }
}

function statusFor(caseId, currentStatus) {
  if (!caseId) return 'unassigned'
  if (currentStatus === 'reviewed') return 'reviewed'
  return 'linked'
}

function normalizeReport(report) {
  if (!report) return report
  const item = report.toObject ? report.toObject({ virtuals: true }) : { ...report }
  if (item.caseId && item.status !== 'reviewed') item.status = 'linked'
  else item.status = item.status || 'unassigned'
  return item
}

export const getReports = asyncHandler(async (req, res) => {
  const caseQuery = reportQueryForUser(req.user)
  const cases = await Case.find(caseQuery).select('_id')
  const caseIds = cases.map(item => item._id)
  const query = {}
  const and = []
  if (req.user.role === 'officer') and.push({ $or: [{ submittedBy: req.user.id }, { caseId: { $in: caseIds } }] })
  if (req.user.role === 'analyst') and.push({ caseId: { $in: caseIds } })

  if (req.query.caseId) {
    await getAuthorizedCase(req.query.caseId, req.user)
    and.push({ caseId: req.query.caseId })
  }
  if (req.query.search) {
    const safe = cleanString(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    and.push({ $or: [{ title: new RegExp(safe, 'i') }, { description: new RegExp(safe, 'i') }] })
  }
  if (req.query.reliability) query.sourceReliability = cleanRating(req.query.reliability, 'Reliability filter')
  if (req.query.credibility) query.informationCredibility = cleanRating(req.query.credibility, 'Credibility filter')
  if (and.length) query.$and = and

  const reports = await Report.find(query).populate('caseId', 'caseNumber title').populate('submittedBy', 'name email role').sort({ createdAt: -1 })
  res.json({ success: true, reports: reports.map(normalizeReport) })
})

export const getReportById = asyncHandler(async (req, res) => {
  const report = await getAuthorizedReport(req.params.id, req.user)
  res.json({ success: true, report: normalizeReport(report) })
})

export const createReport = asyncHandler(async (req, res) => {
  if (!['admin', 'officer'].includes(req.user.role)) throw deny()
  const input = readReportFields(req.body || {}, 'create')
  const caseId = await resolveCaseId(req.body?.caseId, req.user)
  const report = await Report.create({
    ...input,
    caseId: caseId || null,
    status: statusFor(caseId),
    submittedBy: req.user.id,
    submittedByUid: req.user.uid,
    submittedByEmail: req.user.email
  })
  const populated = await Report.findById(report._id).populate('caseId', 'caseNumber title').populate('submittedBy', 'name email role')
  res.status(201).json({ success: true, report: normalizeReport(populated) })
})

export const updateReport = asyncHandler(async (req, res) => {
  const report = await getAuthorizedReport(req.params.id, req.user)
  if (!canMutateReport(req.user, report)) throw deny()
  const input = readReportFields(req.body || {}, 'update')
  if ('caseId' in (req.body || {})) {
    input.caseId = await resolveCaseId(req.body.caseId, req.user)
  }
  const nextCaseId = 'caseId' in input ? input.caseId : report.caseId?._id || report.caseId || null
  input.status = statusFor(nextCaseId, report.status)
  Object.assign(report, input)
  await report.save()
  const populated = await Report.findById(report._id).populate('caseId', 'caseNumber title').populate('submittedBy', 'name email role')
  res.json({ success: true, report: normalizeReport(populated) })
})

export const deleteReport = asyncHandler(async (req, res) => {
  const report = await getAuthorizedReport(req.params.id, req.user)
  if (!canMutateReport(req.user, report)) throw deny()
  await Report.deleteOne({ _id: report._id })
  res.json({ success: true, message: 'Report deleted successfully.' })
})
