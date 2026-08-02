import { Router } from 'express'
import { getProfile, updateProfile } from '../controllers/profileController.js'
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'
const router = Router()
router.get('/', verifyFirebaseToken, getProfile)
router.put('/', verifyFirebaseToken, updateProfile)
export default router
