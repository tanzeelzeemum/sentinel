import { firebaseAdminReady, getAuth } from '../config/firebase.js'
import AppError from '../utils/AppError.js'
import User from '../models/User.js'

export async function verifyFirebaseToken(req, res, next) {
  if (!firebaseAdminReady) return next(new AppError('Firebase Admin credentials are not configured.', 503))

  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null
  if (!token) return next(new AppError('Authorization token is required.', 401))

  try {
    const decodedToken = await getAuth().verifyIdToken(token)
    const email = (decodedToken.email || '').trim().toLowerCase()
    const bootstrapAdmins = (process.env.BOOTSTRAP_ADMIN_EMAILS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean)
    const user = await User.findOneAndUpdate(
      { firebaseUid: decodedToken.uid },
      { $setOnInsert: { firebaseUid: decodedToken.uid, email, role: bootstrapAdmins.includes(email) ? 'admin' : 'officer', status: 'active' } },
      { returnDocument: 'after', upsert: true, runValidators: true }
    )
    if (user.status !== 'active') return next(new AppError('Your account is inactive.', 403))
    req.user = { id: user._id, uid: user.firebaseUid, email: user.email, role: user.role, status: user.status }
    next()
  } catch {
    next(new AppError('Invalid or expired authorization token.', 401))
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return next(new AppError('You do not have permission to perform this action.', 403))
  next()
}
