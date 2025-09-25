// Backend Server for Website Template Business
// Handles Stripe payments, file delivery, and email notifications

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Email transporter setup (configure with your SMTP details)
const emailTransporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Template configurations
const TEMPLATES = {
    'dental-practice-pro': {
        name: 'Dental Practice Pro',
        price: 59700, // Price in cents ($597.00)
        files: ['dental-practice-template.html', 'dental-assets.zip'],
        description: 'Modern dental website with appointment booking and patient testimonials'
    },
    'law-firm-authority': {
        name: 'Law Firm Authority',
        price: 79700, // Price in cents ($797.00)
        files: ['law-firm-template.html', 'law-assets.zip'],
        description: 'Professional legal website with practice areas and consultation booking'
    },
    'elitestore-pro': {
        name: 'EliteStore Pro',
        price: 99700, // Price in cents ($997.00)
        files: ['ecommerce-template.html', 'ecommerce-assets.zip'],
        description: 'Complete e-commerce solution with shopping cart and payments'
    },
    'cloudflow-saas': {
        name: 'CloudFlow SaaS',
        price: 89700, // Price in cents ($897.00)
        files: ['saas-template.html', 'saas-assets.zip'],
        description: 'Modern SaaS landing page with pricing tiers and trial signup'
    }
};

// Create Stripe customer
app.post('/api/create-customer', async (req, res) => {
    try {
        const { name, email, business } = req.body;

        // Check if customer already exists
        const existingCustomers = await stripe.customers.list({
            email: email,
            limit: 1
        });

        let customer;
        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
        } else {
            customer = await stripe.customers.create({
                name: name,
                email: email,
                metadata: {
                    business: business || ''
                }
            });
        }

        res.json({ id: customer.id, email: customer.email });

    } catch (error) {
        console.error('Create customer error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Create Stripe Checkout session
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { priceId, customerId, templateId, successUrl, cancelUrl } = req.body;

        // Find template by ID
        const template = Object.entries(TEMPLATES).find(([key, value]) =>
            key === templateId.toLowerCase().replace(/\s+/g, '-')
        );

        if (!template) {
            return res.status(400).json({ error: 'Template not found' });
        }

        const [templateKey, templateData] = template;

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: templateData.name,
                        description: templateData.description,
                        images: [`https://your-domain.com/images/${templateKey}-preview.jpg`]
                    },
                    unit_amount: templateData.price,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl,
            metadata: {
                template_id: templateKey,
                template_name: templateData.name
            }
        });

        res.json({ id: session.id });

    } catch (error) {
        console.error('Create checkout session error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Verify payment status
app.get('/api/verify-payment/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            res.json({
                status: 'paid',
                customer_email: session.customer_details.email,
                template_id: session.metadata.template_id,
                template_name: session.metadata.template_name,
                amount_total: session.amount_total
            });
        } else {
            res.json({
                status: session.payment_status,
                customer_email: session.customer_details?.email
            });
        }

    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Generate secure download links
