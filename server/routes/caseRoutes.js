import { Router } from 'express'
import { createCase, deleteCase, getCaseById, getCases, updateCase } from '../controllers/caseController.js'
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/', verifyFirebaseToken, getCases)
router.post('/', verifyFirebaseToken, createCase)
router.get('/:id', verifyFirebaseToken, getCaseById)
router.put('/:id', verifyFirebaseToken, updateCase)
router.delete('/:id', verifyFirebaseToken, deleteCase)

export default router
