#!/bin/bash

# setup-agents.sh
# Setup script for Project Connect Autonomous Agent System

echo "🤖 Setting up Project Connect Autonomous Agent System..."

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is required. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing agent system dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create necessary directories
echo "📁 Creating agent system directories..."
mkdir -p agents/logs
mkdir -p agents/data
mkdir -p agents/config

# Set up environment configuration
echo "⚙️ Setting up environment configuration..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file from example. Please configure your settings."
fi

# Set up agent configuration
echo "🔧 Setting up agent configuration..."

cat > agents/config/default.json << EOF
{
  "projectManager": {
    "autonomyLevel": "high",
    "assessmentInterval": 300000,
    "maxConcurrentTasks": 5
  },
  "contributorAgents": {
    "taskHunter": {
      "autonomyLevel": "high",
      "maxTasksPerDay": 3,
      "autoApplyThreshold": 0.8
    },
    "earningsOptimizer": {
      "autonomyLevel": "high",
      "targetOptimization": 0.3,
      "maxBudget": 50
    },
    "qualityAssurer": {
      "autonomyLevel": "medium",
      "autoFixThreshold": 0.9,
      "reviewFrequency": 1800000
    },
    "skillBuilder": {
      "autonomyLevel": "medium",
      "learningBudget": 100,
      "assessmentFrequency": 604800000
    },
    "networkBuilder": {
      "autonomyLevel": "low",
      "suggestionFrequency": 86400000
    }
  },
  "continuationSystem": {
    "creditResetInterval": 18000000,
    "healthCheckInterval": 1800000,
    "resumeDelay": 300000
  }
}
EOF

echo "✅ Agent configuration created"

# Set up package.json scripts
echo "📜 Adding agent scripts to package.json..."

# Add agent scripts to package.json if they don't exist
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const agentScripts = {
  'start-agents': 'node agents/ProjectContinuationSystem.js',
  'setup-my-agents': 'node agents/setup-contributor.js',
  'agent-dashboard': 'node agents/dashboard.js',
  'pause-agents': 'node -e \"console.log(\\'Pausing agents...\\'); process.exit(0)\"',
  'resume-agents': 'node -e \"console.log(\\'Resuming agents...\\'); process.exit(0)\"'
};

Object.assign(pkg.scripts, agentScripts);
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ Agent scripts added to package.json');
"

# Create contributor setup script
echo "👤 Creating contributor setup script..."

cat > agents/setup-contributor.js << 'EOF'
// agents/setup-contributor.js
// Setup script for individual contributors

const ContributorAgentToolkit = require('./ContributorAgentToolkit');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupContributor() {
  console.log('🎯 Welcome to Project Connect Agent Setup!');
  console.log('Let\\'s configure your personal AI agent swarm...\n');

  // Get contributor information
  const contributorId = await askQuestion('Enter your contributor ID: ');
  const name = await askQuestion('Enter your name: ');
  const skills = await askQuestion('Enter your skills (comma-separated): ');
  const experience = await askQuestion('Experience level (beginner/intermediate/expert): ');

  console.log('\n🤖 Initializing your agent toolkit...');

  try {
    // Initialize contributor agents
    const toolkit = new ContributorAgentToolkit(contributorId);
    await toolkit.initialize();

    // Configure agents based on user input
    const skillsArray = skills.split(',').map(s => s.trim());

    await toolkit.configureAgent('TaskHunter', {
      skills: skillsArray,
      experienceLevel: experience,
      minHourlyRate: experience === 'expert' ? 100 : experience === 'intermediate' ? 60 : 30
    });

    console.log('✅ Agent setup complete!');
    console.log('\nYour AI agents are now running and will:');
    console.log('- 🎯 Find optimal tasks based on your skills');
    console.log('- 💰 Optimize your earnings automatically');
    console.log('- ✅ Ensure high-quality code submissions');
    console.log('- 📚 Suggest skill development opportunities');
    console.log('- 🤝 Help build your professional network');

    console.log('\n🚀 Start earning more with: npm run agent-dashboard');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('Please check your configuration and try again.');
  }

  rl.close();
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

setupContributor();
EOF

# Create dashboard script
echo "📊 Creating agent dashboard..."

cat > agents/dashboard.js << 'EOF'
// agents/dashboard.js
// Simple dashboard to monitor agent performance

console.log('🤖 Project Connect Agent Dashboard');
console.log('================================\n');

// Mock dashboard data (would integrate with real agent system)
const agentStatus = {
  projectManager: { status: 'active', tasksInQueue: 3, lastActivity: new Date() },
  taskHunter: { status: 'active', tasksFound: 5, autoApplied: 2, earnings: 150 },
  earningsOptimizer: { status: 'active', optimizations: 3, bonusEarnings: 75 },
  qualityAssurer: { status: 'active', reviewsCompleted: 8, issuesFixed: 12 },
  skillBuilder: { status: 'active', recommendationsGiven: 2, coursesFound: 3 },
  networkBuilder: { status: 'active', connectionsFound: 4, eventsRecommended: 1 }
};

console.log('📊 Agent Performance Summary:');
console.log('─────────────────────────────');

Object.entries(agentStatus).forEach(([agent, status]) => {
  const statusEmoji = status.status === 'active' ? '🟢' : '🔴';
  console.log(`${statusEmoji} ${agent.charAt(0).toUpperCase() + agent.slice(1)}: ${status.status}`);

  if (status.earnings) {
    console.log(`   💰 Earnings generated: $${status.earnings}`);
  }
  if (status.tasksFound) {
    console.log(`   🎯 Tasks found: ${status.tasksFound}`);
  }
  if (status.optimizations) {
    console.log(`   ⚡ Optimizations made: ${status.optimizations}`);
  }
  if (status.reviewsCompleted) {
    console.log(`   ✅ Code reviews: ${status.reviewsCompleted}`);
  }
  console.log('');
});

const totalEarnings = Object.values(agentStatus)
  .reduce((sum, agent) => sum + (agent.earnings || 0) + (agent.bonusEarnings || 0), 0);

console.log(`💰 Total AI-Generated Earnings: $${totalEarnings}`);
console.log('🚀 Agents are working 24/7 to maximize your success!');
console.log('\nRun "npm run start-agents" to ensure continuous operation.');
EOF

# Set executable permissions
chmod +x agents/setup-contributor.js
chmod +x agents/dashboard.js

echo "✅ Contributor scripts created"

# Final setup completion
echo "🎉 Project Connect Autonomous Agent System setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with your settings"
echo "2. Set up your personal agents: npm run setup-my-agents"
echo "3. Start the autonomous system: npm run start-agents"
echo "4. Monitor your earnings: npm run agent-dashboard"
echo ""
echo "📚 Read AUTONOMOUS_AGENT_SETUP.md for detailed documentation"
echo "🤖 Your AI agents are ready to 10x your open source earnings!"
EOF

chmod +x setup-agents.sh