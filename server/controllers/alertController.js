import Alert from '../models/Alert.js'
import AppError from '../utils/AppError.js'
import asyncHandler from '../utils/asyncHandler.js'

export const getAlerts = asyncHandler(async (req, res) => {
  const scope = req.user.role === 'admin' || req.user.role === 'analyst' ? {} : { createdByUid: req.user.uid }
  const alerts = await Alert.find(scope).sort({ createdAt: -1 })
  res.json({ success: true, alerts })
})

export const updateAlertStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!['Acknowledged', 'Resolved'].includes(status)) throw new AppError('Status must be Acknowledged or Resolved.', 400)
  const scope = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, createdByUid: req.user.uid }
  const alert = await Alert.findOneAndUpdate(scope, { status }, { returnDocument: 'after', runValidators: true })
  if (!alert) throw new AppError('Alert not found or access is not allowed.', 404)
  res.json({ success: true, alert })
})
