const { loadExam, buildExamContext } = require('../../src/core/engine/exam-loader');
const path = require('path');
const fs = require('fs');

describe('Exam Loader', () => {
  const examsPath = path.join(__dirname, '../../exams');

  describe('loadExam', () => {
    test('loads and validates a valid exam configuration', () => {
      const exam = loadExam('sample', examsPath);

      expect(exam).toBeDefined();
      expect(exam.code).toBe('sample');
      expect(exam.name).toBe('Sample Certification Exam');
      expect(exam.format).toBeDefined();
      expect(exam.format.total_questions).toBe(100);
      expect(exam.format.passing_score).toBe(70);
      expect(exam.domains).toBeInstanceOf(Array);
      expect(exam.domains).toHaveLength(3);
      expect(exam.resources).toBeInstanceOf(Array);
    });

    test('validates domain weights sum to 100', () => {
      const exam = loadExam('sample', examsPath);
      const totalWeight = exam.domains.reduce((sum, d) => sum + d.weight, 0);
      expect(totalWeight).toBe(100);
    });

    test('throws error when exam file does not exist', () => {
      expect(() => {
        loadExam('nonexistent', examsPath);
      }).toThrow(/not found/i);
    });

    test('throws error when exam config is invalid', () => {
      // Create a temporary invalid exam for testing
      const invalidExamPath = path.join(examsPath, 'invalid');
      const invalidExamFile = path.join(invalidExamPath, 'exam.yaml');

      // Create directory if it doesn't exist
      if (!fs.existsSync(invalidExamPath)) {
        fs.mkdirSync(invalidExamPath, { recursive: true });
      }

      // Write invalid config (missing required fields)
      fs.writeFileSync(invalidExamFile, 'code: invalid\n# missing name and other required fields');

      try {
        expect(() => {
          loadExam('invalid', examsPath);
        }).toThrow(/validation/i);
      } finally {
        // Cleanup
        fs.unlinkSync(invalidExamFile);
        fs.rmdirSync(invalidExamPath);
      }
    });

    test('throws error with validation details for invalid domain weights', () => {
      const invalidExamPath = path.join(examsPath, 'invalid-weights');
      const invalidExamFile = path.join(invalidExamPath, 'exam.yaml');

      if (!fs.existsSync(invalidExamPath)) {
        fs.mkdirSync(invalidExamPath, { recursive: true });
      }

      const invalidConfig = `
code: invalid-weights
name: Invalid Weights Exam
format:
  total_questions: 100
  passing_score: 70
  question_type: multiple-choice-4
domains:
  - code: A
    name: Domain A
    weight: 60
  - code: B
    name: Domain B
    weight: 60
`;

      fs.writeFileSync(invalidExamFile, invalidConfig);

      try {
        expect(() => {
          loadExam('invalid-weights', examsPath);
        }).toThrow(/Domain weights must sum to 100/i);
      } finally {
        fs.unlinkSync(invalidExamFile);
        fs.rmdirSync(invalidExamPath);
      }
    });

    // Security tests for path traversal prevention
    test('prevents path traversal with .. in examCode', () => {
      expect(() => {
        loadExam('../../../etc/passwd', examsPath);
      }).toThrow('Invalid exam code: path traversal detected');
    });

    test('prevents path traversal with forward slashes', () => {
      expect(() => {
        loadExam('../../etc/passwd', examsPath);
      }).toThrow('Invalid exam code: path traversal detected');
    });

    test('prevents path traversal with backslashes', () => {
      expect(() => {
        loadExam('..\\..\\windows\\system32', examsPath);
      }).toThrow('Invalid exam code: path traversal detected');
    });

    test('prevents path traversal with absolute paths using forward slash', () => {
      expect(() => {
        loadExam('/etc/passwd', examsPath);
      }).toThrow('Invalid exam code: path traversal detected');
    });

    test('prevents path traversal with absolute paths using backslash', () => {
      expect(() => {
        loadExam('\\windows\\system32', examsPath);
      }).toThrow('Invalid exam code: path traversal detected');
    });

    test('rejects null examCode', () => {
      expect(() => {
        loadExam(null, examsPath);
      }).toThrow('Invalid exam code');
    });

    test('rejects undefined examCode', () => {
      expect(() => {
        loadExam(undefined, examsPath);
      }).toThrow('Invalid exam code');
    });

    test('rejects empty string examCode', () => {
      expect(() => {
        loadExam('', examsPath);
      }).toThrow('Invalid exam code');
    });

    test('rejects non-string examCode (number)', () => {
      expect(() => {
        loadExam(123, examsPath);
      }).toThrow('Invalid exam code');
    });

    test('rejects non-string examCode (object)', () => {
      expect(() => {
        loadExam({}, examsPath);
      }).toThrow('Invalid exam code');
    });
  });

  describe('buildExamContext', () => {
    let sampleExam;

    beforeEach(() => {
      sampleExam = loadExam('sample', examsPath);
    });

    test('builds context with exam, domainMap, and resourceMap', () => {
      const context = buildExamContext(sampleExam);

      expect(context).toBeDefined();
      expect(context.exam).toBeDefined();
      expect(context.domainMap).toBeDefined();
      expect(context.resourceMap).toBeDefined();
    });

    test('includes original exam data in context', () => {
      const context = buildExamContext(sampleExam);

      expect(context.exam.code).toBe('sample');
      expect(context.exam.name).toBe('Sample Certification Exam');
      expect(context.exam.domains).toHaveLength(3);
    });

    test('creates domainMap with domain codes as keys', () => {
      const context = buildExamContext(sampleExam);

      expect(context.domainMap).toHaveProperty('DOMAIN1');
      expect(context.domainMap).toHaveProperty('DOMAIN2');
      expect(context.domainMap).toHaveProperty('DOMAIN3');

      expect(context.domainMap.DOMAIN1.name).toBe('First Domain');
      expect(context.domainMap.DOMAIN1.weight).toBe(40);
      expect(context.domainMap.DOMAIN1.percentage).toBe(40);
    });

    test('calculates domain percentages correctly', () => {
      const context = buildExamContext(sampleExam);

      expect(context.domainMap.DOMAIN1.percentage).toBe(40);
      expect(context.domainMap.DOMAIN2.percentage).toBe(35);
      expect(context.domainMap.DOMAIN3.percentage).toBe(25);
    });

    test('creates resourceMap organized by domain code', () => {
      const context = buildExamContext(sampleExam);

      expect(context.resourceMap).toHaveProperty('DOMAIN1');
      expect(context.resourceMap).toHaveProperty('DOMAIN2');
      expect(context.resourceMap).toHaveProperty('DOMAIN3');

      expect(context.resourceMap.DOMAIN1).toBeInstanceOf(Array);
      expect(context.resourceMap.DOMAIN1.length).toBeGreaterThan(0);
      expect(context.resourceMap.DOMAIN2).toBeInstanceOf(Array);
      expect(context.resourceMap.DOMAIN3).toBeInstanceOf(Array);
    });

    test('groups resources by domain correctly', () => {
      const context = buildExamContext(sampleExam);

      // DOMAIN1 should have 2 resources
      expect(context.resourceMap.DOMAIN1).toHaveLength(2);
      expect(context.resourceMap.DOMAIN1[0].type).toBeDefined();
      expect(context.resourceMap.DOMAIN1[0].title).toBeDefined();

      // DOMAIN2 should have 1 resource
      expect(context.resourceMap.DOMAIN2).toHaveLength(1);

      // DOMAIN3 should have 1 resource
      expect(context.resourceMap.DOMAIN3).toHaveLength(1);
    });

    test('handles exams with no resources gracefully', () => {
      const examWithoutResources = { ...sampleExam, resources: [] };
      const context = buildExamContext(examWithoutResources);

      expect(context.resourceMap).toBeDefined();
      expect(Object.keys(context.resourceMap)).toHaveLength(0);
    });

    test('handles exams with undefined resources gracefully', () => {
      const examWithoutResources = { ...sampleExam };
      delete examWithoutResources.resources;

      const context = buildExamContext(examWithoutResources);

      expect(context.resourceMap).toBeDefined();
      expect(Object.keys(context.resourceMap)).toHaveLength(0);
    });
  });
});
