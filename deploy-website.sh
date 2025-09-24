#!/bin/bash

# deploy-website.sh
# Deployment script for Project Connect website

echo "🚀 Starting Project Connect website deployment..."

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Please run this script from the project root directory."
    exit 1
fi

echo "✅ Found project files"

# Build any necessary components (if needed)
echo "🔨 Building project components..."
# Add build commands here if needed
# npm run build
# webpack build
# etc.

# Deploy to GitHub Pages
echo "🌐 Deploying to GitHub Pages..."

# Add all files
git add .

# Commit changes
git commit -m "Deploy website update - $(date)"

# Push to main branch
git push origin main

echo "✅ Deployment complete!"

# Display deployment information
echo ""
echo "📊 Deployment Summary:"
echo "   - Website deployed to: https://didier1111.github.io/connect/"
echo "   - Documentation: https://didier1111.github.io/connect/docs.html"
echo "   - Contribution page: https://didier1111.github.io/connect/contribute.html"
echo "   - Blog: https://didier1111.github.io/connect/blog.html"
echo "   - Contact: https://didier1111.github.io/connect/contact.html"

echo ""
echo "⏰ Deployment usually takes 1-2 minutes to be live."
echo "   Please check https://github.com/Didier1111/connect/settings/pages for deployment status."

echo ""
echo "🎉 Thank you for contributing to Project Connect!"