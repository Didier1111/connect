# Recruitment Scheduler

This script schedules daily runs of our recruitment scanners.

## Setup

1. Install node-cron:
   ```bash
   npm install node-cron
   ```

2. Update the `.env` file with all necessary credentials:
   ```
   GITHUB_TOKEN=your_github_personal_access_token
   TWITTER_API_KEY=your_twitter_api_key
   TWITTER_API_SECRET=your_twitter_api_secret
   TWITTER_ACCESS_TOKEN=your_twitter_access_token
   TWITTER_ACCESS_SECRET=your_twitter_access_secret
   ```

3. Run the scheduler:
   ```bash
   node recruitment-scheduler.js
   ```

```javascript
// recruitment-scheduler.js
require('dotenv').config();
const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');

// Schedule GitHub scan for 9:00 AM daily
cron.schedule('0 9 * * *', () => {
  console.log('Running daily GitHub candidate scan...');
  
  exec('node github-scanner.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`GitHub scan error: ${error}`);
      return;
    }
    
    console.log(`GitHub scan output: ${stdout}`);
    
    if (stderr) {
      console.error(`GitHub scan stderr: ${stderr}`);
    }
    
    // Log the completion
    const logEntry = {
      timestamp: new Date().toISOString(),
      scanner: 'github',
      status: 'completed',
      output: stdout
    };
    
    appendToLog(logEntry);
  });
});

// Schedule Twitter scan for 10:00 AM daily
cron.schedule('0 10 * * *', () => {
  console.log('Running daily Twitter candidate scan...');
  
  exec('node twitter-scanner.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Twitter scan error: ${error}`);
      return;
    }
    
    console.log(`Twitter scan output: ${stdout}`);
    
    if (stderr) {
      console.error(`Twitter scan stderr: ${stderr}`);
    }
    
    // Log the completion
    const logEntry = {
      timestamp: new Date().toISOString(),
      scanner: 'twitter',
      status: 'completed',
      output: stdout
    };
    
    appendToLog(logEntry);
  });
});

// Schedule weekly report generation on Sundays at 8:00 AM
cron.schedule('0 8 * * 0', () => {
  console.log('Generating weekly recruitment report...');
  generateWeeklyReport();
});

// Function to append to log file
function appendToLog(entry) {
  const logFile = 'recruitment-log.json';
  
  // Read existing log
  let log = [];
  if (fs.existsSync(logFile)) {
    const logContent = fs.readFileSync(logFile, 'utf8');
    log = JSON.parse(logContent);
  }
  
  // Add new entry
  log.push(entry);
  
  // Keep only last 100 entries
  if (log.length > 100) {
    log = log.slice(-100);
  }
  
  // Write updated log
  fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
}

// Function to generate weekly report
function generateWeeklyReport() {
  console.log('Generating weekly recruitment report...');
  
  // Read candidate files
  let githubCandidates = [];
  let twitterCandidates = [];
  
  if (fs.existsSync('candidates.json')) {
    const githubContent = fs.readFileSync('candidates.json', 'utf8');
    githubCandidates = JSON.parse(githubContent);
  }
  
  if (fs.existsSync('twitter-candidates.json')) {
    const twitterContent = fs.readFileSync('twitter-candidates.json', 'utf8');
    twitterCandidates = JSON.parse(twitterContent);
  }
  
  // Generate report
  const report = {
    week: `${new Date().toISOString().split('T')[0]} Weekly Report`,
    generated: new Date().toISOString(),
    githubCandidates: {
      total: githubCandidates.length,
      topCandidates: githubCandidates.slice(0, 10).map(c => ({
        username: c.username,
        score: c.score,
        top_repo: c.top_repo
      }))
    },
    twitterCandidates: {
      total: twitterCandidates.length,
      topCandidates: twitterCandidates.slice(0, 10).map(c => ({
        username: c.username,
        score: c.score,
        followers: c.followers
      }))
    },
    summary: {
      totalCandidates: githubCandidates.length + twitterCandidates.length,
      averageGitHubScore: githubCandidates.length > 0 
        ? githubCandidates.reduce((sum, c) => sum + c.score, 0) / githubCandidates.length 
        : 0,
      averageTwitterScore: twitterCandidates.length > 0 
        ? twitterCandidates.reduce((sum, c) => sum + c.score, 0) / twitterCandidates.length 
        : 0
    }
  };
  
  // Save report
  fs.writeFileSync('weekly-report.json', JSON.stringify(report, null, 2));
  
  console.log('Weekly report generated successfully');
}

// Start the scheduler
console.log('Recruitment scheduler started. Waiting for scheduled tasks...');
console.log('GitHub scans will run daily at 9:00 AM');
console.log('Twitter scans will run daily at 10:00 AM');
console.log('Weekly reports will be generated on Sundays at 8:00 AM');

// Keep the process running
setInterval(() => {
  console.log(`Scheduler running... ${new Date().toISOString()}`);
}, 3600000); // Log every hour