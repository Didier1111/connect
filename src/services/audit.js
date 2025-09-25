// src/services/audit.js
// Comprehensive Audit Logging and Security Monitoring for Project Connect
// Implements enterprise-grade audit trails and real-time security monitoring

const winston = require('winston');
const crypto = require('crypto');
const { encryptFinancial, generateSecureToken } = require('../utils/encryption');

// Audit Event Types
const AuditEventTypes = {
  // Authentication events
  AUTH_LOGIN_SUCCESS: 'auth.login.success',
  AUTH_LOGIN_FAILURE: 'auth.login.failure',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_TOKEN_REFRESH: 'auth.token.refresh',
  AUTH_PASSWORD_CHANGE: 'auth.password.change',
  AUTH_2FA_ENABLE: 'auth.2fa.enable',
  AUTH_2FA_DISABLE: 'auth.2fa.disable',
  AUTH_2FA_VERIFY_SUCCESS: 'auth.2fa.verify.success',
  AUTH_2FA_VERIFY_FAILURE: 'auth.2fa.verify.failure',

  // User management events
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_ROLE_CHANGE: 'user.role.change',
  USER_PERMISSION_CHANGE: 'user.permission.change',
  USER_SUSPEND: 'user.suspend',
  USER_ACTIVATE: 'user.activate',

  // Financial events (critical)
  PAYMENT_CREATE: 'payment.create',
  PAYMENT_PROCESS: 'payment.process',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILURE: 'payment.failure',
  PAYMENT_REFUND: 'payment.refund',
  PAYMENT_DISPUTE: 'payment.dispute',
  CONTRACT_CREATE: 'contract.create',
  CONTRACT_UPDATE: 'contract.update',
  CONTRACT_EXECUTE: 'contract.execute',
  CONTRACT_CANCEL: 'contract.cancel',

  // Data access events
  DATA_ACCESS: 'data.access',
  DATA_EXPORT: 'data.export',
  DATA_DELETE: 'data.delete',
  DATA_MODIFICATION: 'data.modification',
  PII_ACCESS: 'pii.access',
  FINANCIAL_DATA_ACCESS: 'financial.data.access',

  // Security events
  SECURITY_VIOLATION: 'security.violation',
  RATE_LIMIT_EXCEEDED: 'security.rate_limit.exceeded',
  SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
  ACCOUNT_LOCKOUT: 'security.account.lockout',
  IP_BLOCKED: 'security.ip.blocked',
  FRAUD_DETECTION: 'security.fraud.detection',

  // System events
  SYSTEM_START: 'system.start',
  SYSTEM_STOP: 'system.stop',
  SYSTEM_ERROR: 'system.error',
  CONFIG_CHANGE: 'system.config.change',
  BACKUP_CREATE: 'system.backup.create',
  BACKUP_RESTORE: 'system.backup.restore',

  // API events
  API_ACCESS: 'api.access',
  API_ERROR: 'api.error',
  API_RATE_LIMIT: 'api.rate_limit',
  API_UNAUTHORIZED: 'api.unauthorized'
};

// Audit Risk Levels
const RiskLevels = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Compliance Standards
const ComplianceStandards = {
  GDPR: 'gdpr',
  PCI_DSS: 'pci_dss',
  SOX: 'sox',
  HIPAA: 'hipaa'
};

class AuditLogger {
  constructor() {
    this.initializeLoggers();
    this.alertThresholds = {
      fraudScore: 75,
      failedLogins: 5,
      dataExports: 10,
      criticalEvents: 1
    };
  }

