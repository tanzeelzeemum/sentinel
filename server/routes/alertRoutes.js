import { Router } from 'express'
import { getAlerts, updateAlertStatus } from '../controllers/alertController.js'
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'
const router = Router()
router.get('/', verifyFirebaseToken, getAlerts)
router.put('/:id/status', verifyFirebaseToken, updateAlertStatus)
export default router
