// Test setup file
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Increase timeout for MongoDB operations during testing
beforeAll(async () => {
  // Set Jest timeout
  jest.setTimeout(60000);

  try {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '6.0.4', // Use a stable version
      },
    });

    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    process.env.MONGODB_URI_TEST = mongoUri;
    process.env.NODE_ENV = 'test';

    // Close existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    // Connect to test database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Test MongoDB connected successfully');
  } catch (error) {
    console.error('❌ Test MongoDB connection failed:', error.message);
    throw error;
  }
});

// Clean up test data after each test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      if (collections[key].deleteMany) {
        await collections[key].deleteMany({});
      }
    }
  }
});

// Close database connection and stop MongoDB server after all tests
afterAll(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }

    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log('✅ Test cleanup completed');
  } catch (error) {
    console.error('❌ Test cleanup failed:', error.message);
  }
});