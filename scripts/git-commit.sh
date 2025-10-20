
#!/bin/bash

# Young Meeat LLC - Git Commit Helper
# FCC Entity: 20130314143016

echo "==================================="
echo "Young Meeat LLC - Git Commit Tool"
echo "FCC Entity: 20130314143016"
echo "==================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "Git repository not initialized. Initializing..."
    git init
    git branch -M main
fi

# Show current status
echo "Current changes:"
git status --short

echo ""
echo "Enter commit message (or 'q' to quit):"
read -r commit_message

if [ "$commit_message" = "q" ]; then
    echo "Commit cancelled."
    exit 0
fi

# Stage all changes
echo ""
echo "Staging all changes..."
git add .

# Create commit
echo "Creating commit..."
git commit -m "$commit_message"

# Push to remote (if configured)
if git remote get-url origin &> /dev/null; then
    echo ""
    echo "Push to GitHub? (y/n)"
    read -r push_confirm
    
    if [ "$push_confirm" = "y" ]; then
        echo "Pushing to GitHub..."
        git push origin main
        echo "Successfully pushed to GitHub!"
        echo "Replit will automatically detect and rebuild."
    fi
else
    echo ""
    echo "No remote repository configured."
    echo "To add GitHub remote, run:"
    echo "git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
fi

echo ""
echo "==================================="
echo "Commit complete!"
echo "==================================="
