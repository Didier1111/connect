// Test setup file
const mongoose = require('mongoose');

// Increase timeout for MongoDB operations during testing
beforeAll(async () => {
  // Set Jest timeout
  jest.setTimeout(30000);

  // Only connect if not already connected
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/task-agents-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
});

// Clean up test data after each test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

// Close database connection after all tests
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
});