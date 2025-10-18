
import express, { Request, Response } from 'express';

const router = express.Router();

// Direct contact endpoint
router.post('/direct', (req: Request, res: Response) => {
  const { name, email, phone, message, preferredContact } = req.body;
  
  const contactRequest = {
    id: `contact-${Date.now()}`,
    name,
    email,
    phone,
    message,
    preferredContact: preferredContact || 'email',
    receivedAt: new Date().toISOString(),
    status: 'pending',
    assignedTo: '20130314143016',
    contactEmail: 'gbemeeat@gmail.com'
  };
  
  res.json({
    success: true,
    message: 'Contact request received',
    request: contactRequest,
    responseTime: '24-48 hours'
  });
});

// Lunch meeting scheduler
router.post('/lunch', (req: Request, res: Response) => {
  const { name, email, date, time, location, purpose } = req.body;
  
  if (!name || !email || !date) {
    return res.status(400).json({ 
      error: 'Name, email, and date are required' 
    });
  }
  
  const lunchMeeting = {
    id: `lunch-${Date.now()}`,
    name,
    email,
    scheduledDate: date,
    scheduledTime: time || '12:00 PM',
    location: location || 'To be determined',
    purpose: purpose || 'Business discussion',
    createdAt: new Date().toISOString(),
    status: 'pending_confirmation',
    host: '20130314143016',
    hostEmail: 'gbemeeat@gmail.com'
  };
  
  res.json({
    success: true,
    message: 'Lunch meeting request submitted',
    meeting: lunchMeeting,
    note: 'You will receive a confirmation email within 24 hours'
  });
});

// Get contact info
router.get('/info', (req: Request, res: Response) => {
  res.json({
    entity: '20130314143016',
    email: 'gbemeeat@gmail.com',
    fccRegistration: '0024454324',
    registrationDate: '03/25/2015',
    availableForLunch: true,
    preferredLunchTimes: ['12:00 PM - 1:00 PM', '1:00 PM - 2:00 PM'],
    contactMethods: ['email', 'phone', 'in-person meeting']
  });
});

// Get all lunch requests (admin)
router.get('/lunch/requests', (req: Request, res: Response) => {
  res.json({
    message: 'Lunch meeting requests',
    note: 'This would retrieve all lunch requests from database',
    contact: 'gbemeeat@gmail.com'
  });
});

export default router;
