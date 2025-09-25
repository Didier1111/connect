const paypal = require('@paypal/checkout-server-sdk');

// PayPal environment setup
const Environment = process.env.NODE_ENV === 'production'
    ? paypal.core.LiveEnvironment
    : paypal.core.SandboxEnvironment;

const paypalClient = new paypal.core.PayPalHttpClient(
    new Environment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
    )
);

const paypalConfig = {
    // Products configuration for website templates
    products: {
        dental_practice_pro: {
            name: 'Dental Practice Pro Template',
            price: 597.00,
            currency: 'USD',
            description: 'Modern dental website with appointment booking, service showcase, and patient testimonials. Includes AI agent integration for lead optimization.',
            category: 'healthcare',
            sku: 'TEMPLATE-DENTAL-001',
            downloadFiles: [
                'dental-practice-template.html',
                'dental-practice-assets.zip',
                'setup-instructions.pdf'
            ],
            features: [
                'Appointment booking system',
                'Patient review integration',
                'Service pricing display',
                'AI-powered lead tracking',
                'Mobile responsive design',
                'SEO optimized'
            ]
        },
        law_firm_authority: {
            name: 'Law Firm Authority Template',
            price: 797.00,
            currency: 'USD',
            description: 'Professional legal website with practice areas, case results, and consultation booking. AI agents optimize client conversion rates.',
            category: 'legal',
            sku: 'TEMPLATE-LEGAL-001',
            downloadFiles: [
                'law-firm-template.html',
                'law-firm-assets.zip',
                'legal-compliance-guide.pdf'
            ],
            features: [
                'Practice area showcase',
                'Attorney profiles',
                'Case result highlights',
                'AI consultation optimizer',
                'Professional credibility design',
                'Lead capture forms'
            ]
        },
        elitestore_pro: {
            name: 'EliteStore Pro E-commerce Template',
            price: 997.00,
            currency: 'USD',
            description: 'Complete e-commerce solution with shopping cart, payments, and inventory management. AI agents maximize conversion and sales.',
            category: 'ecommerce',
            sku: 'TEMPLATE-ECOM-001',
            downloadFiles: [
                'ecommerce-template.html',
                'ecommerce-backend.zip',
                'payment-setup-guide.pdf'
            ],
            features: [
                'Shopping cart system',
                'Payment integration',
                'Product management',
                'AI sales optimization',
                'Inventory tracking',
                'Customer analytics'
            ]
        },
        cloudflow_saas: {
            name: 'CloudFlow SaaS Template',
            price: 897.00,
            currency: 'USD',
            description: 'Modern SaaS landing page with pricing tiers, feature highlights, and trial signup. AI agents optimize trial-to-paid conversion.',
            category: 'saas',
            sku: 'TEMPLATE-SAAS-001',
            downloadFiles: [
                'saas-template.html',
                'saas-dashboard.zip',
                'subscription-integration.pdf'
            ],
            features: [
                'Pricing table builder',
                'Feature comparison',
                'Free trial signup',
                'AI conversion tracking',
                'SaaS-specific design',
                'Subscription management'
            ]
        }
    },

    // Create PayPal order
    createOrder: async (productKey, customerDetails = {}) => {
        try {
            const product = paypalConfig.products[productKey];

            if (!product) {
                throw new Error('Product not found');
            }

            const request = new paypal.orders.OrdersCreateRequest();
            request.prefer("return=representation");
            request.requestBody({
                intent: 'CAPTURE',
                application_context: {
                    brand_name: 'Project Connect Templates',
                    locale: 'en-US',
                    landing_page: 'BILLING',
                    shipping_preference: 'NO_SHIPPING',
                    user_action: 'PAY_NOW',
                    return_url: `${process.env.BASE_URL}/payment/success`,
                    cancel_url: `${process.env.BASE_URL}/templates-business.html?canceled=true`
                },
                purchase_units: [{
                    reference_id: productKey,
                    description: product.description,
                    amount: {
                        currency_code: product.currency,
                        value: product.price.toFixed(2)
                    },
                    items: [{
                        name: product.name,
                        unit_amount: {
                            currency_code: product.currency,
                            value: product.price.toFixed(2)
                        },
                        quantity: '1',
                        description: product.description,
                        sku: product.sku,
                        category: 'DIGITAL_GOODS'
                    }]
                }],
                payment_source: {
                    paypal: {
                        experience_context: {
                            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
                            brand_name: 'Project Connect Templates',
                            locale: 'en-US',
                            landing_page: 'BILLING',
                            shipping_preference: 'NO_SHIPPING',
                            user_action: 'PAY_NOW'
                        }
                    }
                }
            });

            const order = await paypalClient.execute(request);

            return {
                success: true,
                orderID: order.result.id,
                approvalUrl: order.result.links.find(link => link.rel === 'approve').href
            };

        } catch (error) {
            console.error('PayPal create order error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Capture PayPal order (complete payment)
    captureOrder: async (orderID) => {
        try {
            const request = new paypal.orders.OrdersCaptureRequest(orderID);
            request.requestBody({});

            const capture = await paypalClient.execute(request);

            if (capture.result.status === 'COMPLETED') {
                const purchaseUnit = capture.result.purchase_units[0];
                const payment = purchaseUnit.payments.captures[0];

                return {
                    success: true,
                    orderID: capture.result.id,
                    paymentID: payment.id,
                    productKey: purchaseUnit.reference_id,
                    customerEmail: capture.result.payer?.email_address,
                    customerName: `${capture.result.payer?.name?.given_name || ''} ${capture.result.payer?.name?.surname || ''}`.trim(),
                    amountPaid: parseFloat(payment.amount.value),
                    currency: payment.amount.currency_code,
                    paymentTime: payment.create_time
                };
            }

            return {
                success: false,
                error: 'Payment not completed'
            };

        } catch (error) {
            console.error('PayPal capture order error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Verify order details
    getOrderDetails: async (orderID) => {
        try {
            const request = new paypal.orders.OrdersGetRequest(orderID);
            const order = await paypalClient.execute(request);

            return {
                success: true,
                order: order.result
            };

        } catch (error) {
            console.error('PayPal get order error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Handle webhook events
    handleWebhook: async (event) => {
        try {
            switch (event.event_type) {
                case 'PAYMENT.CAPTURE.COMPLETED':
                    const captureEvent = event.resource;
                    console.log('PayPal payment completed:', captureEvent.id);

                    // Trigger template delivery
                    await paypalConfig.triggerTemplateDelivery(captureEvent);
                    break;

                case 'PAYMENT.CAPTURE.DENIED':
                    console.log('PayPal payment denied:', event.resource.id);
                    break;

                default:
                    console.log('Unhandled PayPal webhook event:', event.event_type);
            }

            return { success: true };

        } catch (error) {
            console.error('PayPal webhook handling error:', error);
            return { success: false, error: error.message };
        }
    },

    // Trigger template delivery after successful payment
    triggerTemplateDelivery: async (captureData) => {
        try {
            // Extract order details to get product info
            const orderID = captureData.supplementary_data?.related_ids?.order_id;
            if (!orderID) {
                throw new Error('Order ID not found in capture data');
            }

            const orderDetails = await paypalConfig.getOrderDetails(orderID);
            if (!orderDetails.success) {
                throw new Error('Failed to get order details');
            }

            const purchaseUnit = orderDetails.order.purchase_units[0];
            const productKey = purchaseUnit.reference_id;
            const product = paypalConfig.products[productKey];

            if (!product) {
                throw new Error('Product not found');
            }

            const customerEmail = orderDetails.order.payer?.email_address;
            const customerName = `${orderDetails.order.payer?.name?.given_name || ''} ${orderDetails.order.payer?.name?.surname || ''}`.trim();

            if (!customerEmail) {
                throw new Error('Customer email not found');
            }

            // Create secure download links (expires in 7 days)
            const downloadLinks = await paypalConfig.createSecureDownloadLinks(productKey, orderID);

            // Send delivery email
            const emailService = require('../services/EmailService');
            await emailService.sendTemplateDelivery({
                customerEmail,
                customerName: customerName || 'Valued Customer',
                productName: product.name,
                downloadLinks,
                orderID: orderID,
                amountPaid: captureData.amount.value
            });

            console.log(`Template delivered successfully to ${customerEmail} for product ${productKey}`);

            return { success: true };

        } catch (error) {
            console.error('Template delivery error:', error);
            return { success: false, error: error.message };
        }
    },

    // Create secure download links
    createSecureDownloadLinks: async (productKey, orderID) => {
        const product = paypalConfig.products[productKey];
        const expirationTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

        const links = product.downloadFiles.map(filename => {
            const token = Buffer.from(JSON.stringify({
                file: filename,
                productKey: productKey,
                orderID: orderID,
                expires: expirationTime
            })).toString('base64');

            return {
                filename: filename,
                url: `${process.env.BASE_URL}/download/${token}`,
                description: paypalConfig.getFileDescription(filename)
            };
        });

        return links;
    },

    // Get file description helper
    getFileDescription: (filename) => {
        const descriptions = {
            'dental-practice-template.html': 'Main template file - Upload to your web hosting',
            'dental-practice-assets.zip': 'Images, CSS, and JavaScript files',
            'setup-instructions.pdf': 'Step-by-step setup guide',
            'law-firm-template.html': 'Main template file - Upload to your web hosting',
            'law-firm-assets.zip': 'Images, CSS, and JavaScript files',
            'legal-compliance-guide.pdf': 'Legal industry compliance guide',
            'ecommerce-template.html': 'Main template file - Upload to your web hosting',
            'ecommerce-backend.zip': 'Backend code for shopping cart and payments',
            'payment-setup-guide.pdf': 'Payment processor integration guide',
            'saas-template.html': 'Main template file - Upload to your web hosting',
            'saas-dashboard.zip': 'Admin dashboard and user management',
            'subscription-integration.pdf': 'Subscription billing setup guide'
        };

        return descriptions[filename] || 'Template file';
    },

    // Generate PayPal button configuration for frontend
    generateButtonConfig: (productKey) => {
        const product = paypalConfig.products[productKey];

        if (!product) {
            return null;
        }

        return {
            productKey,
            clientId: process.env.PAYPAL_CLIENT_ID,
            currency: product.currency,
            intent: 'capture',
            createOrderUrl: '/api/payment/paypal/create-order',
            captureOrderUrl: '/api/payment/paypal/capture-order'
        };
    }
};

module.exports = paypalConfig;