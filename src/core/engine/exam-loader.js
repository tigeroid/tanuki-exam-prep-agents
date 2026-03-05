const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const { validateExamConfig } = require('../lib/config-schema');
const { resolveResourcePath } = require('../config/path-resolver');

/**
 * Load and validate an exam configuration from YAML file
 * @param {string} examCode - The exam code/identifier
 * @param {string} examsPath - The base path to the exams directory
 * @returns {Object} The validated exam configuration object
 * @throws {Error} If file not found or validation fails
 */
function loadExam(examCode, examsPath) {
  // Validate examCode to prevent path traversal attacks
  if (!examCode || typeof examCode !== 'string') {
    throw new Error('Invalid exam code');
  }
  if (examCode.includes('..') || examCode.includes(path.sep) || examCode.includes('/') || examCode.includes('\\')) {
    throw new Error('Invalid exam code: path traversal detected');
  }

  const examFilePath = path.join(examsPath, examCode, 'exam.yaml');

  // Check if file exists
  if (!fs.existsSync(examFilePath)) {
    throw new Error(`Exam configuration not found: ${examFilePath}`);
  }

  // Read and parse YAML file
  let examConfig;
  try {
    const fileContents = fs.readFileSync(examFilePath, 'utf8');
    examConfig = YAML.parse(fileContents);
  } catch (error) {
    throw new Error(`Failed to parse exam configuration: ${error.message}`);
  }

  // Validate configuration
  const validation = validateExamConfig(examConfig);
  if (!validation.valid) {
    throw new Error(`Exam configuration validation failed: ${validation.errors.join(', ')}`);
  }

  // Return structured exam object
  return {
    code: examConfig.code,
    name: examConfig.name,
    format: examConfig.format,
    domains: examConfig.domains,
    resources: examConfig.resources || []
  };
}

/**
 * Build enriched context for agents from exam configuration
 * @param {Object} exam - The exam object from loadExam
 * @returns {Object} Enriched context with domainMap and resourceMap
 */
function buildExamContext(exam) {
  // Build domain map with percentages
  const domainMap = {};
  if (exam.domains && Array.isArray(exam.domains)) {
    exam.domains.forEach(domain => {
      domainMap[domain.code] = {
        ...domain,
        percentage: domain.weight // weight is already the percentage
      };
    });
  }

  // Build resource map keyed by domain code
  // Resolve resource paths at runtime
  const resourceMap = {};
  if (exam.resources && Array.isArray(exam.resources)) {
    exam.resources.forEach(resource => {
      const domainCode = resource.domain;
      if (!resourceMap[domainCode]) {
        resourceMap[domainCode] = [];
      }

      // Resolve the resource path if present
      const enrichedResource = { ...resource };
      if (resource.path) {
        const originalPath = resource.path;
        const resolvedPath = resolveResourcePath(originalPath, {
          checkExists: false,
          warnIfMissing: false
        });

        enrichedResource.originalPath = originalPath;
        enrichedResource.resolvedPath = resolvedPath;
        enrichedResource.available = resolvedPath !== null && fs.existsSync(resolvedPath);
      }

      resourceMap[domainCode].push(enrichedResource);
    });
  }

  // Return enriched context
  return {
    exam: exam,
    domainMap: domainMap,
    resourceMap: resourceMap
  };
}

module.exports = {
  loadExam,
  buildExamContext
};
