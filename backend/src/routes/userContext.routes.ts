import { Router } from "express";
// import { authenticate } from "../middleware/auth"; // Deprecated – replaced by semantic context framework
// import { UserContextController } from "../controllers/userContext.controller"; // Deprecated – replaced by semantic context framework
// import { AuthenticatedRequest } from "../types/express"; // Deprecated – replaced by semantic context framework

const router = Router();
// const userContextController = new UserContextController(); // Deprecated – replaced by semantic context framework

// GET /user-context/me - Get current user's context
// Deprecated – replaced by semantic context framework
// router.get('/me', authenticate, (req, res) => {
//   console.log(`🔐 GET USER CONTEXT - Authenticated request received`);
//   userContextController.getMyContext.call(userContextController, req as AuthenticatedRequest, res);
// });

// PUT /user-context/me - Update current user's context
// Deprecated – replaced by semantic context framework
// router.put('/me', authenticate, (req, res) => {
//   console.log(`🔐 UPDATE USER CONTEXT - Authenticated request received`);
//   userContextController.updateMyContext.call(userContextController, req as AuthenticatedRequest, res);
// });

// PUT /user-context/last-closed-period - Update last closed period
// Deprecated – replaced by semantic context framework
// router.put('/last-closed-period', authenticate, (req, res) => {
//   console.log(`🔐 UPDATE LAST CLOSED PERIOD - Authenticated request received`);
//   userContextController.updateLastClosedPeriod.call(userContextController, req as AuthenticatedRequest, res);
// });

// POST /user-context/increment-preview-skipped - Increment preview skipped count
// Deprecated – replaced by semantic context framework
// router.put('/increment-preview-skipped', authenticate, (req, res) => {
//   console.log(`🔐 INCREMENT PREVIEW SKIPPED - Authenticated request received`);
//   userContextController.incrementPreviewSkippedCount.call(userContextController, req as AuthenticatedRequest, res);
// });

// POST /user-context/suggestion-override - Add suggestion override
// Deprecated – replaced by semantic context framework
// router.post('/suggestion-override', authenticate, (req, res) => {
//   console.log(`🔐 ADD SUGGESTION OVERRIDE - Authenticated request received`);
//   userContextController.addSuggestionOverride.call(userContextController, req as AuthenticatedRequest, res);
// });

export default router; 