const express = require('express');
const router = express.Router();
const stripeConfig = require('../config/stripe');
const path = require('path');
const fs = require('fs').promises;

// Create Stripe checkout session
router.post('/create-checkout-session', async (req, res) => {
    try {
        const { productKey, customerEmail } = req.body;

        if (!productKey) {
            return res.status(400).json({
                success: false,
                error: 'Product key is required'
            });
        }

        // Verify product exists
        if (!stripeConfig.products[productKey]) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product key'
            });
        }

        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${baseUrl}/templates-business.html?canceled=true`;

        const result = await stripeConfig.createCheckoutSession(
            productKey,
            customerEmail,
            successUrl,
            cancelUrl
        );

        if (result.success) {
            res.json({
                success: true,
                sessionId: result.sessionId,
                url: result.url
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('Checkout session error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Payment success page
router.get('/success', async (req, res) => {
    try {
        const { session_id } = req.query;

        if (!session_id) {
            return res.redirect('/templates-business.html?error=missing_session');
        }

        // Verify payment
        const verification = await stripeConfig.verifyPayment(session_id);

        if (verification.success) {
            const product = stripeConfig.products[verification.productKey];

            // Render success page
            const successPageHTML = await generateSuccessPage({
                customerEmail: verification.customerEmail,
                productName: product.name,
                amountPaid: verification.amountPaid,
                sessionId: session_id
            });

            res.send(successPageHTML);
        } else {
            res.redirect('/templates-business.html?error=payment_failed');
        }

    } catch (error) {
        console.error('Payment success error:', error);
        res.redirect('/templates-business.html?error=verification_failed');
    }
});

// Stripe webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        let event;

        try {
            event = require('stripe')(process.env.STRIPE_SECRET_KEY).webhooks.constructEvent(req.body, sig, webhookSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle the event
        const result = await stripeConfig.handleWebhook(event);

        if (result.success) {
            res.json({ received: true });
        } else {
            res.status(500).json({ error: result.error });
        }

    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// Secure file download endpoint
router.get('/download/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Decode and validate token
        let tokenData;
        try {
            tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
        } catch (err) {
            return res.status(400).json({ error: 'Invalid download token' });
        }

        // Check expiration
        if (Date.now() > tokenData.expires) {
            return res.status(410).json({ error: 'Download link has expired' });
        }

        // Verify session exists and was paid
        const verification = await stripeConfig.verifyPayment(tokenData.sessionId);
        if (!verification.success) {
            return res.status(403).json({ error: 'Invalid or unpaid session' });
        }

        // Construct file path
        const filePath = path.join(__dirname, '../../downloads', tokenData.productKey, tokenData.file);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (err) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Send file
        res.download(filePath, tokenData.file, (err) => {
            if (err) {
                console.error('File download error:', err);
                res.status(500).json({ error: 'Download failed' });
            }
        });

    } catch (error) {
        console.error('Download endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get product information
router.get('/products', (req, res) => {
    try {
        const products = {};

        // Return public product information (no sensitive data)
        Object.keys(stripeConfig.products).forEach(key => {
            const product = stripeConfig.products[key];
            products[key] = {
                name: product.name,
                price: product.price / 100, // Convert to dollars
                description: product.description,
                features: product.features,
                category: product.category,
                images: product.images
            };
        });

        res.json({
            success: true,
            products
        });

    } catch (error) {
        console.error('Products endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products'
        });
    }
});

// Generate success page HTML
async function generateSuccessPage(data) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Successful - Project Connect Templates</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: #f9fafb;
            color: #374151;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 2rem;
        }
        .success-container {
            background: white;
            border-radius: 1rem;
            padding: 3rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 600px;
            width: 100%;
        }
        .success-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #10b981, #059669);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 2rem;
            font-size: 2rem;
            color: white;
        }
        h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 1rem;
        }
        .success-message {
            font-size: 1.125rem;
            color: #6b7280;
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        .purchase-details {
            background: #f3f4f6;
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin: 2rem 0;
            text-align: left;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
        }
        .detail-label {
            font-weight: 600;
            color: #374151;
        }
        .detail-value {
            color: #6b7280;
        }
        .email-notice {
            background: #dbeafe;
            border: 1px solid #93c5fd;
            border-radius: 0.5rem;
            padding: 1rem;
            margin: 2rem 0;
        }
        .email-notice h3 {
            color: #1e40af;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        .email-notice p {
            color: #1e40af;
            font-size: 0.875rem;
        }
        .action-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 2rem;
        }
        .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }
        .btn-primary {
            background: #2563eb;
            color: white;
        }
        .btn-primary:hover {
            background: #1d4ed8;
            transform: translateY(-2px);
        }
        .btn-secondary {
            background: #e5e7eb;
            color: #374151;
        }
        .btn-secondary:hover {
            background: #d1d5db;
        }
        @media (max-width: 640px) {
            .success-container { padding: 2rem; }
            .action-buttons { flex-direction: column; }
            .detail-row { flex-direction: column; gap: 0.25rem; }
        }
    </style>
</head>
<body>
    <div class="success-container">
        <div class="success-icon">
            <i class="fas fa-check"></i>
        </div>

        <h1>Payment Successful!</h1>

        <p class="success-message">
            Thank you for your purchase! Your payment has been processed successfully and your template is ready for download.
        </p>

        <div class="purchase-details">
            <div class="detail-row">
                <span class="detail-label">Product:</span>
                <span class="detail-value">${data.productName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Amount Paid:</span>
                <span class="detail-value">$${data.amountPaid.toFixed(2)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${data.customerEmail}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">${data.sessionId.substring(0, 16)}...</span>
            </div>
        </div>

        <div class="email-notice">
            <h3><i class="fas fa-envelope"></i> Check Your Email!</h3>
            <p>
                We've sent download links and setup instructions to <strong>${data.customerEmail}</strong>.
                The email should arrive within 5 minutes. Don't forget to check your spam folder!
            </p>
        </div>

        <div class="action-buttons">
            <a href="templates-business.html" class="btn btn-secondary">
                <i class="fas fa-arrow-left"></i>
                Browse More Templates
            </a>
            <a href="index.html" class="btn btn-primary">
                <i class="fas fa-home"></i>
                Back to Project Connect
            </a>
        </div>
    </div>

    <script>
        // Auto-refresh email check reminder after 5 minutes
        setTimeout(() => {
            if (confirm('Haven\\'t received your email yet? Click OK to check your spam folder or contact support.')) {
                window.location.href = 'mailto:support@projectconnect.dev?subject=Template Download Issue&body=Order ID: ${data.sessionId}';
            }
        }, 300000); // 5 minutes
    </script>
</body>
</html>
    `;
}

module.exports = router;