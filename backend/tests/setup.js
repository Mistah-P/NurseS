/**
 * Jest Setup File
 * Global test configuration and setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.FIREBASE_PROJECT_ID = 'test-project';

// Global test timeout
jest.setTimeout(10000);

// Console log suppression for cleaner test output
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  // Suppress console logs during tests unless explicitly needed
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Global test helpers
global.testHelpers = {
  createMockAdmin: () => ({
    id: 'test-admin-123',
    userType: 'admin',
    email: 'admin@test.com'
  }),
  
  createMockTeacher: (overrides = {}) => ({
    id: 'test-teacher-123',
    name: 'Test Teacher',
    email: 'teacher@test.com',
    userType: 'teacher',
    isActive: true,
    passwordChanged: false,
    ...overrides
  })
};