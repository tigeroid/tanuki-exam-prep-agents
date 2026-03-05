const { validateExamConfig, validateUserSettings } = require('../../src/core/lib/config-schema');

describe('Config Schema', () => {
  test('validates exam config', () => {
    const valid = {
      code: 'test',
      name: 'Test',
      format: { total_questions: 100, passing_score: 70, question_type: 'multiple-choice-4' },
      domains: [
        { code: 'A', name: 'Domain A', weight: 50 },
        { code: 'B', name: 'Domain B', weight: 50 }
      ]
    };

    const result = validateExamConfig(valid);
    expect(result.valid).toBe(true);
  });

  test('rejects invalid domain weights', () => {
    const invalid = {
      code: 'test',
      name: 'Test',
      format: { total_questions: 100, passing_score: 70, question_type: 'multiple-choice-4' },
      domains: [
        { code: 'A', name: 'A', weight: 60 },
        { code: 'B', name: 'B', weight: 60 }
      ]
    };

    const result = validateExamConfig(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Domain weights must sum to 100');
  });
});
