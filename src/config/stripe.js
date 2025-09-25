const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const stripeConfig = {
    // Products configuration for website templates
    products: {
        dental_practice_pro: {
            name: 'Dental Practice Pro Template',
            price: 59700, // $597.00 in cents
            description: 'Modern dental website with appointment booking, service showcase, and patient testimonials. Includes AI agent integration for lead optimization.',
            images: ['https://images.unsplash.com/photo-1606811841689-23dfddce3e95?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
            features: [
                'Appointment booking system',
                'Patient review integration',
                'Service pricing display',
                'AI-powered lead tracking',
                'Mobile responsive design',
                'SEO optimized'
            ],
            category: 'healthcare',
            downloadFiles: [
                'dental-practice-template.html',
                'dental-practice-assets.zip',
                'setup-instructions.pdf'
            ]
        },
        law_firm_authority: {
            name: 'Law Firm Authority Template',
            price: 79700, // $797.00 in cents
            description: 'Professional legal website with practice areas, case results, and consultation booking. AI agents optimize client conversion rates.',
            images: ['https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
            features: [
                'Practice area showcase',
                'Attorney profiles',
                'Case result highlights',
                'AI consultation optimizer',
                'Professional credibility design',
                'Lead capture forms'
            ],
            category: 'legal',
            downloadFiles: [
                'law-firm-template.html',
                'law-firm-assets.zip',
                'legal-compliance-guide.pdf'
            ]
        },
        elitestore_pro: {
            name: 'EliteStore Pro E-commerce Template',
            price: 99700, // $997.00 in cents
            description: 'Complete e-commerce solution with shopping cart, payments, and inventory management. AI agents maximize conversion and sales.',
            images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
            features: [
                'Shopping cart system',
                'Payment integration',
                'Product management',
                'AI sales optimization',
                'Inventory tracking',
                'Customer analytics'
            ],
            category: 'ecommerce',
            downloadFiles: [
                'ecommerce-template.html',
                'ecommerce-backend.zip',
                'payment-setup-guide.pdf'
            ]
        },
        cloudflow_saas: {
            name: 'CloudFlow SaaS Template',
            price: 89700, // $897.00 in cents
            description: 'Modern SaaS landing page with pricing tiers, feature highlights, and trial signup. AI agents optimize trial-to-paid conversion.',
            images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
            features: [
                'Pricing table builder',
                'Feature comparison',
                'Free trial signup',
                'AI conversion tracking',
                'SaaS-specific design',
                'Subscription management'
            ],
            category: 'saas',
            downloadFiles: [
                'saas-template.html',
                'saas-dashboard.zip',
                'subscription-integration.pdf'
            ]
        }
    },

    // Stripe session configuration
    createCheckoutSession: async (productKey, customerEmail = null, successUrl, cancelUrl) => {
        try {
            const product = stripeConfig.products[productKey];

            if (!product) {
                throw new Error('Product not found');
            }

            const sessionData = {
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: product.name,
                            description: product.description,
                            images: product.images,
                            metadata: {
                                category: product.category,
                                product_key: productKey
                            }
                        },
                        unit_amount: product.price,
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    product_key: productKey,
                    category: product.category
                },
                automatic_tax: {
                    enabled: true,
                },
                invoice_creation: {
                    enabled: true,
                },
                shipping_address_collection: {
                    allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'DK', 'NO'],
                },
            };

            // Add customer email if provided
            if (customerEmail) {
                sessionData.customer_email = customerEmail;
            }

            const session = await stripe.checkout.sessions.create(sessionData);

            return {
                success: true,
                sessionId: session.id,
                url: session.url
            };

        } catch (error) {
            console.error('Stripe checkout session error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Verify payment completion
    verifyPayment: async (sessionId) => {
        try {
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            if (session.payment_status === 'paid') {
                return {
                    success: true,
                    session: session,
                    customerEmail: session.customer_details?.email,
                    productKey: session.metadata?.product_key,
                    amountPaid: session.amount_total / 100 // Convert from cents
                };
            }

            return {
                success: false,
                error: 'Payment not completed'
            };

        } catch (error) {
            console.error('Payment verification error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Handle webhook events
    handleWebhook: async (event) => {
        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    const session = event.data.object;
                    console.log('Payment completed:', session.id);

                    // Trigger template delivery
                    await stripeConfig.triggerTemplateDelivery(session);
                    break;

                case 'payment_intent.payment_failed':
                    const failedPayment = event.data.object;
                    console.log('Payment failed:', failedPayment.id);
                    break;

                default:
                    console.log('Unhandled webhook event:', event.type);
            }

            return { success: true };

        } catch (error) {
            console.error('Webhook handling error:', error);
            return { success: false, error: error.message };
        }
    },

    // Trigger template delivery after successful payment
    triggerTemplateDelivery: async (session) => {
        try {
            const productKey = session.metadata?.product_key;
            const customerEmail = session.customer_details?.email;

            if (!productKey || !customerEmail) {
                throw new Error('Missing product key or customer email');
            }

            const product = stripeConfig.products[productKey];

            // Create secure download links (expires in 7 days)
            const downloadLinks = await stripeConfig.createSecureDownloadLinks(productKey, session.id);

            // Send delivery email
            const emailService = require('../services/EmailService');
            await emailService.sendTemplateDelivery({
                customerEmail,
                customerName: session.customer_details?.name || 'Valued Customer',
                productName: product.name,
                downloadLinks,
                sessionId: session.id
            });

            // Log successful delivery
            console.log(`Template delivered successfully to ${customerEmail} for product ${productKey}`);

            return { success: true };

        } catch (error) {
            console.error('Template delivery error:', error);
            return { success: false, error: error.message };
        }
    },

    // Create secure download links
    createSecureDownloadLinks: async (productKey, sessionId) => {
        const product = stripeConfig.products[productKey];
        const expirationTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

        const links = product.downloadFiles.map(filename => {
            const token = Buffer.from(JSON.stringify({
                file: filename,
                productKey: productKey,
                sessionId: sessionId,
                expires: expirationTime
            })).toString('base64');

            return {
                filename: filename,
                url: `${process.env.BASE_URL}/download/${token}`,
                description: stripeConfig.getFileDescription(filename)
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
    }
};

module.exports = stripeConfig;