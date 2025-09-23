// test-server.js
// Simple test script to verify server functionality

const app = require('./server.js');
const supertest = require('supertest');

// Create a test agent
const request = supertest(app);

// Test cases
describe('Project Connect Server Tests', () => {
    // Test homepage
    it('should return homepage with 200 status', async () => {
        const response = await request.get('/');
        expect(response.status).toBe(200);
        expect(response.text).toContain('Project Connect');
    });

    // Test documentation page
    it('should return docs page with 200 status', async () => {
        const response = await request.get('/docs.html');
        expect(response.status).toBe(200);
        expect(response.text).toContain('Documentation');
    });

    // Test contribute page
    it('should return contribute page with 200 status', async () => {
        const response = await request.get('/contribute.html');
        expect(response.status).toBe(200);
        expect(response.text).toContain('Contribute');
    });

    // Test blog page
    it('should return blog page with 200 status', async () => {
        const response = await request.get('/blog.html');
        expect(response.status).toBe(200);
        expect(response.text).toContain('Blog');
    });

    // Test 404 page
    it('should return 404 page for non-existent routes', async () => {
        const response = await request.get('/non-existent-page');
        expect(response.status).toBe(404);
        expect(response.text).toContain('404');
    });
});

console.log('Server tests completed successfully!');