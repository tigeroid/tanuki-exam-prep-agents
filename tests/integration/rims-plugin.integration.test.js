/**
 * Integration tests for RIMS-CRMP exam plugin
 * Tests loading, validation, and context building for the RIMS exam configuration
 */

const { loadExam, buildExamContext } = require('../../src/core/engine/exam-loader');
const fs = require('fs');
const path = require('path');

describe('RIMS-CRMP Exam Plugin Integration', () => {
  const examsPath = path.join(__dirname, '../../exams');
  let examConfig;

  test('should successfully load the RIMS-CRMP exam configuration', () => {
    examConfig = loadExam('rims-crmp', examsPath);

    expect(examConfig).toBeDefined();
    expect(examConfig.code).toBe('rims-crmp');
    expect(examConfig.name).toBe('RIMS-CRMP Certification');
  });

  test('should have correct exam format specifications', () => {
    const config = examConfig || loadExam('rims-crmp', examsPath);

    expect(config.format).toBeDefined();
    expect(config.format.total_questions).toBe(100);
    expect(config.format.passing_score).toBe(71);
    expect(config.format.question_type).toBe('multiple-choice-4');
    expect(config.format.time_limit_minutes).toBe(120); // 2 hours
  });

  test('should have exactly 5 domains', () => {
    const config = examConfig || loadExam('rims-crmp', examsPath);

    expect(config.domains).toBeDefined();
    expect(config.domains).toHaveLength(5);
  });

  test('should have domain weights that sum to exactly 100%', () => {
    const config = examConfig || loadExam('rims-crmp', examsPath);

    const totalWeight = config.domains.reduce((sum, domain) => sum + domain.weight, 0);
    expect(totalWeight).toBe(100);
  });

  test('should have correct domain weights matching RIMS exam structure', () => {
    const config = examConfig || loadExam('rims-crmp', examsPath);

    const domainWeights = {
      'domain-a': 16,  // Analyzing the Organizational Risk Model
      'domain-b': 26,  // Designing Risk Management Strategies
      'domain-c': 32,  // Implementing Risk Management Processes (highest)
      'domain-d': 16,  // Developing Risk Competency
      'domain-e': 10,  // Supporting Decision Making
    };

    config.domains.forEach(domain => {
      expect(domain.weight).toBe(domainWeights[domain.code]);
    });
  });

  test('should have Domain C as the highest weighted domain (32%)', () => {
    const config = examConfig || loadExam('rims-crmp', examsPath);

    const domainC = config.domains.find(d => d.code === 'domain-c');
    expect(domainC).toBeDefined();
    expect(domainC.weight).toBe(32);
    expect(domainC.name).toBe('Implementing Risk Management Processes');

    // Verify it's the highest
    const maxWeight = Math.max(...config.domains.map(d => d.weight));
    expect(domainC.weight).toBe(maxWeight);
  });

  test('should have all domains with required properties', () => {
    const config = examConfig || loadExam('rims-crmp', examsPath);

    config.domains.forEach(domain => {
      expect(domain.code).toBeDefined();
      expect(domain.name).toBeDefined();
      expect(domain.description).toBeDefined();
      expect(domain.weight).toBeGreaterThan(0);
    });

    // Verify each domain has resources
    config.domains.forEach(domain => {
      const domainResources = config.resources.filter(r => r.domain === domain.code);
      expect(domainResources.length).toBeGreaterThan(0);
    });
  });

  test('should have all resources using configurable paths', () => {
    const config = examConfig || loadExam('rims-crmp', examsPath);

    // Verify each resource uses ${EXAM_PREP_RESOURCES} placeholder
    const invalidPaths = [];
    config.resources.forEach(resource => {
      // Resources should use ${EXAM_PREP_RESOURCES} placeholder
      if (!resource.path.startsWith('${EXAM_PREP_RESOURCES}')) {
        invalidPaths.push({
          domain: resource.domain,
          path: resource.path,
          type: resource.type
        });
      }
    });

    if (invalidPaths.length > 0) {
      console.error('Resources with invalid paths (should use ${EXAM_PREP_RESOURCES}):');
      invalidPaths.forEach(file => {
        console.error(`  [${file.domain}] ${file.type}: ${file.path}`);
      });
    }

    expect(invalidPaths).toHaveLength(0);
    expect(config.resources.length).toBeGreaterThan(0);
  });

  test('should include the official RIMS study guide in all domains', () => {
    const config = examConfig || loadExam('rims-crmp', examsPath);

    const studyGuidePath = '${EXAM_PREP_RESOURCES}/RIMS-CRMP-Study-Guide-2025.pdf';

    config.domains.forEach(domain => {
      const domainResources = config.resources.filter(r => r.domain === domain.code);
      const hasStudyGuide = domainResources.some(r => r.path === studyGuidePath);
      expect(hasStudyGuide).toBe(true);
    });
  });

  test('should have quick reference materials defined', () => {
    const config = examConfig || loadExam('rims-crmp', examsPath);

    // Verify master reference is included in resources
    const hasMasterRef = config.resources.some(r =>
      r.path.includes('RIMS-CRMP-Master-Reference.md')
    );
    expect(hasMasterRef).toBe(true);

    // Verify quick reference type resources exist
    const quickRefResources = config.resources.filter(r => r.type === 'quick-reference');
    expect(quickRefResources.length).toBeGreaterThan(0);
  });

  test('should successfully build exam context from configuration', () => {
    const config = examConfig || loadExam('rims-crmp', examsPath);

    // Build context using the buildExamContext function
    const context = buildExamContext(config);

    // Verify context structure
    expect(context).toBeDefined();
    expect(context.exam).toBeDefined();
    expect(context.domainMap).toBeDefined();

    // Verify domain map has all 5 domains
    expect(Object.keys(context.domainMap)).toHaveLength(5);
    expect(context.domainMap['domain-a']).toBeDefined();
    expect(context.domainMap['domain-c']).toBeDefined();
    expect(context.domainMap['domain-c'].weight).toBe(32);
  });

  test('should have diverse resource types across domains', () => {
    const config = examConfig || loadExam('rims-crmp', examsPath);

    const resourceTypes = new Set();

    config.resources.forEach(resource => {
      resourceTypes.add(resource.type);
    });

    // Should have multiple types of resources
    expect(resourceTypes.size).toBeGreaterThan(1);

    // Common expected types
    const expectedTypes = ['study-guide', 'lecture', 'reference', 'case-study'];
    expectedTypes.forEach(type => {
      expect(resourceTypes.has(type)).toBe(true);
    });
  });

  test('should have appropriate resource distribution across domains', () => {
    const config = examConfig || loadExam('rims-crmp', examsPath);

    config.domains.forEach(domain => {
      const domainResources = config.resources.filter(r => r.domain === domain.code);

      // Each domain should have at least 3 resources
      expect(domainResources.length).toBeGreaterThanOrEqual(3);

      // Higher weighted domains should generally have more resources
      if (domain.weight >= 26) {
        expect(domainResources.length).toBeGreaterThanOrEqual(5);
      }
    });
  });

  test('should validate exam configuration against schema requirements', () => {
    const config = examConfig || loadExam('rims-crmp', examsPath);

    // Top-level required fields
    expect(config.code).toMatch(/^[a-z0-9-]+$/);
    expect(config.name).toBeTruthy();

    // Format validation
    expect(config.format.total_questions).toBeGreaterThan(0);
    expect(config.format.passing_score).toBeGreaterThan(0);
    expect(config.format.passing_score).toBeLessThanOrEqual(100);
    expect(config.format.question_type).toMatch(/multiple-choice/);
    expect(config.format.time_limit_minutes).toBeGreaterThan(0);

    // Domain validation
    config.domains.forEach(domain => {
      expect(domain.code).toMatch(/^[a-z0-9-]+$/);
      expect(domain.name).toBeTruthy();
      expect(domain.weight).toBeGreaterThan(0);
      expect(domain.weight).toBeLessThanOrEqual(100);
    });

    // Resource validation
    config.resources.forEach(resource => {
      expect(resource.path).toBeTruthy();
      expect(resource.type).toBeTruthy();
      expect(resource.title).toBeTruthy();
    });
  });
});
