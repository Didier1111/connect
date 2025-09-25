// Payment Integration System for Website Template Business
// This file handles Stripe payment processing and template delivery

class WebsiteTemplatePayment {
    constructor() {
        // Initialize Stripe (replace with your actual publishable key)
        this.stripe = Stripe('pk_test_your_stripe_publishable_key_here');
        this.templates = {
            'dental-practice-pro': {
                name: 'Dental Practice Pro',
                price: 597,
                files: ['dental-practice-template.html', 'dental-assets.zip'],
                priceId: 'price_dental_practice_pro' // Stripe Price ID
            },
            'law-firm-authority': {
                name: 'Law Firm Authority',
                price: 797,
                files: ['law-firm-template.html', 'law-assets.zip'],
                priceId: 'price_law_firm_authority'
            },
            'elitestore-pro': {
                name: 'EliteStore Pro',
                price: 997,
                files: ['ecommerce-template.html', 'ecommerce-assets.zip'],
                priceId: 'price_elitestore_pro'
            },
            'cloudflow-saas': {
                name: 'CloudFlow SaaS',
                price: 897,
                files: ['saas-template.html', 'saas-assets.zip'],
                priceId: 'price_cloudflow_saas'
            }
        };
    }

    // Initialize payment for a specific template
    async initiatePayment(templateId, customerInfo) {
        const template = this.templates[templateId];
        if (!template) {
            throw new Error('Template not found');
        }

        try {
            // Create customer in Stripe
            const customer = await this.createStripeCustomer(customerInfo);

            // Create payment session
            const session = await this.createCheckoutSession(template, customer.id);

            // Redirect to Stripe Checkout
            const { error } = await this.stripe.redirectToCheckout({
                sessionId: session.id
            });

            if (error) {
                console.error('Stripe Checkout error:', error);
                throw error;
            }

            return session;

        } catch (error) {
            console.error('Payment initiation failed:', error);
            throw error;
        }
    }

    // Create Stripe customer
    async createStripeCustomer(customerInfo) {
        const response = await fetch('/api/create-customer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: customerInfo.name,
                email: customerInfo.email,
                business: customerInfo.business
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create customer');
        }

        return await response.json();
    }

    // Create Stripe Checkout session
    async createCheckoutSession(template, customerId) {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                priceId: template.priceId,
                customerId: customerId,
                templateId: template.name,
                successUrl: `${window.location.origin}/success?template=${template.name}`,
                cancelUrl: `${window.location.origin}/templates`
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create checkout session');
        }

