// src/services/payment.js
// Secure Payment Processing Service for Project Connect
// Implements enterprise-grade payment security with fraud detection and compliance

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const { securityLogger } = require('../middleware/security');
const { encryptFinancial, decryptFinancial, generateSecureToken } = require('../utils/encryption');

// Payment validation and fraud detection
class PaymentSecurity {
  constructor() {
    this.fraudScoreThreshold = 75;
    this.maxDailyAmount = 10000; // $10,000 USD
    this.maxTransactionAmount = 5000; // $5,000 USD
    this.suspiciousPatterns = new Map();
  }

  // Fraud detection algorithm
  calculateFraudScore(paymentData, userHistory = {}) {
    let score = 0;

    // Check amount patterns
    if (paymentData.amount > this.maxTransactionAmount) {
      score += 30;
    }

    // Check frequency patterns
    const recentTransactions = userHistory.recentTransactions || [];
    const last24Hours = recentTransactions.filter(t =>
      Date.now() - new Date(t.createdAt).getTime() < 24 * 60 * 60 * 1000
    );

    const dailyTotal = last24Hours.reduce((sum, t) => sum + t.amount, 0);
    if (dailyTotal > this.maxDailyAmount) {
      score += 40;
    }

    // Velocity checks
    const lastHour = recentTransactions.filter(t =>
      Date.now() - new Date(t.createdAt).getTime() < 60 * 60 * 1000
    );

    if (lastHour.length > 5) {
      score += 25;
    }

    // Geographic anomaly detection
    if (paymentData.ipCountry && userHistory.usualCountry &&
        paymentData.ipCountry !== userHistory.usualCountry) {
      score += 15;
    }

    // Device fingerprint anomalies
    if (paymentData.deviceFingerprint && userHistory.knownDevices &&
        !userHistory.knownDevices.includes(paymentData.deviceFingerprint)) {
      score += 10;
    }

    // Time-based anomalies (unusual hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  // Payment method validation
  validatePaymentMethod(paymentMethod) {
    const validMethods = ['credit_card', 'paypal', 'bank_transfer', 'cryptocurrency'];

    if (!validMethods.includes(paymentMethod)) {
      throw new Error('Invalid payment method');
    }

    // Additional validation based on method
    switch (paymentMethod) {
      case 'cryptocurrency':
        // Crypto payments require additional compliance checks
        return { requiresKYC: true, additionalVerification: true };
      case 'bank_transfer':
        // Bank transfers require account verification
        return { requiresAccountVerification: true };
      default:
        return { requiresKYC: false };
    }
  }

  // PCI DSS compliance checks
  validatePCICompliance(request) {
    const requiredHeaders = [
      'content-type',
      'user-agent',
      'accept'
    ];

    for (const header of requiredHeaders) {
      if (!request.headers[header]) {
        throw new Error(`Missing required header: ${header}`);
      }
    }

    // Ensure HTTPS
    if (request.protocol !== 'https' && process.env.NODE_ENV === 'production') {
      throw new Error('HTTPS required for payment processing');
    }

    return true;
  }
}

class SecurePaymentProcessor {
  constructor() {
    this.security = new PaymentSecurity();
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  }

  // Create secure payment intent
  async createPaymentIntent(paymentData, user, metadata = {}) {
    try {
      // Input validation
      await this.validatePaymentData(paymentData);

      // Fraud detection
      const fraudScore = this.security.calculateFraudScore(paymentData, user.paymentHistory);

      if (fraudScore > this.security.fraudScoreThreshold) {
        securityLogger.warn('High fraud score detected', {
          userId: user._id,
          fraudScore,
          paymentAmount: paymentData.amount,
          paymentMethod: paymentData.method
        });

        // Require manual review for high-risk transactions
        return {
          status: 'requires_review',
          fraudScore,
          reviewRequired: true
        };
      }

      // Create Stripe payment intent with enhanced security
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(paymentData.amount * 100), // Convert to cents
        currency: paymentData.currency || 'usd',
        payment_method_types: this.getStripePaymentMethods(paymentData.method),
        metadata: {
          userId: user._id,
          contractId: paymentData.contractId,
          fraudScore: fraudScore.toString(),
          ...metadata
        },
        receipt_email: user.email,
        setup_future_usage: 'off_session', // Enable saved payment methods
        confirmation_method: 'automatic',
        capture_method: 'automatic'
      });

      // Log payment initiation
      securityLogger.info('Payment intent created', {
        paymentIntentId: paymentIntent.id,
        userId: user._id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        fraudScore
      });

      // Store encrypted payment record
      const paymentRecord = await this.createPaymentRecord({
        stripePaymentIntentId: paymentIntent.id,
        userId: user._id,
        contractId: paymentData.contractId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        method: paymentData.method,
        status: 'pending',
        fraudScore,
        metadata: encryptFinancial(metadata)
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        paymentRecordId: paymentRecord._id,
        status: 'requires_payment_method',
        fraudScore
      };

    } catch (error) {
      securityLogger.error('Payment intent creation failed', {
        error: error.message,
        userId: user._id,
        paymentData: this.sanitizePaymentData(paymentData)
      });
      throw error;
    }
  }

