import Alert from '../models/Alert.js'
import AppError from '../utils/AppError.js'
import asyncHandler from '../utils/asyncHandler.js'

export const getAlerts = asyncHandler(async (req, res) => {
  const alerts = await Alert.find({ createdByUid: req.user.uid }).sort({ createdAt: -1 })
  res.json({ success: true, alerts })
})

export const updateAlertStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!['Acknowledged', 'Resolved'].includes(status)) throw new AppError('Status must be Acknowledged or Resolved.', 400)
  const alert = await Alert.findOneAndUpdate({ _id: req.params.id, createdByUid: req.user.uid }, { status }, { new: true, runValidators: true })
  if (!alert) throw new AppError('Alert not found or access is not allowed.', 404)
  res.json({ success: true, alert })
})