  initializeLoggers() {
    // Audit Logger for compliance and forensics
    this.auditLogger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(info => {
          return JSON.stringify({
            ...info,
            signature: this.generateSignature(info)
          });
        })
      ),
      defaultMeta: { service: 'project-connect-audit' },
      transports: [
        // Separate files for different types of events
        new winston.transports.File({
          filename: 'logs/audit-financial.log',
          level: 'info',
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 10,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        }),
        new winston.transports.File({
          filename: 'logs/audit-security.log',
          level: 'warn',
          maxsize: 50 * 1024 * 1024,
          maxFiles: 10
        }),
        new winston.transports.File({
          filename: 'logs/audit-compliance.log',
          level: 'info',
          maxsize: 50 * 1024 * 1024,
          maxFiles: 10
        }),
        // Console output for development
        ...(process.env.NODE_ENV === 'development' ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          })
        ] : [])
      ]
    });

    // Security Event Logger for real-time monitoring
    this.securityLogger = winston.createLogger({
      level: 'warn',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'logs/security-alerts.log' }),
        // In production, you'd integrate with SIEM systems
        new winston.transports.Console({
          level: 'error',
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  // Generate tamper-proof signature for audit logs
  generateSignature(logEntry) {
    const data = JSON.stringify({
      timestamp: logEntry.timestamp,
      level: logEntry.level,
      message: logEntry.message,
      eventType: logEntry.eventType,
      userId: logEntry.userId
    });

    return crypto
      .createHmac('sha256', process.env.AUDIT_SIGNING_KEY || 'default-key')
      .update(data)
      .digest('hex');
  }

  // Main audit logging method
  async logEvent(eventType, data = {}) {
    const eventId = generateSecureToken();
    const timestamp = new Date().toISOString();

    const auditEntry = {
      eventId,
      timestamp,
      eventType,
      riskLevel: this.calculateRiskLevel(eventType, data),
      compliance: this.getComplianceRequirements(eventType),
      ...data
    };

    // Encrypt sensitive data in audit logs
    if (this.containsSensitiveData(auditEntry)) {
      auditEntry.encryptedData = encryptFinancial(auditEntry.sensitiveData);
      delete auditEntry.sensitiveData;
    }

    // Log to appropriate logger based on event type
    if (this.isSecurityEvent(eventType)) {
      this.securityLogger.warn('Security Event', auditEntry);
      await this.checkSecurityAlerts(auditEntry);
    }

    if (this.isFinancialEvent(eventType)) {
      this.auditLogger.info('Financial Event', auditEntry);
    }

    this.auditLogger.info('Audit Event', auditEntry);

    // Real-time monitoring and alerting
    await this.processRealTimeAnalysis(auditEntry);

    return eventId;
  }

  // Calculate risk level based on event type and context
  calculateRiskLevel(eventType, data) {
    // Critical events
    const criticalEvents = [
      AuditEventTypes.PAYMENT_PROCESS,
      AuditEventTypes.USER_DELETE,
      AuditEventTypes.SYSTEM_CONFIG_CHANGE,
      AuditEventTypes.FRAUD_DETECTION
    ];

    if (criticalEvents.includes(eventType)) {
      return RiskLevels.CRITICAL;
    }

    // High risk events
    const highRiskEvents = [
      AuditEventTypes.AUTH_LOGIN_FAILURE,
      AuditEventTypes.PAYMENT_FAILURE,
      AuditEventTypes.SECURITY_VIOLATION,
      AuditEventTypes.ACCOUNT_LOCKOUT
    ];

    if (highRiskEvents.includes(eventType)) {
      return RiskLevels.HIGH;
    }

    // Check data context for risk elevation
    if (data.fraudScore && data.fraudScore > this.alertThresholds.fraudScore) {
      return RiskLevels.HIGH;
    }

    if (data.amount && data.amount > 1000) {
      return RiskLevels.MEDIUM;
    }

    return RiskLevels.LOW;
  }

  // Determine compliance requirements
  getComplianceRequirements(eventType) {
    const complianceMap = {
      [AuditEventTypes.PAYMENT_CREATE]: [ComplianceStandards.PCI_DSS],
      [AuditEventTypes.PAYMENT_PROCESS]: [ComplianceStandards.PCI_DSS, ComplianceStandards.SOX],
      [AuditEventTypes.PII_ACCESS]: [ComplianceStandards.GDPR],
      [AuditEventTypes.FINANCIAL_DATA_ACCESS]: [ComplianceStandards.PCI_DSS, ComplianceStandards.SOX],
      [AuditEventTypes.DATA_EXPORT]: [ComplianceStandards.GDPR],
      [AuditEventTypes.USER_DELETE]: [ComplianceStandards.GDPR]
    };

    return complianceMap[eventType] || [];
  }

  // Check if event contains sensitive data
  containsSensitiveData(entry) {
    const sensitiveFields = [
      'creditCard', 'ssn', 'bankAccount', 'password',
      'privateKey', 'apiKey', 'personalData'
    ];

    return sensitiveFields.some(field => entry.hasOwnProperty(field));
  }

  // Determine if event is security-related
  isSecurityEvent(eventType) {
    return eventType.includes('security.') ||
           eventType.includes('auth.') ||
           eventType.includes('fraud.');
  }

  // Determine if event is financial
  isFinancialEvent(eventType) {
    return eventType.includes('payment.') ||
           eventType.includes('contract.');
  }

  // Real-time security analysis
  async processRealTimeAnalysis(auditEntry) {
    // Anomaly detection
    if (auditEntry.riskLevel === RiskLevels.CRITICAL) {
      await this.triggerSecurityAlert(auditEntry);
    }

    // Pattern analysis
    await this.analyzePatterns(auditEntry);

    // Compliance monitoring
    await this.checkComplianceViolations(auditEntry);
  }

  // Security alert system
  async triggerSecurityAlert(auditEntry) {
    const alert = {
      alertId: generateSecureToken(),
      timestamp: new Date().toISOString(),
      type: 'SECURITY_ALERT',
      severity: auditEntry.riskLevel,
      eventId: auditEntry.eventId,
      eventType: auditEntry.eventType,
      description: `Critical security event detected: ${auditEntry.eventType}`,
      userId: auditEntry.userId,
      ip: auditEntry.ip,
      userAgent: auditEntry.userAgent
    };

    this.securityLogger.error('SECURITY ALERT', alert);

    // In production, integrate with:
    // - SIEM systems
    // - Slack/Email notifications
    // - Incident response systems
    // - Automated blocking systems

    return alert;
  }

  // Pattern analysis for suspicious behavior
  async analyzePatterns(auditEntry) {
    // Implement behavioral analysis
    // - Multiple failed logins from same IP
    // - Unusual access patterns
    // - Large data exports
    // - Rapid API calls

    if (auditEntry.eventType === AuditEventTypes.AUTH_LOGIN_FAILURE) {
      await this.trackFailedLogins(auditEntry);
    }

    if (auditEntry.eventType === AuditEventTypes.DATA_EXPORT) {
      await this.trackDataExports(auditEntry);
    }
  }

  // Track failed login attempts
  async trackFailedLogins(auditEntry) {
    const key = `failed_logins:${auditEntry.ip}`;
    // In production, use Redis for this tracking

    const attempts = this.getFailedLoginAttempts(auditEntry.ip);
    if (attempts >= this.alertThresholds.failedLogins) {
      await this.triggerSecurityAlert({
        ...auditEntry,
        eventType: AuditEventTypes.SUSPICIOUS_ACTIVITY,
        description: `Multiple failed login attempts from IP: ${auditEntry.ip}`,
        riskLevel: RiskLevels.HIGH
      });
    }
  }

  // Compliance violation detection
  async checkComplianceViolations(auditEntry) {
    for (const standard of auditEntry.compliance) {
      switch (standard) {
        case ComplianceStandards.GDPR:
          await this.checkGDPRCompliance(auditEntry);
          break;
        case ComplianceStandards.PCI_DSS:
          await this.checkPCICompliance(auditEntry);
          break;
      }
    }
  }

  // GDPR compliance checking
  async checkGDPRCompliance(auditEntry) {
    if (auditEntry.eventType === AuditEventTypes.PII_ACCESS) {
      if (!auditEntry.legalBasis || !auditEntry.dataSubjectConsent) {
        await this.logEvent(AuditEventTypes.SECURITY_VIOLATION, {
          violation: 'GDPR',
          description: 'PII accessed without proper legal basis',
          originalEventId: auditEntry.eventId,
          riskLevel: RiskLevels.HIGH
        });
      }
    }
  }

  // PCI DSS compliance checking
  async checkPCICompliance(auditEntry) {
    if (auditEntry.eventType === AuditEventTypes.PAYMENT_PROCESS) {
      if (!auditEntry.encryptedData && auditEntry.containsCardData) {
        await this.logEvent(AuditEventTypes.SECURITY_VIOLATION, {
          violation: 'PCI_DSS',
          description: 'Card data processed without proper encryption',
          originalEventId: auditEntry.eventId,
          riskLevel: RiskLevels.CRITICAL
        });
      }
    }
  }

  // Audit report generation
  async generateAuditReport(filters = {}) {
    // This would query audit logs and generate compliance reports
    const report = {
      reportId: generateSecureToken(),
      generatedAt: new Date().toISOString(),
      filters,
      summary: {
        totalEvents: 0,
        criticalEvents: 0,
        securityViolations: 0,
        complianceIssues: 0
      },
      events: []
    };

    return report;
  }

  // Simplified tracking methods (use Redis in production)
  getFailedLoginAttempts(ip) {
    // Mock implementation - use proper cache in production
    return 0;
  }
}

// Audit middleware for Express
const auditMiddleware = (auditLogger) => {
  return (req, res, next) => {
    // Capture original end method
    const originalEnd = res.end;

    res.end = function(chunk, encoding) {
      // Log API access
      auditLogger.logEvent(AuditEventTypes.API_ACCESS, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        userId: req.user?.userId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        duration: Date.now() - req.startTime,
        requestSize: req.get('Content-Length') || 0,
        responseSize: res.get('Content-Length') || 0
      });

      // Call original end method
      originalEnd.call(this, chunk, encoding);
    };

    req.startTime = Date.now();
    next();
  };
};

module.exports = {
  AuditLogger,
  AuditEventTypes,
  RiskLevels,
  ComplianceStandards,
  auditMiddleware
};