        return await response.json();
    }

    // Handle successful payment (called on success page)
    async handlePaymentSuccess(sessionId, templateId) {
        try {
            // Verify payment status
            const paymentStatus = await this.verifyPayment(sessionId);

            if (paymentStatus.status === 'paid') {
                // Generate download links
                const downloadLinks = await this.generateDownloadLinks(templateId, sessionId);

                // Send confirmation email
                await this.sendConfirmationEmail(paymentStatus.customer_email, templateId, downloadLinks);

                // Show success message with download links
                this.showSuccessMessage(downloadLinks);
            }

        } catch (error) {
            console.error('Payment processing error:', error);
            this.showErrorMessage('There was an error processing your payment. Please contact support.');
        }
    }

    // Verify payment status with backend
    async verifyPayment(sessionId) {
        const response = await fetch(`/api/verify-payment/${sessionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Payment verification failed');
        }

        return await response.json();
    }

    // Generate secure download links
    async generateDownloadLinks(templateId, sessionId) {
        const response = await fetch('/api/generate-download-links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                templateId: templateId,
                sessionId: sessionId
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate download links');
        }

        return await response.json();
    }

    // Send confirmation email with downloads
    async sendConfirmationEmail(email, templateId, downloadLinks) {
        await fetch('/api/send-confirmation-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                templateId: templateId,
                downloadLinks: downloadLinks
            })
        });
    }

    // Show success message to user
    showSuccessMessage(downloadLinks) {
        const successHtml = `
            <div class="success-message">
                <h2>🎉 Payment Successful!</h2>
                <p>Thank you for your purchase. Your website template is ready for download.</p>
                <div class="download-links">
                    <h3>Download Your Files:</h3>
                    ${downloadLinks.map(link => `
                        <a href="${link.url}" class="download-btn" download>
                            <i class="fas fa-download"></i> ${link.name}
                        </a>
                    `).join('')}
                </div>
                <p class="note">Download links are valid for 7 days. We've also sent them to your email.</p>
            </div>
        `;

        document.getElementById('success-content').innerHTML = successHtml;
    }

    // Show error message
    showErrorMessage(message) {
        const errorHtml = `
            <div class="error-message">
                <h2>❌ Payment Error</h2>
                <p>${message}</p>
                <a href="/templates" class="btn-primary">Back to Templates</a>
            </div>
        `;

        document.getElementById('error-content').innerHTML = errorHtml;
    }
}

// Template Purchase Form Handler
class TemplateOrderForm {
    constructor() {
        this.paymentProcessor = new WebsiteTemplatePayment();
        this.initializeForm();
    }

    initializeForm() {
        // Add event listeners to all buy buttons
        document.querySelectorAll('.btn-buy').forEach(button => {
            button.addEventListener('click', (e) => this.handlePurchaseClick(e));
        });
    }

    async handlePurchaseClick(event) {
        event.preventDefault();

        const templateCard = event.target.closest('.template-card');
        const templateName = templateCard.querySelector('.template-title').textContent;
        const templatePrice = templateCard.querySelector('.price').textContent;

        // Show customer info form
        this.showCustomerForm(templateName, templatePrice, templateCard);
    }

    showCustomerForm(templateName, templatePrice, templateCard) {
        const formHtml = `
            <div class="order-form-overlay">
                <div class="order-form-modal">
                    <div class="form-header">
                        <h3>Complete Your Purchase</h3>
                        <button class="close-form">&times;</button>
                    </div>

                    <div class="order-summary">
                        <h4>${templateName}</h4>
                        <div class="price">${templatePrice}</div>
                    </div>

                    <form id="customer-form">
                        <div class="form-group">
                            <label for="customer-name">Full Name *</label>
                            <input type="text" id="customer-name" name="name" required>
                        </div>

                        <div class="form-group">
                            <label for="customer-email">Email Address *</label>
                            <input type="email" id="customer-email" name="email" required>
                        </div>

                        <div class="form-group">
                            <label for="business-name">Business Name</label>
                            <input type="text" id="business-name" name="business">
                        </div>

                        <div class="form-group">
                            <label for="website-url">Current Website (if any)</label>
                            <input type="url" id="website-url" name="website">
                        </div>

                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="newsletter" name="newsletter">
                                Send me updates about new templates and promotions
                            </label>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-cancel">Cancel</button>
                            <button type="submit" class="btn-purchase">
                                <i class="fas fa-credit-card"></i> Continue to Payment
                            </button>
                        </div>
                    </form>

                    <div class="security-badges">
                        <i class="fas fa-lock"></i> Secure 256-bit SSL encryption
                        <i class="fab fa-stripe"></i> Powered by Stripe
                    </div>
                </div>
            </div>
        `;

        // Add form to page
        document.body.insertAdjacentHTML('beforeend', formHtml);

        // Add form event handlers
        this.setupFormHandlers(templateName);
    }

    setupFormHandlers(templateName) {
        const overlay = document.querySelector('.order-form-overlay');
        const form = document.getElementById('customer-form');
        const closeBtn = document.querySelector('.close-form');
        const cancelBtn = document.querySelector('.btn-cancel');

        // Close form handlers
        [closeBtn, cancelBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                overlay.remove();
            });
        });

        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const customerInfo = {
                name: formData.get('name'),
                email: formData.get('email'),
                business: formData.get('business'),
                website: formData.get('website'),
                newsletter: formData.get('newsletter') === 'on'
            };

            // Show loading state
            const submitBtn = form.querySelector('.btn-purchase');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;

            try {
                // Convert template name to ID
                const templateId = this.getTemplateId(templateName);

                // Process payment
                await this.paymentProcessor.initiatePayment(templateId, customerInfo);

            } catch (error) {
                // Restore button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;

                // Show error
                alert('Payment processing failed. Please try again or contact support.');
                console.error('Payment error:', error);
            }
        });
    }

    getTemplateId(templateName) {
        const nameMap = {
            'Dental Practice Pro': 'dental-practice-pro',
            'Law Firm Authority': 'law-firm-authority',
            'EliteStore Pro': 'elitestore-pro',
            'CloudFlow SaaS': 'cloudflow-saas'
        };

        return nameMap[templateName] || 'unknown';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    new TemplateOrderForm();

    // Handle success page if present
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const templateId = urlParams.get('template');

    if (sessionId && templateId) {
        const paymentProcessor = new WebsiteTemplatePayment();
        paymentProcessor.handlePaymentSuccess(sessionId, templateId);
    }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WebsiteTemplatePayment, TemplateOrderForm };
}