# Technical Architecture & Database Schema

This document outlines the technical architecture and database schema for Project Connect's trading journal and challenge platform.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Frontend      │    │   API Gateway    │    │   Microservices  │
│   (React)       │◄──►│   (Kong/Nginx)   │◄──►│   (Node.js)      │
└─────────────────┘    └──────────────────┘    └──────────────────┘
                                │                         │
                                ▼                         ▼
                        ┌──────────────────┐    ┌──────────────────┐
                        │   Load Balancer  │    │   Message Queue  │
                        │   (AWS ELB)      │    │   (RabbitMQ)     │
                        └──────────────────┘    └──────────────────┘
                                │                         │
        ┌───────────────────────┼─────────────────────────┼───────────────────────┐
        │                       │                         │                       │
        ▼                       ▼                         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Database      │    │   Cache Layer    │    │   File Storage   │    │   Analytics      │
│   (PostgreSQL)  │    │   (Redis)        │    │   (AWS S3)       │    │   (InfluxDB)     │
└─────────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
        │                       │                         │                       │
        ▼                       ▼                         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Backup        │    │   Monitoring     │    │   CDN            │    │   Reporting      │
│   (AWS S3)      │    │   (Prometheus)   │    │   (CloudFront)   │    │   (Grafana)      │
└─────────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
```

### Component Breakdown

#### 1. Frontend Layer
- **Primary**: React.js web application
- **Mobile**: React Native mobile application
- **Admin**: Separate admin dashboard
- **Static Assets**: Hosted via CDN

#### 2. API Gateway Layer
- **Primary**: Kong API Gateway
- **Functions**: Authentication, rate limiting, request routing
- **Security**: SSL termination, DDoS protection

#### 3. Load Balancer
- **Service**: AWS Elastic Load Balancer
- **Functions**: Traffic distribution, health checks
- **Scaling**: Auto-scaling group integration

#### 4. Microservices Layer
- **User Service**: User management, authentication
- **Trade Service**: Trade logging, validation
- **Analytics Service**: Performance calculations, reporting
- **Challenge Service**: Challenge management, scoring
- **Revenue Service**: Revenue sharing, payouts
- **Community Service**: Forums, profiles, achievements
- **Notification Service**: Email, SMS, push notifications

#### 5. Data Layer
- **Primary Database**: PostgreSQL
- **Cache**: Redis for session data and frequent queries
- **File Storage**: AWS S3 for screenshots and documents
- **Analytics Database**: InfluxDB for time-series data
- **Search**: Elasticsearch for community search

#### 6. Infrastructure Layer
- **Hosting**: AWS cloud services
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

## Database Schema

### Core Tables

#### 1. Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    account_tier VARCHAR(20) DEFAULT 'free',
    subscription_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    profile_image_url TEXT,
    bio TEXT,
    trading_experience INTEGER, -- Years of experience
    preferred_markets JSONB, -- Array of preferred markets
    notification_preferences JSONB -- Notification settings
);
```

#### 2. Trades Table
```sql
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    trade_date TIMESTAMP NOT NULL,
    market VARCHAR(50) NOT NULL, -- Stocks, Options, Forex, Crypto, Futures
    asset VARCHAR(100) NOT NULL, -- Ticker symbol or asset name
    position VARCHAR(10) NOT NULL, -- Long, Short
    entry_price DECIMAL(15, 8) NOT NULL,
    entry_time TIME NOT NULL,
    exit_price DECIMAL(15, 8),
    exit_time TIME,
    position_size DECIMAL(15, 8) NOT NULL, -- In currency or contracts
    risk_amount DECIMAL(15, 2) NOT NULL, -- Dollar amount risked
    stop_loss DECIMAL(15, 8),
    take_profit DECIMAL(15, 8),
    planned_rr DECIMAL(10, 2), -- Planned risk/reward ratio
    actual_rr DECIMAL(10, 2), -- Actual risk/reward ratio
    market_conditions VARCHAR(20), -- Bull, Bear, Sideways, Volatile, Stable
    emotional_state VARCHAR(20), -- Greed, Fear, Neutral, Overconfident, Doubtful
    strategy VARCHAR(100), -- Strategy used
    notes TEXT, -- Journal entry for the trade
    screenshot_url TEXT, -- URL to screenshot
    broker_confirmation_url TEXT, -- URL to broker statement
    verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(20), -- broker, screenshot, manual
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. Strategies Table
```sql
CREATE TABLE strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- Day Trading, Swing Trading, Position Trading, Options, Crypto
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT FALSE,
    popularity_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. Challenges Table
