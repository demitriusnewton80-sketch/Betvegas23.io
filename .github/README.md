
# Young Meeat LLC - GitHub Repository

**FCC Entity:** 20130314143016  
**FCC Registration:** 0024454324  
**Contact:** gbemeeat@gmail.com

## Repository Structure

This repository contains the complete codebase for Young Meaat LLC's sports betting platform with integrated streaming services, PlayStation Network support, and FCC-compliant operations.

## Automated Workflows

### Build and Deploy
- Triggers on push to `main` branch
- Runs TypeScript compilation checks
- Performs security audits
- Automatically deploys to Replit

### Code Quality
- Runs on all pull requests
- Checks TypeScript types
- Scans for vulnerabilities
- Lists outdated packages

## Making Commits

### Quick Commit (Bash Script)
```bash
./scripts/git-commit.sh
```

### Manual Commit
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## Integration with Replit

When you push commits to GitHub:
1. GitHub Actions runs build checks
2. Replit detects the new commit
3. Replit automatically rebuilds the application
4. Changes go live at your deployment URL

## Branch Protection

Recommended branch protection rules for `main`:
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date

## Environment Variables

Set these in Replit Secrets (not in GitHub):
- `AUTHORIZED_EMAILS`
- `PORT`
- `API_KEYS` (if applicable)

## Support

For issues or questions, contact: gbemeeat@gmail.com
