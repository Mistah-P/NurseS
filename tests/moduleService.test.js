/**
 * Module Service Test Suite
 * 
 * This test file verifies that the module loading fix works correctly
 * for both localhost and production environments.
 * 
 * Tests cover:
 * - Normal module loading from /new module/ directory
 * - Fallback mechanism when files return HTML (production issue)
 * - Error handling for missing modules
 * - Backward compatibility with existing functionality
 */

// Mock fetch for testing different scenarios
global.fetch = jest.fn();

// Import the module service
const moduleService = require('../src/services/moduleService');

describe('Module Service - Production Fix Tests', () => {
  
  beforeEach(() => {
    // Reset fetch mock before each test
    fetch.mockClear();
    
    // Reset module service state
    moduleService.forceRefresh();
  });

  describe('getModuleContentWithDifficulty - Production Fix', () => {
    
    test('should load module content successfully when file exists', async () => {
      // Mock successful response with actual module content
      const mockModuleContent = `Health Assessment Terminologies
This is the content for health assessment terminologies.
It includes various medical terms and definitions.

Fundamentals of Nursing Practice
This section covers basic nursing principles.`;

      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockModuleContent)
      });

      const result = await moduleService.getModuleContentWithDifficulty('Health Assessment terminologies', 'Hard');
      
      expect(result).toContain('This is the content for health assessment terminologies');
      expect(fetch).toHaveBeenCalledWith('/new module/Hard.txt');
    });

    test('should handle HTML response (production routing issue) and use fallback', async () => {
      // Mock HTML response (what happens in production when routing fails)
      const htmlResponse = `<!doctype html><html lang=""><head><meta charset="utf-8">`;
      
      fetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(htmlResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`Health Assessment terminologies
Fallback content from original module files.`)
        });

      const result = await moduleService.getModuleContentWithDifficulty('Health Assessment terminologies', 'Hard');
      
      expect(result).toContain('Fallback content from original module files');
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(1, '/new module/Hard.txt');
      expect(fetch).toHaveBeenNthCalledWith(2, '/module/Health Assessment terminologies.txt');
    });

    test('should handle network errors gracefully', async () => {
      // Mock network error
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        moduleService.getModuleContentWithDifficulty('Health Assessment terminologies', 'Hard')
      ).rejects.toThrow('Failed to load module content for Health Assessment terminologies with difficulty Hard');
    });

    test('should handle case when both primary and fallback fail', async () => {
      // Mock both requests failing
      fetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('<!doctype html>')
        })
        .mockRejectedValueOnce(new Error('Fallback failed'));

      await expect(
        moduleService.getModuleContentWithDifficulty('Health Assessment terminologies', 'Hard')
      ).rejects.toThrow('Failed to load module content for Health Assessment terminologies with difficulty Hard');
    });

    test('should extract correct module section from multi-module file', async () => {
      const multiModuleContent = `Fundamentals of Nursing Practice
Content for fundamentals section.

Health Assessment Terminologies
Content for health assessment section.
This should be extracted.

Pharmacology Basics
Content for pharmacology section.`;

      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(multiModuleContent)
      });

      const result = await moduleService.getModuleContentWithDifficulty('Health Assessment Terminologies', 'Hard');
      
      expect(result).toContain('Content for health assessment section');
      expect(result).toContain('This should be extracted');
      expect(result).not.toContain('Content for fundamentals section');
      expect(result).not.toContain('Content for pharmacology section');
    });
  });

  describe('getModuleContent - Enhanced Error Handling', () => {
    
    test('should load module content successfully', async () => {
      const mockContent = 'Sample module content for testing.';
      
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockContent)
      });

      const result = await moduleService.getModuleContent('Test Module');
      
      expect(result).toBe(mockContent);
      expect(fetch).toHaveBeenCalledWith('/module/Test Module.txt');
    });

    test('should handle HTML response and use sample content fallback', async () => {
      const htmlResponse = '<!doctype html><html>';
      
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(htmlResponse)
      });

      const result = await moduleService.getModuleContent('Fundamentals of Nursing Practice');
      
      // Should return sample content for known modules
      expect(result).toContain('nursing practice');
      expect(result.length).toBeGreaterThan(100); // Sample content should be substantial
    });

    test('should handle network errors and use sample content fallback', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await moduleService.getModuleContent('Fundamentals of Nursing Practice');
      
      // Should return sample content as fallback
      expect(result).toContain('nursing practice');
    });

    test('should throw error for unknown modules when fallback fails', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        moduleService.getModuleContent('Unknown Module That Does Not Exist')
      ).rejects.toThrow('Module content not available for Unknown Module That Does Not Exist');
    });
  });

  describe('Backward Compatibility Tests', () => {
    
    test('should maintain same interface for getModules()', () => {
      const modules = moduleService.getModules();
      expect(Array.isArray(modules)).toBe(true);
      expect(modules.length).toBeGreaterThan(0);
      
      // Check that modules have expected structure
      modules.forEach(module => {
        expect(module).toHaveProperty('label');
        expect(module).toHaveProperty('value');
      });
    });

    test('should maintain same interface for initialize()', async () => {
      // Should not throw error
      await expect(moduleService.initialize()).resolves.not.toThrow();
    });

    test('should maintain same interface for forceRefresh()', () => {
      // Should not throw error
      expect(() => moduleService.forceRefresh()).not.toThrow();
    });
  });

  describe('Production Scenario Simulation', () => {
    
    test('should simulate complete production failure and recovery', async () => {
      // Simulate the exact production scenario from the error log
      const htmlResponse = `<!doctype html><html lang=""><head><meta charset="utf-8">`;
      
      // First call fails with HTML (production routing issue)
      fetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(htmlResponse)
        })
        // Second call (fallback) succeeds
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`Health Assessment terminologies
Medical terminology content here.
Various health assessment terms and definitions.`)
        });

      const result = await moduleService.getModuleContentWithDifficulty('Health Assessment terminologies', 'Hard');
      
      expect(result).toContain('Medical terminology content here');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('should handle timeout scenarios gracefully', async () => {
      // Simulate timeout error
      fetch.mockRejectedValueOnce(new Error('timeout of 10000ms exceeded'));

      await expect(
        moduleService.getModuleContentWithDifficulty('Health Assessment terminologies', 'Hard')
      ).rejects.toThrow('Failed to load module content');
    });
  });

  describe('Edge Cases', () => {
    
    test('should handle empty module content', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('')
      });

      await expect(
        moduleService.getModuleContentWithDifficulty('Empty Module', 'Hard')
      ).rejects.toThrow('Module "Empty Module" not found in Hard.txt');
    });

    test('should handle malformed module files', async () => {
      const malformedContent = 'This is not a properly formatted module file';
      
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(malformedContent)
      });

      await expect(
        moduleService.getModuleContentWithDifficulty('Test Module', 'Hard')
      ).rejects.toThrow('Module "Test Module" not found in Hard.txt');
    });

    test('should handle special characters in module names', async () => {
      const moduleContent = `Health Assessment & Terminologies
Content with special characters in the title.`;

      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(moduleContent)
      });

      const result = await moduleService.getModuleContentWithDifficulty('Health Assessment & Terminologies', 'Hard');
      
      expect(result).toContain('Content with special characters');
    });
  });
});

// Manual test instructions for developers
console.log(`
=== MANUAL TESTING INSTRUCTIONS ===

To manually verify the fix works:

1. LOCAL TESTING:
   - Start the development server: npm run serve
   - Create a room with "Health Assessment terminologies" module
   - Set difficulty to "Hard"
   - Join as a student and verify typing test loads correctly

2. PRODUCTION TESTING:
   - Deploy the updated code to production
   - Verify that /new module/Hard.txt is accessible directly in browser
   - Create a room and test student joining functionality
   - Check browser console for any errors

3. FALLBACK TESTING:
   - Temporarily rename /new module/Hard.txt to simulate production issue
   - Verify that fallback mechanism works
   - Restore the file and test normal operation

4. REGRESSION TESTING:
   - Test other modules (Easy, Normal difficulties)
   - Test teacher-side room creation
   - Test leaderboard functionality
   - Verify no existing functionality is broken

Expected Results:
- Students should successfully join rooms and load typing tests
- No "Module not found" errors in production
- Fallback content loads when primary files are unavailable
- All existing functionality continues to work normally
`);