#!/bin/bash

# GitHub Repository Setup for admin-web-parallel
# Run this script to create the repository and push code

set -e

echo "🚀 Washio Admin Parallel — GitHub Setup"
echo "======================================="
echo ""
echo "This script will:"
echo "1. Create a new GitHub repository"
echo "2. Push code to GitHub"
echo "3. Enable Vercel deployment"
echo ""
echo "Prerequisites:"
echo "✓ You must be logged in to GitHub (already done)"
echo "✓ Git configured with your GitHub account"
echo ""

# Step 1: Create Repository via Web
echo "Step 1: Creating GitHub Repository..."
echo ""
echo "⚠️  Manual step required:"
echo "   1. Open: https://github.com/new"
echo "   2. Repository name: admin-web-parallel"
echo "   3. Description: Parallel development of Washio admin dashboard - real-time synced with WebMedia original"
echo "   4. Public: YES (checkbox)"
echo "   5. Initialize repository: NO (leave unchecked)"
echo "   6. Click 'Create repository'"
echo ""
read -p "Press ENTER once you've created the repository..."

# Step 2: Push to GitHub
echo ""
echo "Step 2: Pushing code to GitHub..."
cd ~/projects/admin-web-parallel

# Remove any existing remote
git remote remove origin 2>/dev/null || true

# Add GitHub remote
git remote add origin https://github.com/Niko1504/admin-web-parallel.git

# Ensure we're on main branch
git branch -M main

# Push to GitHub
echo "Pushing code... (may prompt for GitHub password or token)"
git push -u origin main

echo ""
echo "✅ Repository created and code pushed!"
echo "   Repository URL: https://github.com/Niko1504/admin-web-parallel"
echo ""

# Step 3: Setup Vercel (optional, can be done via web)
echo "Step 3: Setting up Vercel deployment (optional)..."
echo ""
echo "Option A: Via Vercel CLI (fastest)"
echo "  npm install -g vercel"
echo "  cd ~/projects/admin-web-parallel"
echo "  vercel deploy --prod --name washio-admin-parallel"
echo "  When prompted, set: VITE_API_URL=https://api.washio.com"
echo ""
echo "Option B: Via Vercel Dashboard"
echo "  1. Go to https://vercel.com/new"
echo "  2. Select GitHub repository: admin-web-parallel"
echo "  3. Add environment variable: VITE_API_URL=https://api.washio.com"
echo "  4. Click Deploy"
echo ""

echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Deploy to Vercel (see instructions above)"
echo "2. Test both admin dashboards:"
echo "   - https://washio-admin.vercel.app (WebMedia)"
echo "   - https://washio-admin-parallel.vercel.app (JARVIS - after Vercel deploy)"
echo "3. Create a test order in mobile app"
echo "4. Verify both admins see the order"
echo ""
echo "Good luck! 🚀"
