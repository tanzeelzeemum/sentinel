import { Router } from 'express'
import { createReport, deleteReport, getReportById, getReports, updateReport } from '../controllers/reportController.js'
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/', verifyFirebaseToken, getReports)
router.post('/', verifyFirebaseToken, createReport)
router.get('/:id', verifyFirebaseToken, getReportById)
router.put('/:id', verifyFirebaseToken, updateReport)
router.delete('/:id', verifyFirebaseToken, deleteReport)

export default router
