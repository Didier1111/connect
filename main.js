// main.js - Main JavaScript for Project Connect website

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Navbar background change on scroll
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'linear-gradient(135deg, #5a6fd8, #6a4ca3)';
        } else {
            navbar.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
        }
    });
    
    // Animation on scroll
    function animateOnScroll() {
        const elements = document.querySelectorAll('.animate-on-scroll');
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if (elementPosition < screenPosition) {
                element.classList.add('visible');
            }
        });
    }
    
    // Set initial state for animation
    document.querySelectorAll('.animate-on-scroll').forEach(element => {
        element.style.opacity = 0;
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    // Listen for scroll events
    window.addEventListener('scroll', animateOnScroll);
    
    // Trigger once on load
    window.addEventListener('load', animateOnScroll);
    
    // Counter animation
    function animateCounter(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value + (element.id === 'revenueCount' ? 'K+' : '+');
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
    
    // Initialize counters when they come into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                if (id === 'contributorsCount') {
                    animateCounter(entry.target, 0, 200, 2000);
                } else if (id === 'revenueCount') {
                    animateCounter(entry.target, 0, 50, 2000);
                } else if (id === 'challengesCount') {
                    animateCounter(entry.target, 0, 50, 2000);
                }
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    document.querySelectorAll('#contributorsCount, #revenueCount, #challengesCount').forEach(el => {
        observer.observe(el);
    });
    
    // Form submission handler
    function submitForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            // Show loading spinner
            const spinner = document.getElementById('loadingSpinner');
            spinner.style.display = 'block';
            
            // Simulate form submission
            setTimeout(() => {
                spinner.style.display = 'none';
                alert('Form submitted successfully! We\'ll get back to you soon.');
                form.reset();
            }, 1500);
        }
    }
    
    // Mobile menu toggle
    const mobileToggle = document.querySelector('.navbar-toggler');
    const mobileMenu = document.querySelector('.navbar-collapse');
    
    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('show');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideNav = document.querySelector('.navbar').contains(event.target);
        if (!isClickInsideNav && mobileMenu && mobileMenu.classList.contains('show')) {
            mobileMenu.classList.remove('show');
        }
    });
    
    // Theme toggle (if implemented)
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
        });
    }
    
    // Initialize theme from localStorage
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }
});

// Window Load Event
window.addEventListener('load', function() {
    // Hide loading spinner
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
    
    // Initialize any lazy-loaded content
    initializeLazyContent();
});

// Helper Functions

// Lazy content initialization
function initializeLazyContent() {
    // Initialize any dynamically loaded content
    // This could include charts, maps, or other heavy components
    console.log('Lazy content initialized');
}

// Dynamic content loading
function loadContent(url, targetElementId) {
    const targetElement = document.getElementById(targetElementId);
    if (targetElement) {
        // Show loading state
        targetElement.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        
        // Fetch content (in a real implementation)
        fetch(url)
            .then(response => response.text())
            .then(data => {
                targetElement.innerHTML = data;
            })
            .catch(error => {
                targetElement.innerHTML = '<div class="alert alert-danger">Failed to load content</div>';
                console.error('Content load error:', error);
            });
    }
}

// Analytics tracking
function trackEvent(category, action, label) {
    // In a real implementation, this would send data to analytics
    console.log('Event tracked:', category, action, label);
    
    // Example Google Analytics integration:
    // if (typeof gtag !== 'undefined') {
    //     gtag('event', action, {
    //         'event_category': category,
    //         'event_label': label
    //     });
    // }
}

// Error handling
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
    trackEvent('Error', 'Global', event.error.message);
});

// Unhandled promise rejection tracking
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    trackEvent('Error', 'PromiseRejection', event.reason.message);
});

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(function() {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart);
                trackEvent('Performance', 'LoadTime', perfData.loadEventEnd - perfData.loadEventStart);
            }
        }, 0);
    });
}