```sql
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- Consistency, Risk Management, Adaptability, Strategy Mastery
    duration INTEGER NOT NULL, -- In days
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    min_trades INTEGER DEFAULT 0,
    max_drawdown DECIMAL(5, 2), -- Percentage
    max_position_size DECIMAL(5, 2), -- Percentage of account
    required_strategies JSONB, -- List of required strategies
    market_conditions JSONB, -- Required market conditions
    prize_pool DECIMAL(15, 2), -- Total prize pool
    revenue_share_percentage DECIMAL(5, 2), -- Percentage of revenue share
    performance_points INTEGER, -- Points for leaderboard
    allowed_markets JSONB,
    allowed_strategies JSONB,
    prohibited_actions JSONB,
    verification_method VARCHAR(20), -- broker, screenshots, manual
    status VARCHAR(20) DEFAULT 'draft', -- draft, active, completed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. Challenge Participants Table
```sql
CREATE TABLE challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_balance DECIMAL(15, 2),
    current_balance DECIMAL(15, 2),
    max_balance DECIMAL(15, 2),
    min_balance DECIMAL(15, 2),
    current_drawdown DECIMAL(5, 2),
    max_drawdown DECIMAL(5, 2),
    trades_count INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'registered', -- registered, active, completed, disqualified
    final_score DECIMAL(10, 2),
    ranking INTEGER,
    prize_won DECIMAL(15, 2),
    performance_metrics JSONB, -- Detailed performance data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(challenge_id, user_id)
);
```

#### 6. Revenue Pools Table
```sql
CREATE TABLE revenue_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    source_type VARCHAR(50) NOT NULL, -- affiliate, education, marketplace, sponsored
    total_amount DECIMAL(15, 2) NOT NULL,
    distribution_percentage DECIMAL(5, 2) NOT NULL, -- Percentage of total revenue
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, distributed, closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 7. User Revenue Shares Table
```sql
CREATE TABLE user_revenue_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    revenue_pool_id UUID REFERENCES revenue_pools(id) ON DELETE CASCADE,
    base_percentage DECIMAL(5, 2) NOT NULL,
    performance_bonus DECIMAL(5, 2) DEFAULT 0,
    activity_bonus DECIMAL(5, 2) DEFAULT 0,
    total_share DECIMAL(5, 2) NOT NULL,
    calculated_amount DECIMAL(15, 2) NOT NULL,
    payout_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'calculated', -- calculated, pending, paid, failed
    calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payout_date TIMESTAMP,
    payout_reference VARCHAR(100), -- Payment processor reference
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 8. Payments Table
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50), -- credit_card, bank_transfer, paypal
    payment_processor VARCHAR(50), -- stripe, paypal, etc.
    transaction_id VARCHAR(100), -- Processor transaction ID
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
    payment_date TIMESTAMP,
    description TEXT,
    metadata JSONB, -- Additional payment details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 9. Community Posts Table
```sql
CREATE TABLE community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    content TEXT NOT NULL,
    category VARCHAR(50), -- discussion, strategy, question, announcement
    tags JSONB, -- Array of tags
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'published', -- draft, published, archived
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 10. Achievements Table
```sql
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- trade_milestones, profitability, consistency, challenges
    points INTEGER DEFAULT 0,
    icon_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 11. User Achievements Table
```sql
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    evidence JSONB, -- Supporting data for achievement
    UNIQUE(user_id, achievement_id)
);
```

### Indexes for Performance

```sql
-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_tier ON users(account_tier);

-- Trades table indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_trade_date ON trades(trade_date);
CREATE INDEX idx_trades_market ON trades(market);
CREATE INDEX idx_trades_strategy ON trades(strategy);
CREATE INDEX idx_trades_verified ON trades(verified);

