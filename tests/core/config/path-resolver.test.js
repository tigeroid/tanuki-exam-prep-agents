const path = require('path');
const os = require('os');
const fs = require('fs');
const {
  resolveResourcePath,
  resolveResourcePaths,
  resourceExists,
  getResourceConfig,
  resolveVariables,
  resolveTilde,
  getResourceBaseDir
} = require('../../../src/core/config/path-resolver');

describe('Path Resolver', () => {
  const originalEnv = process.env.EXAM_PREP_RESOURCES;

  afterEach(() => {
    // Restore original environment
    if (originalEnv) {
      process.env.EXAM_PREP_RESOURCES = originalEnv;
    } else {
      delete process.env.EXAM_PREP_RESOURCES;
    }
  });

  describe('resolveVariables', () => {
    it('should resolve ${EXAM_PREP_RESOURCES} variable', () => {
      // Use a directory that actually exists for testing
      const testDir = path.join(__dirname, '../..');
      process.env.EXAM_PREP_RESOURCES = testDir;
      const result = resolveVariables('${EXAM_PREP_RESOURCES}/file.pdf');
      expect(result).toBe(path.join(testDir, 'file.pdf'));
    });

    it('should resolve other environment variables', () => {
      process.env.MY_VAR = '/custom/path';
      const result = resolveVariables('${MY_VAR}/file.txt');
      expect(result).toBe('/custom/path/file.txt');
      delete process.env.MY_VAR;
    });

    it('should handle multiple variables in one path', () => {
      process.env.BASE = '/base';
      process.env.SUB = 'sub';
      const result = resolveVariables('${BASE}/${SUB}/file.txt');
      expect(result).toBe('/base/sub/file.txt');
      delete process.env.BASE;
      delete process.env.SUB;
    });

    it('should leave unresolved variables unchanged', () => {
      const result = resolveVariables('${NONEXISTENT_VAR}/file.txt');
      expect(result).toBe('${NONEXISTENT_VAR}/file.txt');
    });

    it('should handle null or undefined input', () => {
      expect(resolveVariables(null)).toBe(null);
      expect(resolveVariables(undefined)).toBe(undefined);
    });

    it('should handle paths without variables', () => {
      const result = resolveVariables('/absolute/path/file.txt');
      expect(result).toBe('/absolute/path/file.txt');
    });
  });

  describe('resolveTilde', () => {
    it('should expand ~ to home directory', () => {
      const result = resolveTilde('~/Documents/file.txt');
      expect(result).toBe(path.join(os.homedir(), 'Documents/file.txt'));
    });

    it('should expand bare ~ to home directory', () => {
      const result = resolveTilde('~');
      expect(result).toBe(os.homedir());
    });

    it('should not modify paths without tilde', () => {
      const result = resolveTilde('/absolute/path/file.txt');
      expect(result).toBe('/absolute/path/file.txt');
    });

    it('should handle null or undefined input', () => {
      expect(resolveTilde(null)).toBe(null);
      expect(resolveTilde(undefined)).toBe(undefined);
    });
  });

  describe('getResourceBaseDir', () => {
    it('should return environment variable path if set and exists', () => {
      const testDir = path.join(__dirname, '../../fixtures');
      process.env.EXAM_PREP_RESOURCES = testDir;
      const result = getResourceBaseDir();
      expect(result).toBe(testDir);
    });

    it('should return null if environment variable set but directory does not exist', () => {
      process.env.EXAM_PREP_RESOURCES = '/nonexistent/path/that/does/not/exist';
      const result = getResourceBaseDir();
      expect(result).toBeNull();
    });

    it('should check default locations if environment variable not set', () => {
      delete process.env.EXAM_PREP_RESOURCES;
      const result = getResourceBaseDir();
      // Result could be null or one of the default locations if they exist
      // Just verify it's a string or null
      expect(typeof result === 'string' || result === null).toBe(true);
    });
  });

  describe('resolveResourcePath', () => {
    it('should resolve absolute paths directly', () => {
      const absPath = '/absolute/path/to/file.pdf';
      const result = resolveResourcePath(absPath, { checkExists: false });
      expect(result).toBe(absPath);
    });

    it('should resolve relative paths from current directory', () => {
      const relPath = './relative/file.pdf';
      const result = resolveResourcePath(relPath, { checkExists: false });
      expect(result).toBe(path.resolve(process.cwd(), relPath));
    });

    it('should resolve environment variable paths', () => {
      const testDir = path.join(__dirname, '../../fixtures');
      process.env.EXAM_PREP_RESOURCES = testDir;
      const result = resolveResourcePath('${EXAM_PREP_RESOURCES}/test.pdf', { checkExists: false });
      expect(result).toBe(path.join(testDir, 'test.pdf'));
    });

    it('should resolve tilde paths', () => {
      const result = resolveResourcePath('~/Documents/file.pdf', { checkExists: false });
      expect(result).toBe(path.join(os.homedir(), 'Documents/file.pdf'));
    });

    it('should return null for invalid input', () => {
      expect(resolveResourcePath(null)).toBeNull();
      expect(resolveResourcePath(undefined)).toBeNull();
      expect(resolveResourcePath('')).toBeNull();
    });

    it('should handle filename-only paths with base directory', () => {
      const testDir = path.join(__dirname, '../../fixtures');
      process.env.EXAM_PREP_RESOURCES = testDir;
      const result = resolveResourcePath('file.pdf', { checkExists: false });
      expect(result).toBe(path.join(testDir, 'file.pdf'));
    });

    it('should return null for filename-only paths without base directory', () => {
      delete process.env.EXAM_PREP_RESOURCES;
      // Mock fs.existsSync to ensure no default locations exist
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn().mockReturnValue(false);

      const result = resolveResourcePath('file.pdf', { warnIfMissing: false });
      expect(result).toBeNull();

      fs.existsSync = originalExistsSync;
    });

    it('should check file existence when checkExists is true', () => {
      // Use a file that actually exists
      const testFile = path.join(__dirname, '../../../package.json');
      const result = resolveResourcePath(testFile, { checkExists: true });
      expect(result).toBe(testFile);
    });

    it('should return null when file does not exist and checkExists is true', () => {
      const nonexistentFile = '/absolutely/nonexistent/file/path.pdf';
      const result = resolveResourcePath(nonexistentFile, {
        checkExists: true,
        warnIfMissing: false
      });
      expect(result).toBeNull();
    });
  });

  describe('resolveResourcePaths', () => {
    it('should resolve multiple paths', () => {
      const paths = [
        '/absolute/path.pdf',
        './relative/path.pdf',
        '~/home/path.pdf'
      ];
      const results = resolveResourcePaths(paths, { checkExists: false });

      expect(results).toHaveLength(3);
      expect(results[0].original).toBe('/absolute/path.pdf');
      expect(results[0].resolved).toBe('/absolute/path.pdf');
      expect(results[1].original).toBe('./relative/path.pdf');
      expect(results[1].resolved).toBe(path.resolve(process.cwd(), './relative/path.pdf'));
      expect(results[2].original).toBe('~/home/path.pdf');
      expect(results[2].resolved).toBe(path.join(os.homedir(), 'home/path.pdf'));
    });

    it('should handle empty array', () => {
      const results = resolveResourcePaths([]);
      expect(results).toEqual([]);
    });

    it('should handle non-array input', () => {
      const results = resolveResourcePaths(null);
      expect(results).toEqual([]);
    });

    it('should include null for unresolvable paths', () => {
      delete process.env.EXAM_PREP_RESOURCES;
      // Mock fs.existsSync to ensure no default locations exist
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn().mockReturnValue(false);

      const paths = ['file.pdf'];
      const results = resolveResourcePaths(paths, { warnIfMissing: false });

      expect(results).toHaveLength(1);
      expect(results[0].original).toBe('file.pdf');
      expect(results[0].resolved).toBeNull();

      fs.existsSync = originalExistsSync;
    });
  });

  describe('resourceExists', () => {
    it('should return true for existing files', () => {
      // Use a file that actually exists
      const testFile = path.join(__dirname, '../../../package.json');
      const result = resourceExists(testFile);
      expect(result).toBe(true);
    });

    it('should return false for non-existing files', () => {
      const result = resourceExists('/absolutely/nonexistent/file.pdf');
      expect(result).toBe(false);
    });

    it('should return false for null input', () => {
      const result = resourceExists(null);
      expect(result).toBe(false);
    });
  });

  describe('getResourceConfig', () => {
    it('should return configuration info', () => {
      const config = getResourceConfig();

      expect(config).toHaveProperty('environmentVariable');
      expect(config).toHaveProperty('resolvedBaseDir');
      expect(config).toHaveProperty('defaultLocations');
      expect(config).toHaveProperty('existingLocations');
      expect(Array.isArray(config.defaultLocations)).toBe(true);
      expect(Array.isArray(config.existingLocations)).toBe(true);
    });

    it('should include environment variable if set', () => {
      process.env.EXAM_PREP_RESOURCES = '/custom/path';
      const config = getResourceConfig();
      expect(config.environmentVariable).toBe('/custom/path');
    });

    it('should have null environment variable if not set', () => {
      delete process.env.EXAM_PREP_RESOURCES;
      const config = getResourceConfig();
      expect(config.environmentVariable).toBeNull();
    });
  });

  describe('Complex path resolution scenarios', () => {
    it('should handle path with both variable and tilde (variable first)', () => {
      process.env.BASE = os.homedir();
      const result = resolveResourcePath('${BASE}/Documents/file.pdf', { checkExists: false });
      expect(result).toBe(path.join(os.homedir(), 'Documents/file.pdf'));
      delete process.env.BASE;
    });

    it('should handle Windows-style paths on Windows', () => {
      if (process.platform === 'win32') {
        const winPath = 'C:\\Users\\Test\\file.pdf';
        const result = resolveResourcePath(winPath, { checkExists: false });
        expect(result).toBe(winPath);
      } else {
        // On non-Windows, this would be treated as relative
        expect(true).toBe(true); // Skip test
      }
    });

    it('should handle parent directory navigation in relative paths', () => {
      const result = resolveResourcePath('../file.pdf', { checkExists: false });
      expect(result).toBe(path.resolve(process.cwd(), '../file.pdf'));
    });
  });
});
