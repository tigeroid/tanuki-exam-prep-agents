/**
 * Integration tests for ITPMP (General) exam plugin
 * Tests loading, validation, and context building for the general exam template
 */

const { loadExam, buildExamContext } = require('../../src/core/engine/exam-loader');
const path = require('path');

describe('ITPMP General Exam Plugin Integration', () => {
  const examsPath = path.join(__dirname, '../../exams');
  let examConfig;

  test('should successfully load the ITPMP exam configuration', () => {
    examConfig = loadExam('itpmp', examsPath);

    expect(examConfig).toBeDefined();
    expect(examConfig.code).toBe('itpmp');
    expect(examConfig.name).toBe('IT Project Management Professional');
  });

  test('should have correct exam format specifications', () => {
    const config = examConfig || loadExam('itpmp', examsPath);

    expect(config.format).toBeDefined();
    expect(config.format.total_questions).toBe(150); // Different from RIMS (100)
    expect(config.format.passing_score).toBe(65);   // Different from RIMS (71)
    expect(config.format.question_type).toBe('multiple-choice-4');
    expect(config.format.time_limit_minutes).toBe(180); // 3 hours vs RIMS 2 hours
  });

  test('should have exactly 4 domains (different from RIMS 5)', () => {
    const config = examConfig || loadExam('itpmp', examsPath);

    expect(config.domains).toBeDefined();
    expect(config.domains).toHaveLength(4);
  });

  test('should have domain weights that sum to exactly 100%', () => {
    const config = examConfig || loadExam('itpmp', examsPath);

    const totalWeight = config.domains.reduce((sum, domain) => sum + domain.weight, 0);
    expect(totalWeight).toBe(100);
  });

  test('should have correct domain weights matching ITPMP structure', () => {
    const config = examConfig || loadExam('itpmp', examsPath);

    const domainWeights = {
      'initiation-planning': 30,
      'execution-delivery': 35,   // Highest weighted domain
      'monitoring-control': 25,
      'closure-optimization': 10,
    };

    config.domains.forEach(domain => {
      expect(domain.weight).toBe(domainWeights[domain.code]);
    });
  });

  test('should have execution-delivery as the highest weighted domain (35%)', () => {
    const config = examConfig || loadExam('itpmp', examsPath);

    const executionDomain = config.domains.find(d => d.code === 'execution-delivery');
    expect(executionDomain).toBeDefined();
    expect(executionDomain.weight).toBe(35);
    expect(executionDomain.name).toBe('Project Execution and Delivery');

    // Verify it's the highest
    const maxWeight = Math.max(...config.domains.map(d => d.weight));
    expect(executionDomain.weight).toBe(maxWeight);
  });

  test('should have all domains with required properties', () => {
    const config = examConfig || loadExam('itpmp', examsPath);

    config.domains.forEach(domain => {
      expect(domain.code).toBeDefined();
      expect(domain.name).toBeDefined();
      expect(domain.description).toBeDefined();
      expect(domain.weight).toBeGreaterThan(0);
    });
  });

  test('should successfully build exam context from configuration', () => {
    const config = examConfig || loadExam('itpmp', examsPath);

    // Build context using the buildExamContext function
    const context = buildExamContext(config);

    // Verify context structure
    expect(context).toBeDefined();
    expect(context.exam).toBeDefined();
    expect(context.domainMap).toBeDefined();

    // Verify domain map has all 4 domains
    expect(Object.keys(context.domainMap)).toHaveLength(4);
    expect(context.domainMap['initiation-planning']).toBeDefined();
    expect(context.domainMap['execution-delivery']).toBeDefined();
    expect(context.domainMap['execution-delivery'].weight).toBe(35);
  });

  test('should have diverse resource types demonstrating plugin flexibility', () => {
    const config = examConfig || loadExam('itpmp', examsPath);

    const resourceTypes = new Set();

    config.resources.forEach(resource => {
      resourceTypes.add(resource.type);
    });

    // Should have multiple types of resources
    expect(resourceTypes.size).toBeGreaterThan(3);

    // Expected types specific to ITPMP
    const expectedTypes = ['study-guide', 'textbook', 'template', 'video-series'];
    expectedTypes.forEach(type => {
      expect(resourceTypes.has(type)).toBe(true);
    });
  });

  test('should demonstrate different resource organization than RIMS', () => {
    const config = examConfig || loadExam('itpmp', examsPath);

    // Check for template resources (not used in RIMS)
    const templateResources = config.resources.filter(r => r.type === 'template');
    expect(templateResources.length).toBeGreaterThan(0);

    // Check for video-series resources
    const videoResources = config.resources.filter(r => r.type === 'video-series');
    expect(videoResources.length).toBeGreaterThan(0);

    // Verify cross-domain resources
    const crossDomainResources = config.resources.filter(r => r.domain === 'all');
    expect(crossDomainResources.length).toBeGreaterThan(0);
  });

  test('should validate exam configuration against schema requirements', () => {
    const config = examConfig || loadExam('itpmp', examsPath);

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
      expect(resource.domain).toBeTruthy();
    });
  });
});
