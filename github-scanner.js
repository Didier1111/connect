# GitHub Candidate Scanner Script

This script scans GitHub for potential candidates based on predefined criteria and creates a report of promising contributors.

## Prerequisites

1. Node.js installed
2. GitHub personal access token with `public_repo` scope
3. Required npm packages:
   ```bash
   npm install axios dotenv
   ```

## Setup

1. Create a `.env` file with your GitHub token:
   ```
   GITHUB_TOKEN=your_github_personal_access_token
   ```

2. Customize the search criteria in the script

## Usage

```bash
node github-scanner.js
```

This will generate a `candidates.json` file with potential candidates.

```javascript
// github-scanner.js
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

// GitHub API configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const headers = {
  'Authorization': `token ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json'
};

// Search criteria
const SEARCH_QUERIES = [
  'topic:open-source language:javascript created:>2020-01-01',
  'topic:community language:python created:>2020-01-01',
  'topic:collaboration language:typescript created:>2020-01-01',
  'topic:decentralized language:rust created:>2020-01-01',
  'topic:governance language:go created:>2020-01-01'
];

// Scoring criteria
const SCORING_CRITERIA = {
  technicalSkills: 40,
  communityExperience: 30,
  interestAlignment: 20,
  availability: 10
};

// Function to search GitHub
async function searchGitHub(query) {
  try {
    const response = await axios.get(`https://api.github.com/search/repositories`, {
      headers,
      params: {
        q: query,
        sort: 'updated',
        order: 'desc',
        per_page: 10
      }
    });
    return response.data.items;
  } catch (error) {
    console.error('Error searching GitHub:', error.message);
    return [];
  }
}

// Function to get repository contributors
async function getContributors(repo) {
  try {
    const response = await axios.get(`https://api.github.com/repos/${repo.full_name}/contributors`, {
      headers,
      params: {
        per_page: 10
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting contributors:', error.message);
    return [];
  }
}

// Function to get user details
async function getUserDetails(username) {
  try {
    const response = await axios.get(`https://api.github.com/users/${username}`, {
      headers
    });
    return response.data;
  } catch (error) {
    console.error('Error getting user details:', error.message);
    return null;
  }
}

// Function to score a candidate
function scoreCandidate(user, repo) {
  let score = 0;
  
  // Technical Skills (40 points)
  if (user.public_repos > 10) score += 10;
  if (repo.language) score += 10;
  if (user.followers > 50) score += 10;
  if (user.public_gists > 5) score += 10;
  
  // Community Experience (30 points)
  if (user.following > 100) score += 10;
  if (user.bio && user.bio.toLowerCase().includes('community')) score += 10;
  if (user.company && user.company.includes('Open')) score += 10;
  
  // Interest Alignment (20 points)
  if (repo.topics && repo.topics.includes('open-source')) score += 10;
  if (repo.topics && repo.topics.includes('community')) score += 10;
  
  // Availability Indicators (10 points)
  const lastActive = new Date(user.updated_at);
  const daysSinceActive = (new Date() - lastActive) / (1000 * 60 * 60 * 24);
  if (daysSinceActive < 30) score += 5;
  if (!user.hireable === false) score += 5;
  
  return score;
}

// Main function
async function main() {
  console.log('Starting GitHub candidate scan...');
  
  const allCandidates = [];
  
  for (const query of SEARCH_QUERIES) {
    console.log(`Searching for: ${query}`);
    const repos = await searchGitHub(query);
    
    for (const repo of repos) {
      console.log(`Analyzing repository: ${repo.full_name}`);
      const contributors = await getContributors(repo);
      
      for (const contributor of contributors) {
        // Skip bots and organizations
        if (contributor.type !== 'User') continue;
        
        // Skip if we already have this user
        if (allCandidates.some(c => c.username === contributor.login)) continue;
        
        console.log(`Analyzing contributor: ${contributor.login}`);
        const userDetails = await getUserDetails(contributor.login);
        
        if (userDetails) {
          const score = scoreCandidate(userDetails, repo);
          
          // Only include candidates with score >= 50
          if (score >= 50) {
            allCandidates.push({
              username: userDetails.login,
              name: userDetails.name,
              bio: userDetails.bio,
              location: userDetails.location,
              company: userDetails.company,
              blog: userDetails.blog,
              email: userDetails.email,
              hireable: userDetails.hireable,
              twitter_username: userDetails.twitter_username,
              public_repos: userDetails.public_repos,
              public_gists: userDetails.public_gists,
              followers: userDetails.followers,
              following: userDetails.following,
              created_at: userDetails.created_at,
              updated_at: userDetails.updated_at,
              score: score,
              top_repo: repo.full_name,
              top_repo_language: repo.language,
              top_repo_topics: repo.topics
            });
          }
        }
      }
    }
  }
  
  // Sort candidates by score
  allCandidates.sort((a, b) => b.score - a.score);
  
  // Save to file
  fs.writeFileSync('candidates.json', JSON.stringify(allCandidates, null, 2));
  
  console.log(`Found ${allCandidates.length} potential candidates`);
  console.log('Results saved to candidates.json');
  
  // Display top 5 candidates
  console.log('\nTop 5 Candidates:');
  allCandidates.slice(0, 5).forEach((candidate, index) => {
    console.log(`${index + 1}. ${candidate.username} (Score: ${candidate.score})`);
    console.log(`   Bio: ${candidate.bio}`);
    console.log(`   Top Repo: ${candidate.top_repo}`);
    console.log('');
  });
}

// Run the script
main().catch(console.error);
```