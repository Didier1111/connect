// twitter-scanner.js
require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

// Twitter API configuration
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Keywords and hashtags to track
const TRACK_KEYWORDS = [
  '#opensource',
  '#communitybuilding',
  '#oss',
  '#open source',
  'open source community',
  'decentralized community',
  'equitable tech'
];

const TRACK_HASHTAGS = [
  '#OpenSource',
  '#CommunityBuilding',
  '#EquitableTech',
  '#OSSCommunity',
  '#DevCommunity'
];

// Function to search for tweets
async function searchTweets() {
  try {
    // Combine keywords and hashtags for search
    const searchQuery = [...TRACK_KEYWORDS, ...TRACK_HASHTAGS].join(' OR ');
    
    // Search for recent tweets
    const tweets = await client.v2.search(searchQuery, {
      max_results: 50,
      'tweet.fields': ['created_at', 'author_id', 'public_metrics'],
      'user.fields': ['username', 'name', 'description', 'location', 'public_metrics'],
      expansions: ['author_id']
    });
    
    return tweets;
  } catch (error) {
    console.error('Error searching Twitter:', error.message);
    return null;
  }
}

// Function to analyze potential candidates from tweets
function analyzeTweets(tweets) {
  if (!tweets || !tweets.data) return [];
  
  const candidates = [];
  
  // Get user data from includes
  const users = {};
  if (tweets.includes && tweets.includes.users) {
    tweets.includes.users.forEach(user => {
      users[user.id] = user;
    });
  }
  
  // Analyze each tweet
  tweets.data.forEach(tweet => {
    const user = users[tweet.author_id];
    if (!user) return;
    
    // Skip if we already have this user
    if (candidates.some(c => c.username === user.username)) return;
    
    // Score the candidate based on their profile and tweet
    const score = scoreTwitterCandidate(user, tweet);
    
    // Only include candidates with score >= 40
    if (score >= 40) {
      candidates.push({
        username: user.username,
        name: user.name,
        description: user.description,
        location: user.location,
        followers: user.public_metrics.followers_count,
        following: user.public_metrics.following_count,
        tweet_count: user.public_metrics.tweet_count,
        listed_count: user.public_metrics.listed_count,
        tweet_id: tweet.id,
        tweet_text: tweet.text,
        tweet_created_at: tweet.created_at,
        tweet_retweets: tweet.public_metrics.retweet_count,
        tweet_likes: tweet.public_metrics.like_count,
        score: score
      });
    }
  });
  
  // Sort candidates by score
  candidates.sort((a, b) => b.score - a.score);
  
  return candidates;
}

// Function to score a Twitter candidate
function scoreTwitterCandidate(user, tweet) {
  let score = 0;
  
  // Profile Completeness (20 points)
  if (user.name) score += 5;
  if (user.description) score += 10;
  if (user.location) score += 5;
  
  // Follower Count (20 points)
  if (user.public_metrics.followers_count > 1000) score += 20;
  else if (user.public_metrics.followers_count > 500) score += 15;
  else if (user.public_metrics.followers_count > 100) score += 10;
  else if (user.public_metrics.followers_count > 50) score += 5;
  
  // Engagement (20 points)
  if (user.public_metrics.following_count > 100) score += 10;
  if (user.public_metrics.tweet_count > 1000) score += 10;
  else if (user.public_metrics.tweet_count > 500) score += 5;
  
  // Relevance (20 points)
  const text = (tweet.text + ' ' + (user.description || '')).toLowerCase();
  if (text.includes('open source')) score += 10;
  if (text.includes('community')) score += 5;
  if (text.includes('developer')) score += 5;
  
  // Recent Activity (20 points)
  const tweetDate = new Date(tweet.created_at);
  const daysSinceTweet = (new Date() - tweetDate) / (1000 * 60 * 60 * 24);
  if (daysSinceTweet < 7) score += 20;
  else if (daysSinceTweet < 14) score += 10;
  else if (daysSinceTweet < 30) score += 5;
  
  return score;
}

// Function to generate outreach message
function generateOutreachMessage(candidate) {
  return `Hi @${candidate.username},

I noticed your tweet about "${candidate.tweet_text.substring(0, 50)}..." and was impressed by your interest in open-source communities.

I'm part of Project Connect, an initiative to build viral, monetized open-source teams with equitable remuneration. We're looking for passionate contributors like yourself to help us develop frameworks for sustainable open-source communities.

Would you be interested in learning more? I'd be happy to share details about how you might contribute.

Best regards,
Project Connect Team

#OpenSource #CommunityBuilding`;
}

// Main function
async function main() {
  console.log('Starting Twitter candidate scan...');
  
  // Search for relevant tweets
  const tweets = await searchTweets();
  
  if (!tweets) {
    console.log('No tweets found or error occurred');
    return;
  }
  
  // Analyze tweets for potential candidates
  const candidates = analyzeTweets(tweets);
  
  // Save to file
  require('fs').writeFileSync('twitter-candidates.json', JSON.stringify(candidates, null, 2));
  
  console.log(`Found ${candidates.length} potential candidates from Twitter`);
  console.log('Results saved to twitter-candidates.json');
  
  // Display top 5 candidates
  console.log('\nTop 5 Twitter Candidates:');
  candidates.slice(0, 5).forEach((candidate, index) => {
    console.log(`${index + 1}. @${candidate.username} (Score: ${candidate.score})`);
    console.log(`   Description: ${candidate.description}`);
    console.log(`   Followers: ${candidate.followers}`);
    console.log(`   Sample Tweet: ${candidate.tweet_text.substring(0, 100)}...`);
    console.log('');
  });
  
  // Generate sample outreach messages
  console.log('\nSample Outreach Messages:');
  candidates.slice(0, 3).forEach((candidate, index) => {
    console.log(`${index + 1}. To @${candidate.username}:`);
    console.log(generateOutreachMessage(candidate));
    console.log('');
  });
}

// Run the script
main().catch(console.error);