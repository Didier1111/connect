# Project Connect Recruitment Tools

Automated tools for identifying and recruiting potential collaborators for Project Connect.

## Overview

These tools provide a systematic approach to automatically identify and engage potential collaborators for Project Connect on a daily basis. The system includes:

1. **GitHub Scanner** - Identifies active open-source contributors
2. **Twitter Scanner** - Finds professionals interested in open-source and community building
3. **Recruitment Scheduler** - Runs scans daily and generates reports
4. **Outreach Automation** - Sends personalized messages to potential candidates

## Setup

### Prerequisites

1. Node.js (v14 or higher)
2. npm (v6 or higher)

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file with the following credentials:

```env
# GitHub
GITHUB_TOKEN=your_github_personal_access_token

# Twitter (optional)
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret

# Email (for outreach)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Tools

### GitHub Scanner

Scans GitHub for potential candidates based on repositories with relevant topics and languages.

```bash
npm run scan-github
```

Generates `candidates.json` with identified candidates.

### Twitter Scanner

Monitors Twitter for professionals discussing open-source and community building.

```bash
npm run scan-twitter
```

Generates `twitter-candidates.json` with identified candidates.

### Daily Scan

Runs both GitHub and Twitter scans sequentially.

```bash
npm run daily-scan
```

### Recruitment Scheduler

Runs scans automatically on a daily schedule.

```bash
npm run start-scheduler
```

Schedule:
- GitHub scan: Daily at 9:00 AM
- Twitter scan: Daily at 10:00 AM
- Weekly report: Sundays at 8:00 AM

### Outreach Automation

Sends personalized outreach emails to identified candidates.

```bash
npm run send-outreach
```

Generates outreach reports:
- `outreach-summary.html`
- `github-outreach-report.html`
- `twitter-outreach-report.html`

## Candidate Scoring

Candidates are scored based on multiple criteria:

### GitHub Candidates (Max 100 points)
- **Technical Skills** (40 points)
  - Repository count
  - Language expertise
  - Follower count
  - Gist count

- **Community Experience** (30 points)
  - Following count
  - Community-related bio
  - Company affiliation

- **Interest Alignment** (20 points)
  - Repository topics
  - Community-related content

- **Availability** (10 points)
  - Recent activity
  - Hireable status

### Twitter Candidates (Max 100 points)
- **Profile Completeness** (20 points)
  - Name
  - Description
  - Location

- **Follower Count** (20 points)
  - >1000 followers: 20 points
  - >500 followers: 15 points
  - >100 followers: 10 points
  - >50 followers: 5 points

- **Engagement** (20 points)
  - Following count
  - Tweet count

- **Relevance** (20 points)
  - Keywords in bio/tweets
  - Open source mentions

- **Recent Activity** (20 points)
  - Tweet recency

## Output Files

- `candidates.json` - GitHub candidates from latest scan
- `twitter-candidates.json` - Twitter candidates from latest scan
- `recruitment-log.json` - Log of all recruitment activities
- `weekly-report.json` - Weekly summary of recruitment activities
- `outreach-summary.html` - Summary of outreach activities
- `github-outreach-report.html` - Detailed GitHub outreach report
- `twitter-outreach-report.html` - Detailed Twitter outreach report

## Privacy and Compliance

- All candidate data is handled in compliance with privacy regulations
- Candidates can opt-out by replying "unsubscribe"
- Data is retained only for the duration of the recruitment process

## Contributing

We welcome contributions to improve these recruitment tools. Please see our [Contributing Guidelines](CONTRIBUTING.md) for more information.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.