  // Process payment confirmation
  async confirmPayment(paymentIntentId, user) {
    try {
      // Retrieve and confirm payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.metadata.userId !== user._id) {
        throw new Error('Payment intent does not belong to user');
      }

      // Update payment record
      const paymentRecord = await this.updatePaymentRecord(
        paymentIntent.metadata.contractId,
        paymentIntentId,
        {
          status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
          processedAt: new Date(),
          stripeChargeId: paymentIntent.charges?.data[0]?.id
        }
      );

      securityLogger.info('Payment confirmed', {
        paymentIntentId,
        userId: user._id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100
      });

      return {
        status: paymentIntent.status,
        paymentMethod: paymentIntent.payment_method,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        paymentRecordId: paymentRecord._id
      };

    } catch (error) {
      securityLogger.error('Payment confirmation failed', {
        error: error.message,
        paymentIntentId,
        userId: user._id
      });
      throw error;
    }
  }

  // Handle Stripe webhooks securely
  async handleWebhook(rawBody, signature, req) {
    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (err) {
      securityLogger.error('Webhook signature verification failed', {
        error: err.message,
        signature
      });
      throw new Error('Webhook signature verification failed');
    }

    // Process webhook event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      case 'payment_method.attached':
        await this.handlePaymentMethodAttached(event.data.object);
        break;
      default:
        securityLogger.info('Unhandled webhook event', { type: event.type });
    }

    return { received: true };
  }

  // Secure refund processing
  async processRefund(paymentIntentId, amount, reason, user) {
    try {
      // Validate refund request
      const paymentRecord = await this.getPaymentRecord(paymentIntentId);

      if (paymentRecord.userId !== user._id && !user.permissions.includes('payments:process')) {
        throw new Error('Not authorized to refund this payment');
      }

      if (paymentRecord.status !== 'completed') {
        throw new Error('Cannot refund incomplete payment');
      }

      // Process refund with Stripe
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason || 'requested_by_customer',
        metadata: {
          userId: user._id,
          originalPaymentId: paymentIntentId
        }
      });

      // Update payment record
      await this.updatePaymentRecord(paymentRecord.contractId, paymentIntentId, {
        status: refund.status === 'succeeded' ? 'refunded' : 'refund_pending',
        refundId: refund.id,
        refundAmount: refund.amount / 100,
        refundReason: reason
      });

      securityLogger.info('Refund processed', {
        refundId: refund.id,
        paymentIntentId,
        amount: refund.amount / 100,
        reason,
        userId: user._id
      });

      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100,
        reason: refund.reason
      };

    } catch (error) {
      securityLogger.error('Refund processing failed', {
        error: error.message,
        paymentIntentId,
        amount,
        userId: user._id
      });
      throw error;
    }
  }

  // Payment data validation
  async validatePaymentData(paymentData) {
    if (!paymentData.amount || paymentData.amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    if (paymentData.amount > this.security.maxTransactionAmount) {
      throw new Error(`Amount exceeds maximum transaction limit of $${this.security.maxTransactionAmount}`);
    }

    if (!paymentData.contractId) {
      throw new Error('Contract ID is required');
    }

    const validationResult = this.security.validatePaymentMethod(paymentData.method);
    return validationResult;
  }

  // Convert payment methods to Stripe format
  getStripePaymentMethods(method) {
    const methodMap = {
      'credit_card': ['card'],
      'bank_transfer': ['ach_debit'],
      'paypal': ['paypal'],
      'cryptocurrency': ['crypto'] // If supported by Stripe
    };

    return methodMap[method] || ['card'];
  }

  // Sanitize payment data for logging
  sanitizePaymentData(data) {
    const sanitized = { ...data };
    delete sanitized.paymentMethod;
    delete sanitized.cardDetails;
    delete sanitized.bankDetails;
    return sanitized;
  }

  // Webhook event handlers
  async handlePaymentSucceeded(paymentIntent) {
    securityLogger.info('Payment succeeded webhook', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100
    });

    // Update payment record and trigger business logic
    // This would typically update contract status, send notifications, etc.
  }

  async handlePaymentFailed(paymentIntent) {
    securityLogger.warn('Payment failed webhook', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      failureReason: paymentIntent.last_payment_error?.message
    });

    // Handle failed payment logic
  }

  async handlePaymentMethodAttached(paymentMethod) {
    securityLogger.info('Payment method attached', {
      paymentMethodId: paymentMethod.id,
      type: paymentMethod.type
    });

    // Store encrypted payment method information
  }

  // Database operations (simplified - would use actual models)
  async createPaymentRecord(data) {
    // This would use your Payment model
    return { _id: generateSecureToken(), ...data };
  }

  async updatePaymentRecord(contractId, paymentIntentId, updates) {
    // This would update the actual payment record
    return { updated: true };
  }

  async getPaymentRecord(paymentIntentId) {
    // This would fetch the payment record
    return { paymentIntentId, status: 'completed', userId: 'mock-user-id' };
  }
}

// PCI DSS compliance utilities
const pciCompliance = {
  // Tokenize sensitive card data
  tokenizeCardData: async (cardData) => {
    // In production, this would use a proper tokenization service
    const token = generateSecureToken();

    // Store mapping securely (encrypted)
    // Never store actual card data

    return token;
  },

  // Validate PCI environment
  validateEnvironment: () => {
    const requiredEnvVars = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'MASTER_ENCRYPTION_KEY'
    ];

    const missing = requiredEnvVars.filter(var => !process.env[var]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (process.env.NODE_ENV === 'production' && !process.env.HTTPS_ENABLED) {
      throw new Error('HTTPS is required in production for PCI compliance');
    }

    return true;
  },

  // Audit logging for PCI compliance
  auditPaymentAction: (action, userId, data = {}) => {
    securityLogger.info('Payment audit log', {
      action,
      userId,
      timestamp: new Date().toISOString(),
      data: data,
      compliance: 'PCI-DSS'
    });
  }
};

module.exports = {
  SecurePaymentProcessor,
  PaymentSecurity,
  pciCompliance
};