# GitHub Pages Configuration for Project Connect

This document explains how to configure GitHub Pages for the Project Connect website.

## Prerequisites

1. You must have admin access to the GitHub repository
2. The repository must be public (for free GitHub Pages)

## Setup Steps

### 1. Enable GitHub Pages

1. Go to your repository settings: https://github.com/Didier1111/connect/settings
2. Scroll down to the "Pages" section
3. Under "Source", select "Deploy from a branch"
4. Select "main" branch and "/" root directory
5. Click "Save"
6. Your site will be available at: https://didier1111.github.io/connect

### 2. Custom Domain (Optional)

If you want to use a custom domain:

1. In the Pages section, enter your custom domain
2. Click "Save"
3. Configure your domain's DNS settings to point to GitHub Pages:
   - Add an A record pointing to GitHub's IP addresses:
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153
   - Or add a CNAME record pointing to didier1111.github.io

### 3. HTTPS Enforcement

GitHub Pages automatically provides HTTPS for:
- GitHub subdomains (username.github.io)
- Custom domains with proper DNS configuration

To enforce HTTPS:
1. In the Pages section, check "Enforce HTTPS"
2. This ensures all traffic is served over HTTPS

## Deployment Process

GitHub Pages automatically deploys:
- Any changes to the selected branch
- Within approximately 1 minute of pushing changes

You can monitor deployment status:
1. Go to the Actions tab in your repository
2. View the deployment workflow progress
3. Check the Pages section in Settings for deployment status

## Troubleshooting

### Common Issues

1. **Page not found after setup**
   - Wait 5-10 minutes for initial deployment
   - Check that index.html exists in the root directory
   - Verify the correct branch and directory are selected

2. **Custom domain not working**
   - Verify DNS settings
   - Check that the domain is correctly entered in Pages settings
   - Wait up to 24 hours for DNS propagation

3. **HTTPS certificate issues**
   - Wait up to 24 hours for certificate provisioning
   - Ensure DNS is properly configured
   - Check for CNAME file conflicts

### Monitoring Deployment

You can check deployment status at:
- Repository → Settings → Pages
- Repository → Actions tab
- Repository → Deployments tab

## Best Practices

### File Structure
- Keep all website files in the root directory
- Use relative paths for links and assets
- Include a 404.html page for better user experience

### Performance Optimization
- Minimize CSS and JavaScript files
- Optimize images for web
- Use CDN-friendly file structure
- Enable compression where possible

### SEO Considerations
- Include robots.txt and sitemap.xml
- Use proper meta tags in HTML
- Ensure fast loading times
- Create descriptive page titles and descriptions

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Custom Domain Setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [Troubleshooting](https://docs.github.com/en/pages/troubleshooting-custom-domains-and-github-pages)

Once GitHub Pages is enabled, your website will be available at:
**https://didier1111.github.io/connect/**

The website will automatically update whenever you push changes to the main branch.