app.post('/api/generate-download-links', async (req, res) => {
    try {
        const { templateId, sessionId } = req.body;

        // Verify the session is paid
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status !== 'paid') {
            return res.status(403).json({ error: 'Payment not completed' });
        }

        const template = TEMPLATES[templateId];
        if (!template) {
            return res.status(400).json({ error: 'Template not found' });
        }

        // Generate secure download tokens
        const downloadLinks = template.files.map(file => {
            const token = crypto.randomBytes(32).toString('hex');
            const expiry = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

            // Store token in database/cache (simplified - use Redis in production)
            storeDownloadToken(token, {
                file: file,
                sessionId: sessionId,
                expiry: expiry
            });

            return {
                name: file,
                url: `${req.protocol}://${req.get('host')}/api/download/${token}`,
                expires: new Date(expiry).toISOString()
            };
        });

        res.json(downloadLinks);

    } catch (error) {
        console.error('Generate download links error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Secure file download endpoint
app.get('/api/download/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Retrieve token info (simplified - use proper database in production)
        const tokenInfo = getDownloadToken(token);
        if (!tokenInfo) {
            return res.status(404).json({ error: 'Download link not found or expired' });
        }

        if (Date.now() > tokenInfo.expiry) {
            return res.status(403).json({ error: 'Download link has expired' });
        }

        // Path to the actual file
        const filePath = path.join(__dirname, 'templates', tokenInfo.file);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (error) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Send file
        res.download(filePath, tokenInfo.file, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({ error: 'Download failed' });
            }
        });

    } catch (error) {
        console.error('Download error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Send confirmation email
app.post('/api/send-confirmation-email', async (req, res) => {
    try {
        const { email, templateId, downloadLinks } = req.body;

        const template = TEMPLATES[templateId];
        if (!template) {
            return res.status(400).json({ error: 'Template not found' });
        }

        const emailHtml = generateConfirmationEmail(template, downloadLinks);

        await emailTransporter.sendMail({
            from: process.env.FROM_EMAIL || 'noreply@websitepro.com',
            to: email,
            subject: `Your ${template.name} Template is Ready!`,
            html: emailHtml
        });

        res.json({ success: true });

    } catch (error) {
        console.error('Send email error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Webhook to handle Stripe events
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            handleSuccessfulPayment(event.data.object);
            break;
        case 'payment_intent.payment_failed':
            handleFailedPayment(event.data.object);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

// Helper functions

// Simplified token storage (use Redis or database in production)
const downloadTokens = new Map();

function storeDownloadToken(token, data) {
    downloadTokens.set(token, data);

    // Clean up expired tokens
    setTimeout(() => {
        downloadTokens.delete(token);
    }, data.expiry - Date.now());
}

function getDownloadToken(token) {
    return downloadTokens.get(token);
}

// Generate confirmation email HTML
function generateConfirmationEmail(template, downloadLinks) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .download-section { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; }
                .download-button {
                    display: inline-block;
                    background: #10b981;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 5px;
                }
                .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎉 Your Website Template is Ready!</h1>
            </div>

            <div class="content">
                <h2>Thank you for your purchase!</h2>
                <p>Your <strong>${template.name}</strong> template has been processed and is ready for download.</p>

                <div class="download-section">
                    <h3>Download Your Files:</h3>
                    ${downloadLinks.map(link =>
                        `<a href="${link.url}" class="download-button">📁 ${link.name}</a>`
                    ).join('')}

                    <p><strong>Important:</strong> Download links expire on ${new Date(downloadLinks[0].expires).toLocaleDateString()}.</p>
                </div>

                <h3>What's Included:</h3>
                <ul>
                    <li>✅ Complete HTML template</li>
                    <li>✅ CSS stylesheets</li>
                    <li>✅ JavaScript functionality</li>
                    <li>✅ Image assets and icons</li>
                    <li>✅ Setup documentation</li>
                    <li>✅ 30 days of email support</li>
                </ul>

                <h3>Need Help?</h3>
                <p>If you have any questions or need assistance customizing your template, simply reply to this email. We're here to help!</p>
            </div>

            <div class="footer">
                <p>Thank you for choosing WebsitePro!</p>
                <p>© 2024 WebsitePro. All rights reserved.</p>
            </div>
        </body>
        </html>
    `;
}

// Handle successful payment
async function handleSuccessfulPayment(session) {
    console.log('Payment successful:', session.id);

    // You can add additional logic here:
    // - Update database
    // - Send analytics events
    // - Trigger marketing automation
    // - etc.
}

// Handle failed payment
async function handleFailedPayment(paymentIntent) {
    console.log('Payment failed:', paymentIntent.id);

    // Handle failed payment logic:
    // - Send follow-up email
    // - Log for analysis
    // - etc.
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Website Template Business Server running on port ${PORT}`);
    console.log(`💳 Stripe configured: ${process.env.STRIPE_SECRET_KEY ? 'Yes' : 'No'}`);
    console.log(`📧 Email configured: ${process.env.SMTP_USER ? 'Yes' : 'No'}`);
});

module.exports = app;