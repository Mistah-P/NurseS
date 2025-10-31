/**
 * Test file for Teacher Creation with Random Password and Email Functionality
 * 
 * This test verifies:
 * 1. Random password generation works correctly
 * 2. Teacher account creation with random password
 * 3. Email sending functionality via Firebase Auth
 * 4. Proper data storage without exposing passwords
 * 5. Error handling for email failures
 */

const admin = require('firebase-admin');

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => ({
  auth: () => ({
    createUser: jest.fn(),
    generatePasswordResetLink: jest.fn(),
    deleteUser: jest.fn()
  }),
  firestore: () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(),
        update: jest.fn()
      })),
      where: jest.fn(() => ({
        get: jest.fn()
      }))
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => new Date())
    }
  })
}));

const request = require('supertest');
const express = require('express');

// Import the admin router
const adminRouter = require('../routes/admin');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/admin', adminRouter);

describe('Teacher Creation with Random Password and Email', () => {
  let mockAuth, mockFirestore, mockCollection, mockDoc;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup Firebase mocks
    mockAuth = admin.auth();
    mockFirestore = admin.firestore();
    mockCollection = mockFirestore.collection();
    mockDoc = mockCollection.doc();
    
    // Default successful responses
    mockAuth.createUser.mockResolvedValue({
      uid: 'test-teacher-uid-123',
      email: 'test.teacher@example.com'
    });
    
    mockAuth.generatePasswordResetLink.mockResolvedValue(
      'https://nursescript.uic.edu.ph/__/auth/action?mode=resetPassword&oobCode=test-code'
    );
    
    mockCollection.where.mockReturnValue({
      get: jest.fn().mockResolvedValue({ empty: true })
    });
    
    mockDoc.set.mockResolvedValue();
    
    // Mock admin verification - return admin user data
    mockDoc.get.mockResolvedValue({
      exists: true,
      data: () => ({ 
        userType: 'admin',
        name: 'Test Admin',
        email: 'admin@example.com'
      })
    });
  });

  describe('Random Password Generation', () => {
    test('should generate different passwords on multiple calls', async () => {
      // Make multiple requests to capture generated passwords
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/admin/teachers')
          .send({
            name: `Test Teacher ${i}`,
            email: `test${i}@example.com`,
            adminId: 'test-admin-123'
          });
        
        expect(response.status).toBe(201);
      }
      
      // Verify that createUser was called 5 times with different passwords
      expect(mockAuth.createUser).toHaveBeenCalledTimes(5);
      
      // Extract passwords from createUser calls
      const createUserCalls = mockAuth.createUser.mock.calls;
      const generatedPasswords = createUserCalls.map(call => call[0].password);
      
      // Check that all passwords are different
      const uniquePasswords = new Set(generatedPasswords);
      expect(uniquePasswords.size).toBe(5);
      
      // Check password length (8-12 characters)
      generatedPasswords.forEach(password => {
        expect(password.length).toBeGreaterThanOrEqual(8);
        expect(password.length).toBeLessThanOrEqual(12);
      });
    });

    test('should generate password with required character types', async () => {
      const response = await request(app)
        .post('/api/admin/teachers')
        .send({
          name: 'Test Teacher',
          email: 'test@example.com',
          adminId: 'test-admin-123'
        });
      
      expect(response.status).toBe(201);
      
      // Get the password from the createUser call
      const createUserCall = mockAuth.createUser.mock.calls[0];
      const password = createUserCall[0].password;
      
      // Check for required character types
      expect(password).toMatch(/[a-z]/); // lowercase
      expect(password).toMatch(/[A-Z]/); // uppercase
      expect(password).toMatch(/[0-9]/); // number
      expect(password).toMatch(/[!@#$%^&*]/); // special character
    });
  });

  describe('Teacher Account Creation', () => {
    test('should create teacher account successfully with email notification', async () => {
      const teacherData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        adminId: 'admin-123'
      };

      const response = await request(app)
        .post('/api/admin/teachers')
        .send(teacherData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password reset email sent');
      expect(response.body.data.emailSent).toBe(true);
      expect(response.body.data.email).toBe(teacherData.email);
      expect(response.body.data.name).toBe(teacherData.name);
      
      // Should not include password in response
      expect(response.body.data.tempPassword).toBeUndefined();
      expect(response.body.data.password).toBeUndefined();
    });

    test('should call Firebase Auth createUser with generated password', async () => {
      const teacherData = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        adminId: 'admin-123'
      };

      await request(app)
        .post('/api/admin/teachers')
        .send(teacherData);

      expect(mockAuth.createUser).toHaveBeenCalledWith({
        email: teacherData.email,
        password: expect.any(String),
        displayName: teacherData.name,
        emailVerified: true
      });
    });

    test('should generate password reset link and send email', async () => {
      const teacherData = {
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        adminId: 'admin-123'
      };

      await request(app)
        .post('/api/admin/teachers')
        .send(teacherData);

      expect(mockAuth.generatePasswordResetLink).toHaveBeenCalledWith(
        teacherData.email,
        {
          url: 'https://nursescript.uic.edu.ph/login',
          handleCodeInApp: false
        }
      );
    });

    test('should store teacher data without password in Firestore', async () => {
      const teacherData = {
        name: 'Alice Brown',
        email: 'alice.brown@example.com',
        adminId: 'admin-123'
      };

      await request(app)
        .post('/api/admin/teachers')
        .send(teacherData);

      expect(mockDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: teacherData.name,
          email: teacherData.email,
          emailSent: true,
          passwordChanged: false,
          userType: 'teacher',
          isActive: true,
          createdBy: teacherData.adminId
        })
      );

      // Verify password is NOT stored
      const storedData = mockDoc.set.mock.calls[0][0];
      expect(storedData.tempPassword).toBeUndefined();
      expect(storedData.password).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle Firebase Auth creation failure', async () => {
      mockAuth.createUser.mockRejectedValue(new Error('Auth creation failed'));

      const response = await request(app)
        .post('/api/admin/teachers')
        .send({
          name: 'Test Teacher',
          email: 'test@example.com',
          adminId: 'admin-123'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create authentication account');
    });

    test('should continue operation if email sending fails', async () => {
      mockAuth.generatePasswordResetLink.mockRejectedValue(new Error('Email service unavailable'));

      const response = await request(app)
        .post('/api/admin/teachers')
        .send({
          name: 'Test Teacher',
          email: 'test@example.com',
          adminId: 'admin-123'
        });

      // Should still succeed even if email fails
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      // Should still create the user account
      expect(mockAuth.createUser).toHaveBeenCalled();
      expect(mockDoc.set).toHaveBeenCalled();
    });

    test('should reject duplicate email addresses', async () => {
      // Mock existing teacher
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ 
          empty: false,
          docs: [{ id: 'existing-teacher' }]
        })
      });

      const response = await request(app)
        .post('/api/admin/teachers')
        .send({
          name: 'Test Teacher',
          email: 'existing@example.com',
          adminId: 'admin-123'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Teacher already exists');
    });

    test('should handle non-admin user', async () => {
      // Mock non-admin user
      mockDoc.get.mockResolvedValue({
        exists: true,
        data: () => ({ userType: 'teacher' })
      });

      const response = await request(app)
        .post('/api/admin/teachers')
        .send({
          name: 'Test Teacher',
          email: 'test@example.com',
          adminId: 'non-admin-123'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });

    test('should handle missing admin ID', async () => {
      const response = await request(app)
        .post('/api/admin/teachers')
        .send({
          name: 'Test Teacher',
          email: 'test@example.com'
          // Missing adminId
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Admin ID required');
    });
  });

  describe('Security', () => {
    test('should not expose password in any response', async () => {
      const response = await request(app)
        .post('/api/admin/teachers')
        .send({
          name: 'Security Test',
          email: 'security@example.com',
          adminId: 'admin-123'
        });

      const responseString = JSON.stringify(response.body);
      
      // Check that no password-related fields are in the response
      expect(responseString).not.toMatch(/password/i);
      expect(responseString).not.toMatch(/tempPassword/i);
      expect(responseString).not.toMatch(/temp_password/i);
    });
  });
});

// Integration test helper
describe('Integration Test Helper', () => {
  test('should provide manual testing instructions', () => {
    console.log(`
    🧪 MANUAL TESTING INSTRUCTIONS:
    
    1. Ensure Firebase Console email templates are configured
    2. Start the backend server: npm start
    3. Use the following curl command to test:
    
    curl -X POST http://localhost:3000/api/admin/teachers \\
      -H "Content-Type: application/json" \\
      -d '{
        "name": "Test Teacher",
        "email": "your-test-email@example.com",
        "adminId": "your-admin-id"
      }'
    
    4. Check your email for the password reset link
    5. Verify the teacher account was created in Firebase Console
    6. Test the password reset flow
    
    📧 Expected Email Flow:
    - Teacher receives password reset email
    - Email contains branded template from Firebase
    - Teacher clicks reset link
    - Teacher sets their own permanent password
    - Teacher can login with new password
    `);
    
    expect(true).toBe(true);
  });
});