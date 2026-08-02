import Profile from '../models/Profile.js'
import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'

const fields = body => ({ fullName: body.fullName || '', role: body.role || '', department: body.department || '', organization: body.organization || '' })

export const getProfile = asyncHandler(async (req, res) => {
  const legacy = await Profile.findOne({ uid: req.user.uid })
  const user = await User.findOneAndUpdate({ firebaseUid: req.user.uid }, { $setOnInsert: { firebaseUid: req.user.uid, email: req.user.email || '', name: legacy?.fullName || '', department: legacy?.department || '', organization: legacy?.organization || '', role: legacy?.role || 'officer', status: 'active' } }, { returnDocument: 'after', upsert: true, runValidators: true })
  res.json({ success: true, profile: { fullName: user.name, email: user.email, role: user.role, department: user.department, organization: user.organization, status: user.status } })
})

export const updateProfile = asyncHandler(async (req, res) => {
  const input = fields(req.body)
  const user = await User.findOneAndUpdate({ firebaseUid: req.user.uid }, { name: input.fullName, department: input.department, organization: input.organization, email: req.user.email || '' }, { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true })
  await Profile.findOneAndUpdate({ uid: req.user.uid }, { ...input, email: req.user.email || '' }, { returnDocument: 'after', upsert: true, runValidators: true })
  res.json({ success: true, profile: { fullName: user.name, email: user.email, role: user.role, department: user.department, organization: user.organization, status: user.status } })
})
