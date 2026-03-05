const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Path Resolver
 *
 * Resolves resource paths from exam YAML configurations to actual file system paths.
 * Supports:
 * - Environment variable substitution (${EXAM_PREP_RESOURCES}/file.pdf)
 * - Relative paths (./resources/file.pdf, ~/exam-prep/file.pdf)
 * - Absolute paths (/path/to/file.pdf)
 * - Multiple fallback locations for resources
 *
 * @module path-resolver
 */

/**
 * Default fallback locations for exam prep resources
 * Checked in order if environment variable not set
 */
const DEFAULT_RESOURCE_LOCATIONS = [
  path.join(process.cwd(), 'resources'),           // ./resources
  path.join(os.homedir(), 'exam-prep-resources'),  // ~/exam-prep-resources
  path.join(os.homedir(), 'Documents', 'exam-prep-resources'), // ~/Documents/exam-prep-resources
];

/**
 * Get the base resource directory from environment or defaults
 *
 * @returns {string|null} The base resource directory path, or null if none found
 */
function getResourceBaseDir() {
  // Check environment variable first
  if (process.env.EXAM_PREP_RESOURCES) {
    const envPath = process.env.EXAM_PREP_RESOURCES;
    if (fs.existsSync(envPath)) {
      return envPath;
    }
    console.warn(`Warning: EXAM_PREP_RESOURCES is set to "${envPath}" but directory does not exist`);
  }

  // Check default locations
  for (const location of DEFAULT_RESOURCE_LOCATIONS) {
    if (fs.existsSync(location)) {
      return location;
    }
  }

  return null;
}

/**
 * Resolve environment variables in a path string
 * Supports ${VAR_NAME} syntax
 *
 * @param {string} pathStr - Path string potentially containing variables
 * @returns {string} Path with variables resolved
 */
function resolveVariables(pathStr) {
  if (!pathStr || typeof pathStr !== 'string') {
    return pathStr;
  }

  return pathStr.replace(/\$\{([^}]+)\}/g, (match, varName) => {
    // Special handling for EXAM_PREP_RESOURCES
    if (varName === 'EXAM_PREP_RESOURCES') {
      const baseDir = getResourceBaseDir();
      if (baseDir) {
        return baseDir;
      }
      console.warn(`Warning: Cannot resolve ${match} - no resource directory found`);
      return match;
    }

    // General environment variable
    const value = process.env[varName];
    if (value !== undefined) {
      return value;
    }

    console.warn(`Warning: Environment variable ${varName} is not set`);
    return match;
  });
}

/**
 * Resolve ~ (tilde) to user home directory
 *
 * @param {string} pathStr - Path string potentially starting with ~
 * @returns {string} Path with ~ resolved
 */
function resolveTilde(pathStr) {
  if (!pathStr || typeof pathStr !== 'string') {
    return pathStr;
  }

  if (pathStr.startsWith('~/') || pathStr === '~') {
    return path.join(os.homedir(), pathStr.slice(2));
  }

  return pathStr;
}

/**
 * Resolve a resource path from exam configuration
 *
 * Resolution order:
 * 1. Resolve environment variables (${VAR})
 * 2. Resolve tilde (~) to home directory
 * 3. If relative path (./), resolve relative to CWD
 * 4. If absolute path, use as-is
 * 5. If just a filename, search in resource base dir
 *
 * @param {string} resourcePath - The path from exam YAML config
 * @param {Object} options - Resolution options
 * @param {boolean} options.checkExists - Whether to check if file exists (default: false)
 * @param {boolean} options.warnIfMissing - Whether to warn if file doesn't exist (default: true)
 * @returns {string|null} Resolved absolute path, or null if cannot resolve
 */
function resolveResourcePath(resourcePath, options = {}) {
  const {
    checkExists = false,
    warnIfMissing = true
  } = options;

  if (!resourcePath || typeof resourcePath !== 'string') {
    return null;
  }

  // Step 1: Resolve environment variables
  let resolved = resolveVariables(resourcePath);

  // Step 2: Resolve tilde
  resolved = resolveTilde(resolved);

  // Step 3: Handle relative paths
  if (resolved.startsWith('./') || resolved.startsWith('../')) {
    resolved = path.resolve(process.cwd(), resolved);
  }

  // Step 4: If absolute path, use as-is
  if (path.isAbsolute(resolved)) {
    if (checkExists && !fs.existsSync(resolved)) {
      if (warnIfMissing) {
        console.warn(`Warning: Resource not found: ${resolved}`);
      }
      return null;
    }
    return resolved;
  }

  // Step 5: Relative filename - search in resource base dir
  const baseDir = getResourceBaseDir();
  if (baseDir) {
    const fullPath = path.join(baseDir, resolved);
    if (checkExists && !fs.existsSync(fullPath)) {
      if (warnIfMissing) {
        console.warn(`Warning: Resource not found: ${fullPath}`);
      }
      return null;
    }
    return fullPath;
  }

  // No base dir found
  if (warnIfMissing) {
    console.warn(`Warning: Cannot resolve resource path "${resourcePath}" - no resource directory found`);
    console.warn(`Set EXAM_PREP_RESOURCES environment variable or create one of:`);
    DEFAULT_RESOURCE_LOCATIONS.forEach(loc => console.warn(`  - ${loc}`));
  }

  return null;
}

/**
 * Resolve multiple resource paths
 *
 * @param {string[]} resourcePaths - Array of resource paths
 * @param {Object} options - Resolution options (passed to resolveResourcePath)
 * @returns {Array<{original: string, resolved: string|null}>} Array of resolution results
 */
function resolveResourcePaths(resourcePaths, options = {}) {
  if (!Array.isArray(resourcePaths)) {
    return [];
  }

  return resourcePaths.map(resourcePath => ({
    original: resourcePath,
    resolved: resolveResourcePath(resourcePath, options)
  }));
}

/**
 * Check if a resource path exists after resolution
 *
 * @param {string} resourcePath - The path from exam YAML config
 * @returns {boolean} True if resolved path exists
 */
function resourceExists(resourcePath) {
  const resolved = resolveResourcePath(resourcePath, {
    checkExists: true,
    warnIfMissing: false
  });
  return resolved !== null;
}

/**
 * Get information about resource path configuration
 * Useful for debugging and setup validation
 *
 * @returns {Object} Configuration info
 */
function getResourceConfig() {
  const baseDir = getResourceBaseDir();
  return {
    environmentVariable: process.env.EXAM_PREP_RESOURCES || null,
    resolvedBaseDir: baseDir,
    defaultLocations: DEFAULT_RESOURCE_LOCATIONS,
    existingLocations: DEFAULT_RESOURCE_LOCATIONS.filter(loc => fs.existsSync(loc))
  };
}

module.exports = {
  resolveResourcePath,
  resolveResourcePaths,
  resourceExists,
  getResourceConfig,
  resolveVariables,
  resolveTilde,
  getResourceBaseDir
};