-- Challenges table indexes
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_category ON challenges(category);
CREATE INDEX idx_challenges_dates ON challenges(start_date, end_date);

-- Challenge participants indexes
CREATE INDEX idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX idx_challenge_participants_status ON challenge_participants(status);
CREATE INDEX idx_challenge_participants_ranking ON challenge_participants(ranking);

-- Community posts indexes
CREATE INDEX idx_community_posts_user ON community_posts(user_id);
CREATE INDEX idx_community_posts_category ON community_posts(category);
CREATE INDEX idx_community_posts_created ON community_posts(created_at);

-- Payments indexes
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(payment_date);
```

## API Design

### Core API Endpoints

#### User Management
```
POST   /api/v1/users/register          # User registration
POST   /api/v1/users/login             # User login
POST   /api/v1/users/logout            # User logout
GET    /api/v1/users/profile           # Get user profile
PUT    /api/v1/users/profile           # Update user profile
POST   /api/v1/users/password/change   # Change password
POST   /api/v1/users/password/reset    # Reset password
```

#### Trade Management
```
GET    /api/v1/trades                  # List user trades
POST   /api/v1/trades                  # Create new trade
GET    /api/v1/trades/{id}             # Get specific trade
PUT    /api/v1/trades/{id}             # Update trade
DELETE /api/v1/trades/{id}             # Delete trade
POST   /api/v1/trades/bulk             # Bulk import trades
GET    /api/v1/trades/export           # Export trades
```

#### Analytics
```
GET    /api/v1/analytics/performance   # Performance metrics
GET    /api/v1/analytics/risk          # Risk metrics
GET    /api/v1/analytics/strategy      # Strategy performance
GET    /api/v1/analytics/market        # Market condition analysis
GET    /api/v1/analytics/behavioral    # Behavioral insights
```

#### Challenges
```
GET    /api/v1/challenges              # List available challenges
GET    /api/v1/challenges/{id}         # Get challenge details
POST   /api/v1/challenges/{id}/join    # Join challenge
GET    /api/v1/challenges/{id}/leaderboard  # Challenge leaderboard
GET    /api/v1/challenges/participating # User's active challenges
GET    /api/v1/challenges/completed    # User's completed challenges
```

#### Revenue
```
GET    /api/v1/revenue/balance         # Current revenue share balance
GET    /api/v1/revenue/history         # Revenue share history
GET    /api/v1/revenue/projection      # Earnings projection
POST   /api/v1/revenue/payout          # Request payout
GET    /api/v1/revenue/sources         # Revenue source breakdown
```

#### Community
```
GET    /api/v1/community/posts         # List community posts
POST   /api/v1/community/posts         # Create new post
GET    /api/v1/community/posts/{id}    # Get specific post
POST   /api/v1/community/posts/{id}/like  # Like post
POST   /api/v1/community/comments      # Add comment
GET    /api/v1/community/profiles/{id} # Get user profile
GET    /api/v1/community/leaderboard   # Community leaderboard
```

## Security Considerations

### Authentication & Authorization
- JWT tokens for API authentication
- Role-based access control (RBAC)
- OAuth2 integration for social logins
- Session management with Redis
- API rate limiting

### Data Protection
- AES-256 encryption for sensitive data
- HTTPS everywhere
- Database encryption at rest
- Regular security audits
- Penetration testing

### Compliance
- GDPR compliance for EU users
- CCPA compliance for California users
- SOC2 Type II compliance
- Regular compliance audits

## Scalability Considerations

### Horizontal Scaling
- Microservices architecture
- Load balancing with auto-scaling
- Database read replicas
- Caching layer for frequent queries
- CDN for static assets

### Database Optimization
- Connection pooling
- Read replicas for analytics queries
- Partitioning for large tables
- Index optimization
- Query optimization

### Performance Monitoring
- Real-time metrics with Prometheus
- Dashboard with Grafana
- Log aggregation with ELK stack
- Application performance monitoring (APM)
- Automated alerts for anomalies

This technical architecture and database schema provides a solid foundation for the trading journal and challenge platform, ensuring scalability, security, and performance as the user base grows.