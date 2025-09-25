const express = require('express');
const router = express.Router();
const paypalConfig = require('../config/paypal');

// Create PayPal order
router.post('/create-order', async (req, res) => {
    try {
        const { productKey, customerDetails } = req.body;

        if (!productKey) {
            return res.status(400).json({
                success: false,
                error: 'Product key is required'
            });
        }

        // Verify product exists
        if (!paypalConfig.products[productKey]) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product key'
            });
        }

        const result = await paypalConfig.createOrder(productKey, customerDetails);

        if (result.success) {
            res.json({
                success: true,
                orderID: result.orderID,
                approvalUrl: result.approvalUrl
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('PayPal create order error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Capture PayPal order (complete payment)
router.post('/capture-order', async (req, res) => {
    try {
        const { orderID } = req.body;

        if (!orderID) {
            return res.status(400).json({
                success: false,
                error: 'Order ID is required'
            });
        }

        const result = await paypalConfig.captureOrder(orderID);

        if (result.success) {
            res.json({
                success: true,
                orderID: result.orderID,
                paymentID: result.paymentID,
                customerEmail: result.customerEmail,
                customerName: result.customerName,
                amountPaid: result.amountPaid,
                productKey: result.productKey
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('PayPal capture order error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Payment success page
router.get('/success', async (req, res) => {
    try {
        const { token, PayerID } = req.query;

        if (!token) {
            return res.redirect('/templates-business.html?error=missing_token');
        }

        // Get order details
        const orderDetails = await paypalConfig.getOrderDetails(token);

        if (orderDetails.success && orderDetails.order.status === 'APPROVED') {
            const order = orderDetails.order;
            const purchaseUnit = order.purchase_units[0];
            const product = paypalConfig.products[purchaseUnit.reference_id];

            // Render success page
            const successPageHTML = await generateSuccessPage({
                customerEmail: order.payer?.email_address,
                customerName: `${order.payer?.name?.given_name || ''} ${order.payer?.name?.surname || ''}`.trim(),
                productName: product.name,
                amountPaid: parseFloat(purchaseUnit.amount.value),
                orderID: token
            });

            res.send(successPageHTML);
        } else {
            res.redirect('/templates-business.html?error=payment_failed');
        }

    } catch (error) {
        console.error('PayPal success page error:', error);
        res.redirect('/templates-business.html?error=verification_failed');
    }
});

// PayPal webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const event = req.body;

        // Handle the webhook event
        const result = await paypalConfig.handleWebhook(event);

        if (result.success) {
            res.json({ received: true });
        } else {
            res.status(500).json({ error: result.error });
        }

    } catch (error) {
        console.error('PayPal webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// Get PayPal button configuration for frontend
router.get('/button-config/:productKey', (req, res) => {
    try {
        const { productKey } = req.params;
        const config = paypalConfig.generateButtonConfig(productKey);

        if (config) {
            res.json({
                success: true,
                config
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

    } catch (error) {
        console.error('Button config error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
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

        // Verify order exists and was paid
        const orderDetails = await paypalConfig.getOrderDetails(tokenData.orderID);
        if (!orderDetails.success || orderDetails.order.status !== 'COMPLETED') {
            return res.status(403).json({ error: 'Invalid or unpaid order' });
        }

        // Construct file path
        const path = require('path');
        const fs = require('fs').promises;
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
        .paypal-badge {
            margin-top: 2rem;
            opacity: 0.7;
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
            Thank you for your purchase! Your PayPal payment has been processed successfully and your template is ready for download.
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
                <span class="detail-label">Customer:</span>
                <span class="detail-value">${data.customerName || 'Valued Customer'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">${data.orderID.substring(0, 16)}...</span>
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

        <div class="paypal-badge">
            <p style="font-size: 0.875rem; color: #6b7280;">
                <i class="fab fa-paypal"></i> Secured by PayPal
            </p>
        </div>
    </div>

    <script>
        // Auto-refresh email check reminder after 5 minutes
        setTimeout(() => {
            if (confirm('Haven\\'t received your email yet? Click OK to check your spam folder or contact support.')) {
                window.location.href = 'mailto:support@projectconnect.dev?subject=Template Download Issue&body=Order ID: ${data.orderID}';
            }
        }, 300000); // 5 minutes
    </script>
</body>
</html>
    `;
}

module.exports = router;