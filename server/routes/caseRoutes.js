import { Router } from 'express'
import { addCaseNote, assignOfficer, createCase, deleteCase, getCaseById, getCaseOfficers, getCases, updateCase, updateCaseStatus, updateThreatAssessment } from '../controllers/caseController.js'
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/', verifyFirebaseToken, getCases)
router.post('/', verifyFirebaseToken, createCase)
router.get('/meta/officers', verifyFirebaseToken, getCaseOfficers)
router.get('/:id', verifyFirebaseToken, getCaseById)
router.put('/:id', verifyFirebaseToken, updateCase)
router.delete('/:id', verifyFirebaseToken, deleteCase)
router.put('/:id/status', verifyFirebaseToken, updateCaseStatus)
router.put('/:id/assign', verifyFirebaseToken, assignOfficer)
router.post('/:id/notes', verifyFirebaseToken, addCaseNote)
router.put('/:id/threat-assessment', verifyFirebaseToken, updateThreatAssessment)

export default router
