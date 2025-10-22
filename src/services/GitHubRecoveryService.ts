
import fs from 'fs';
import path from 'path';

interface RecoveryCode {
  code: string;
  used: boolean;
  usedAt?: string;
}

class GitHubRecoveryService {
  private codes: RecoveryCode[] = [];
  private readonly codesFile = '.github-recovery-codes.json';

  constructor() {
    this.loadCodes();
  }

  private loadCodes() {
    try {
      if (fs.existsSync(this.codesFile)) {
        const data = fs.readFileSync(this.codesFile, 'utf-8');
        this.codes = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading recovery codes:', error);
    }
  }

  importCodes(codesList: string[]) {
    this.codes = codesList.map(code => ({
      code: code.trim(),
      used: false
    }));
    this.saveCodes();
  }

  private saveCodes() {
    try {
      fs.writeFileSync(
        this.codesFile,
        JSON.stringify(this.codes, null, 2),
        { mode: 0o600 } // Read/write only for owner
      );
      console.log('✅ Recovery codes saved securely');
    } catch (error) {
      console.error('Error saving recovery codes:', error);
    }
  }

  getAvailableCodes(): string[] {
    return this.codes
      .filter(c => !c.used)
      .map(c => c.code);
  }

  markCodeAsUsed(code: string) {
    const codeObj = this.codes.find(c => c.code === code);
    if (codeObj) {
      codeObj.used = true;
      codeObj.usedAt = new Date().toISOString();
      this.saveCodes();
      console.log(`✅ Recovery code ${code} marked as used`);
    }
  }

  getCodeStatus() {
    const total = this.codes.length;
    const used = this.codes.filter(c => c.used).length;
    const available = total - used;

    return {
      total,
      used,
      available,
      codes: this.codes.map(c => ({
        code: c.code.substring(0, 5) + '-xxxxx', // Masked for security
        used: c.used,
        usedAt: c.usedAt
      }))
    };
  }

  needsRefresh(): boolean {
    const available = this.codes.filter(c => !c.used).length;
    return available < 3; // Alert when less than 3 codes remain
  }
}

export const githubRecoveryService = new GitHubRecoveryService();
