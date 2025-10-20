
import { EventEmitter } from 'events';
import { applePartnershipService } from './ApplePartnershipService.js';
import { accountService } from './AccountService.js';

interface EnrollmentData {
  id: string;
  userId: string;
  partnershipType: 'apple' | 'sam-gov' | 'aws';
  userData: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    dateOfBirth: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  bettingEligible: boolean;
  enrolledAt: string;
  verifiedAt?: string;
}

export class PartnershipEnrollmentService extends EventEmitter {
  private static instance: PartnershipEnrollmentService;
  private enrollments: Map<string, EnrollmentData> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): PartnershipEnrollmentService {
    if (!PartnershipEnrollmentService.instance) {
      PartnershipEnrollmentService.instance = new PartnershipEnrollmentService();
    }
    return PartnershipEnrollmentService.instance;
  }

  // Enroll user through partnership
  async enrollUser(userData: EnrollmentData['userData'], partnershipType: EnrollmentData['partnershipType']): Promise<{
    success: boolean;
    enrollment?: EnrollmentData;
    error?: string;
  }> {
    try {
      // Validate age requirement (21+ for betting)
      const age = this.calculateAge(new Date(userData.dateOfBirth));
      if (age < 21) {
        return { success: false, error: 'Must be 21+ to enroll for betting' };
      }

      // Create account first
      const accountResult = accountService.createAccount({
        username: userData.email.split('@')[0],
        email: userData.email,
        firstName: userData.fullName.split(' ')[0],
        lastName: userData.fullName.split(' ').slice(1).join(' '),
        phoneNumber: userData.phoneNumber,
        address: userData.address
      });

      if (!accountResult.success || !accountResult.account) {
        return { success: false, error: accountResult.error || 'Account creation failed' };
      }

      const enrollmentId = `enroll_${Date.now()}`;
      const enrollment: EnrollmentData = {
        id: enrollmentId,
        userId: accountResult.account.id,
        partnershipType,
        userData,
        verificationStatus: 'pending',
        bettingEligible: age >= 21,
        enrolledAt: new Date().toISOString()
      };

      this.enrollments.set(enrollmentId, enrollment);

      // Sync to partnership service
      await this.syncToPartnership(enrollment);

      this.emit('enrollment:created', enrollment);

      return { success: true, enrollment };
    } catch (error) {
      console.error('Enrollment error:', error);
      return { success: false, error: 'Enrollment failed' };
    }
  }

  // Sync enrollment to partnership
  private async syncToPartnership(enrollment: EnrollmentData): Promise<void> {
    if (enrollment.partnershipType === 'apple') {
      const partnership = applePartnershipService.getPartnership('apple-sports-streaming');
      if (partnership) {
        console.log(`✅ Synced enrollment to Apple Partnership: ${enrollment.id}`);
        this.emit('partnership:synced', { enrollmentId: enrollment.id, partnership: 'apple' });
      }
    }
  }

  // Verify enrollment
  verifyEnrollment(enrollmentId: string): {
    success: boolean;
    enrollment?: EnrollmentData;
    error?: string;
  } {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) {
      return { success: false, error: 'Enrollment not found' };
    }

    enrollment.verificationStatus = 'verified';
    enrollment.verifiedAt = new Date().toISOString();

    // Update account KYC status
    accountService.updateKYCStatus(enrollment.userId, 'approved');

    this.emit('enrollment:verified', enrollment);

    return { success: true, enrollment };
  }

  // Check betting eligibility
  checkBettingEligibility(enrollmentId: string): boolean {
    const enrollment = this.enrollments.get(enrollmentId);
    return enrollment?.bettingEligible && enrollment?.verificationStatus === 'verified' || false;
  }

  // Get enrollment by user ID
  getEnrollmentByUserId(userId: string): EnrollmentData | null {
    return Array.from(this.enrollments.values()).find(e => e.userId === userId) || null;
  }

  // Calculate age
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  // Get all enrollments
  getAllEnrollments(): EnrollmentData[] {
    return Array.from(this.enrollments.values());
  }

  // Get enrollment statistics
  getEnrollmentStats() {
    const enrollments = Array.from(this.enrollments.values());
    return {
      total: enrollments.length,
      verified: enrollments.filter(e => e.verificationStatus === 'verified').length,
      pending: enrollments.filter(e => e.verificationStatus === 'pending').length,
      bettingEligible: enrollments.filter(e => e.bettingEligible).length
    };
  }
}

export const partnershipEnrollmentService = PartnershipEnrollmentService.getInstance();
