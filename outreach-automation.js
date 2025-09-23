# Outreach Automation Script

This script automates the process of sending personalized outreach messages to potential candidates.

## Setup

1. Install required dependencies:
   ```bash
   npm install nodemailer
   ```

2. Update the `.env` file with email credentials:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

3. Prepare candidate lists in JSON format (from previous scans)

4. Run the outreach script:
   ```bash
   node outreach-automation.js
   ```

```javascript
// outreach-automation.js
require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');

// Email configuration
const transporter = nodemailer.createTransporter({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Function to send email
async function sendEmail(to, subject, html) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    html: html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Function to generate personalized GitHub outreach email
function generateGitHubOutreachEmail(candidate) {
  return `
    <html>
      <body>
        <h2>Hello ${candidate.name || candidate.username}!</h2>
        
        <p>I noticed your recent work on <strong>${candidate.top_repo}</strong> and was impressed by your contributions to the open-source community. I'm reaching out because I think you might be interested in Project Connect, an initiative to build viral, monetized open-source teams with equitable remuneration.</p>
        
        <p>We're looking for collaborators with your skills and experience to help us develop frameworks for sustainable open-source communities. Your expertise in <strong>${candidate.top_repo_language}</strong> and community-focused approach would be particularly valuable.</p>
        
        <p>Project Connect is creating a new model for open-source collaboration that:
          <ul>
            <li>Goes viral through exceptional community building</li>
            <li>Generates sustainable revenue through multiple streams</li>
            <li>Equitably rewards all contributors based on their impact</li>
            <li>Fosters inclusive, diverse, and thriving communities</li>
          </ul>
        </p>
        
        <p>We're particularly interested in collaborators who can help with:
          <ul>
            <li><strong>Community Builders</strong> - Help us design viral growth strategies</li>
            <li><strong>Product Developers</strong> - Contribute to our frameworks and tools</li>
            <li><strong>Business Strategists</strong> - Help refine our monetization approaches</li>
            <li><strong>Governance Experts</strong> - Improve our equitable remuneration models</li>
          </ul>
        </p>
        
        <p>Would you be interested in learning more? I'd be happy to schedule a brief call to discuss how you might contribute.</p>
        
        <p>You can learn more about Project Connect at:</p>
        <ul>
          <li>GitHub: <a href="https://github.com/Didier1111/connect">https://github.com/Didier1111/connect</a></li>
          <li>Website: <a href="https://didier1111.github.io/connect">https://didier1111.github.io/connect</a></li>
        </ul>
        
        <p>Best regards,<br>
        Project Connect Team</p>
        
        <hr>
        <p><small>This email is part of our automated recruitment process. If you're not interested in receiving further communications, please reply with "unsubscribe" and we'll remove you from our list.</small></p>
      </body>
    </html>
  `;
}

// Function to generate personalized Twitter outreach email
function generateTwitterOutreachEmail(candidate) {
  return `
    <html>
      <body>
        <h2>Hello ${candidate.name || '@' + candidate.username}!</h2>
        
        <p>I noticed your recent tweet about "<em>${candidate.tweet_text.substring(0, 100)}...</em>" and was impressed by your interest in open-source communities. I'm part of Project Connect, an initiative to build viral, monetized open-source teams with equitable remuneration.</p>
        
        <p>We're looking for passionate contributors like yourself to help us develop frameworks for sustainable open-source communities. Your engagement with topics like <strong>open source</strong> and <strong>community building</strong> aligns perfectly with our mission.</p>
        
        <p>Project Connect is creating a new model for open-source collaboration that:
          <ul>
            <li>Goes viral through exceptional community building</li>
            <li>Generates sustainable revenue through multiple streams</li>
            <li>Equitably rewards all contributors based on their impact</li>
            <li>Fosters inclusive, diverse, and thriving communities</li>
          </ul>
        </p>
        
        <p>We're particularly interested in collaborators who can help with:
          <ul>
            <li><strong>Community Builders</strong> - Help us design viral growth strategies</li>
            <li><strong>Product Developers</strong> - Contribute to our frameworks and tools</li>
            <li><strong>Business Strategists</strong> - Help refine our monetization approaches</li>
            <li><strong>Governance Experts</strong> - Improve our equitable remuneration models</li>
          </ul>
        </p>
        
        <p>Would you be interested in learning more? I'd be happy to share details about how you might contribute.</p>
        
        <p>You can learn more about Project Connect at:</p>
        <ul>
          <li>GitHub: <a href="https://github.com/Didier1111/connect">https://github.com/Didier1111/connect</a></li>
          <li>Website: <a href="https://didier1111.github.io/connect">https://didier1111.github.io/connect</a></li>
        </ul>
        
        <p>Best regards,<br>
        Project Connect Team</p>
        
        <hr>
        <p><small>This email is part of our automated recruitment process. If you're not interested in receiving further communications, please reply with "unsubscribe" and we'll remove you from our list.</small></p>
      </body>
    </html>
  `;
}

// Function to process candidates and send outreach emails
async function processOutreach(candidates, type = 'github') {
  console.log(`Processing outreach for ${candidates.length} ${type} candidates...`);
  
  const results = {
    sent: 0,
    failed: 0,
    skipped: 0,
    details: []
  };
  
  // Limit to top 10 candidates to avoid overwhelming
  const topCandidates = candidates.slice(0, 10);
  
  for (const candidate of topCandidates) {
    try {
      // Skip if no contact method
      let email = null;
      if (type === 'github' && candidate.email) {
        email = candidate.email;
      } else if (type === 'twitter') {
        // For Twitter candidates, we'd need to find their email
        // This is a simplified approach - in reality, you might use a service to find emails
        console.log(`Skipping ${candidate.username} - no email available`);
        results.skipped++;
        results.details.push({
          candidate: candidate.username,
          status: 'skipped',
          reason: 'no_email'
        });
        continue;
      }
      
      if (!email) {
        console.log(`Skipping ${candidate.username} - no email available`);
        results.skipped++;
        results.details.push({
          candidate: candidate.username,
          status: 'skipped',
          reason: 'no_email'
        });
        continue;
      }
      
      // Generate personalized email
      const subject = "Collaboration Opportunity - Project Connect";
      const html = type === 'github' 
        ? generateGitHubOutreachEmail(candidate)
        : generateTwitterOutreachEmail(candidate);
      
      // Send email
      console.log(`Sending email to ${email}...`);
      const result = await sendEmail(email, subject, html);
      
      if (result.success) {
        results.sent++;
        results.details.push({
          candidate: candidate.username,
          email: email,
          status: 'sent',
          messageId: result.messageId
        });
      } else {
        results.failed++;
        results.details.push({
          candidate: candidate.username,
          email: email,
          status: 'failed',
          error: result.error
        });
      }
      
      // Add a delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`Error processing candidate ${candidate.username}:`, error.message);
      results.failed++;
      results.details.push({
        candidate: candidate.username,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  return results;
}

// Function to generate outreach report
function generateOutreachReport(results) {
  return `
    <html>
      <body>
        <h2>Project Connect Outreach Report</h2>
        <p>Generated: ${new Date().toISOString()}</p>
        
        <h3>Summary</h3>
        <ul>
          <li>Emails Sent: ${results.sent}</li>
          <li>Emails Failed: ${results.failed}</li>
          <li>Candidates Skipped: ${results.skipped}</li>
          <li>Total Processed: ${results.sent + results.failed + results.skipped}</li>
        </ul>
        
        <h3>Details</h3>
        <table border="1" cellpadding="5" cellspacing="0">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Email</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${results.details.map(detail => `
              <tr>
                <td>${detail.candidate}</td>
                <td>${detail.email || 'N/A'}</td>
                <td>${detail.status}</td>
                <td>${detail.messageId || detail.error || detail.reason || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

// Main function
async function main() {
  console.log('Starting outreach automation...');
  
  // Load candidate data
  let githubCandidates = [];
  let twitterCandidates = [];
  
  try {
    if (fs.existsSync('candidates.json')) {
      const githubContent = fs.readFileSync('candidates.json', 'utf8');
      githubCandidates = JSON.parse(githubContent);
    }
    
    if (fs.existsSync('twitter-candidates.json')) {
      const twitterContent = fs.readFileSync('twitter-candidates.json', 'utf8');
      twitterCandidates = JSON.parse(twitterContent);
    }
  } catch (error) {
    console.error('Error loading candidate data:', error.message);
    process.exit(1);
  }
  
  console.log(`Loaded ${githubCandidates.length} GitHub candidates and ${twitterCandidates.length} Twitter candidates`);
  
  // Process GitHub outreach
  const githubResults = await processOutreach(githubCandidates, 'github');
  
  // Process Twitter outreach (limited due to email availability)
  const twitterResults = await processOutreach(twitterCandidates, 'twitter');
  
  // Generate reports
  const githubReport = generateOutreachReport(githubResults);
  const twitterReport = generateOutreachReport(twitterResults);
  
  // Save reports
  fs.writeFileSync('github-outreach-report.html', githubReport);
  fs.writeFileSync('twitter-outreach-report.html', twitterReport);
  
  // Generate summary report
  const summaryReport = `
    <html>
      <body>
        <h2>Project Connect Outreach Summary</h2>
        <p>Generated: ${new Date().toISOString()}</p>
        
        <h3>GitHub Outreach</h3>
        <ul>
          <li>Sent: ${githubResults.sent}</li>
          <li>Failed: ${githubResults.failed}</li>
          <li>Skipped: ${githubResults.skipped}</li>
        </ul>
        
        <h3>Twitter Outreach</h3>
        <ul>
          <li>Sent: ${twitterResults.sent}</li>
          <li>Failed: ${twitterResults.failed}</li>
          <li>Skipped: ${twitterResults.skipped}</li>
        </ul>
        
        <h3>Total</h3>
        <ul>
          <li>Total Sent: ${githubResults.sent + twitterResults.sent}</li>
          <li>Total Failed: ${githubResults.failed + twitterResults.failed}</li>
          <li>Total Skipped: ${githubResults.skipped + twitterResults.skipped}</li>
        </ul>
        
        <p>Detailed reports saved as github-outreach-report.html and twitter-outreach-report.html</p>
      </body>
    </html>
  `;
  
  fs.writeFileSync('outreach-summary.html', summaryReport);
  
  console.log('Outreach automation completed!');
  console.log(`GitHub: ${githubResults.sent} sent, ${githubResults.failed} failed, ${githubResults.skipped} skipped`);
  console.log(`Twitter: ${twitterResults.sent} sent, ${twitterResults.failed} failed, ${twitterResults.skipped} skipped`);
  console.log('Reports saved to outreach-summary.html, github-outreach-report.html, and twitter-outreach-report.html');
}

// Run the script
main().catch(console.error);