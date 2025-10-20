
import express, { Request, Response } from 'express';
import { partnershipEnrollmentService } from '../services/PartnershipEnrollmentService.js';

const router = express.Router();

// Enroll new user
router.post('/enroll', async (req: Request, res: Response) => {
  const { fullName, email, phoneNumber, dateOfBirth, address, partnershipType } = req.body;

  if (!fullName || !email || !dateOfBirth || !address) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  const result = await partnershipEnrollmentService.enrollUser({
    fullName,
    email,
    phoneNumber,
    dateOfBirth,
    address
  }, partnershipType || 'apple');

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({
    success: true,
    message: 'Enrollment submitted successfully',
    enrollment: result.enrollment
  });
});

// Verify enrollment
router.post('/verify/:enrollmentId', (req: Request, res: Response) => {
  const { enrollmentId } = req.params;
  const result = partnershipEnrollmentService.verifyEnrollment(enrollmentId);

  if (!result.success) {
    return res.status(404).json(result);
  }

  res.json({
    success: true,
    message: 'Enrollment verified',
    enrollment: result.enrollment
  });
});

// Check betting eligibility
router.get('/eligibility/:enrollmentId', (req: Request, res: Response) => {
  const { enrollmentId } = req.params;
  const eligible = partnershipEnrollmentService.checkBettingEligibility(enrollmentId);

  res.json({
    success: true,
    enrollmentId,
    bettingEligible: eligible
  });
});

// Get enrollment by user ID
router.get('/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const enrollment = partnershipEnrollmentService.getEnrollmentByUserId(userId);

  if (!enrollment) {
    return res.status(404).json({
      success: false,
      error: 'Enrollment not found'
    });
  }

  res.json({
    success: true,
    enrollment
  });
});

// Get enrollment statistics
router.get('/stats', (req: Request, res: Response) => {
  const stats = partnershipEnrollmentService.getEnrollmentStats();

  res.json({
    success: true,
    stats
  });
});

export default router;
