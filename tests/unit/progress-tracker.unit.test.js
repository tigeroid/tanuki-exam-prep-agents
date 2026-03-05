const {
  initializeProgress,
  loadProgress,
  recordStudySession,
  recordQuizAttempt,
  getProgressSummary,
  getDomainProgress
} = require('../../src/core/engine/progress-tracker');
const path = require('path');
const fs = require('fs');

describe('Progress Tracker', () => {
  const progressPath = path.join(__dirname, '../../user-data/progress');
  const testExamCode = 'test-exam';
  const testProgressFile = path.join(progressPath, `${testExamCode}.json`);

  // Clean up test data before and after each test
  beforeEach(() => {
    // Ensure progress directory exists
    if (!fs.existsSync(progressPath)) {
      fs.mkdirSync(progressPath, { recursive: true });
    }
    // Remove test file if it exists
    if (fs.existsSync(testProgressFile)) {
      fs.unlinkSync(testProgressFile);
    }
  });

  afterEach(() => {
    // Clean up test file
    if (fs.existsSync(testProgressFile)) {
      fs.unlinkSync(testProgressFile);
    }
  });

  describe('initializeProgress', () => {
    test('creates progress file with correct structure', () => {
      const userProfile = {
        examDate: '2026-06-01',
        studyHoursPerWeek: 10
      };

      const progress = initializeProgress(testExamCode, userProfile);

      expect(progress).toBeDefined();
      expect(progress.examCode).toBe(testExamCode);
      expect(progress.userProfile).toEqual(userProfile);
      expect(progress.createdAt).toBeDefined();
      expect(progress.updatedAt).toBeDefined();
      expect(progress.sessions).toEqual([]);
      expect(progress.quizHistory).toEqual([]);
      expect(progress.domainProgress).toEqual({});
    });

    test('creates progress file in correct location', () => {
      const userProfile = { examDate: '2026-06-01', studyHoursPerWeek: 10 };

      initializeProgress(testExamCode, userProfile);

      expect(fs.existsSync(testProgressFile)).toBe(true);
    });

    test('saves valid JSON to file', () => {
      const userProfile = { examDate: '2026-06-01', studyHoursPerWeek: 10 };

      const progress = initializeProgress(testExamCode, userProfile);

      const fileContent = fs.readFileSync(testProgressFile, 'utf8');
      const savedProgress = JSON.parse(fileContent);

      expect(savedProgress).toEqual(progress);
    });

    test('sets timestamps correctly', () => {
      const beforeTime = new Date().toISOString();
      const userProfile = { examDate: '2026-06-01', studyHoursPerWeek: 10 };

      const progress = initializeProgress(testExamCode, userProfile);
      const afterTime = new Date().toISOString();

      expect(progress.createdAt).toBeDefined();
      expect(progress.updatedAt).toBeDefined();
      expect(progress.createdAt >= beforeTime).toBe(true);
      expect(progress.createdAt <= afterTime).toBe(true);
      expect(progress.createdAt).toBe(progress.updatedAt);
    });

    test('creates progress directory if it does not exist', () => {
      // Remove the progress directory
      if (fs.existsSync(progressPath)) {
        const files = fs.readdirSync(progressPath);
        files.forEach(file => {
          fs.unlinkSync(path.join(progressPath, file));
        });
        fs.rmdirSync(progressPath);
      }

      const userProfile = { examDate: '2026-06-01', studyHoursPerWeek: 10 };

      initializeProgress(testExamCode, userProfile);

      expect(fs.existsSync(progressPath)).toBe(true);
      expect(fs.existsSync(testProgressFile)).toBe(true);
    });
  });

  describe('loadProgress', () => {
    test('loads existing progress file', () => {
      const userProfile = { examDate: '2026-06-01', studyHoursPerWeek: 10 };
      const created = initializeProgress(testExamCode, userProfile);

      const loaded = loadProgress(testExamCode);

      expect(loaded).toEqual(created);
    });

    test('returns null if progress file does not exist', () => {
      const loaded = loadProgress('nonexistent-exam');

      expect(loaded).toBeNull();
    });

    test('correctly parses all progress data', () => {
      const userProfile = { examDate: '2026-06-01', studyHoursPerWeek: 10 };
      initializeProgress(testExamCode, userProfile);

      const loaded = loadProgress(testExamCode);

      expect(loaded.examCode).toBe(testExamCode);
      expect(loaded.userProfile).toEqual(userProfile);
      expect(loaded.sessions).toEqual([]);
      expect(loaded.quizHistory).toEqual([]);
      expect(loaded.domainProgress).toEqual({});
    });

    test('handles corrupted JSON gracefully', () => {
      // Write invalid JSON to file
      fs.writeFileSync(testProgressFile, '{ invalid json }');

      expect(() => loadProgress(testExamCode)).toThrow();
    });
  });

  describe('recordStudySession', () => {
    beforeEach(() => {
      const userProfile = { examDate: '2026-06-01', studyHoursPerWeek: 10 };
      initializeProgress(testExamCode, userProfile);
    });

    test('appends session to sessions array', () => {
      const sessionData = {
        domains: ['domain-a'],
        duration: 60,
        topics: ['topic-1', 'topic-2'],
        date: '2026-03-04'
      };

      const progress = recordStudySession(testExamCode, sessionData);

      expect(progress.sessions).toHaveLength(1);
      expect(progress.sessions[0]).toEqual(sessionData);
    });

    test('updates domain progress with study time', () => {
      const sessionData = {
        domains: ['domain-a'],
        duration: 60,
        topics: ['topic-1'],
        date: '2026-03-04'
      };

      const progress = recordStudySession(testExamCode, sessionData);

      expect(progress.domainProgress['domain-a']).toBeDefined();
      expect(progress.domainProgress['domain-a'].studyTime).toBe(60);
    });

    test('accumulates study time across multiple sessions', () => {
      const session1 = {
        domains: ['domain-a'],
        duration: 60,
        topics: ['topic-1'],
        date: '2026-03-04'
      };
      const session2 = {
        domains: ['domain-a'],
        duration: 45,
        topics: ['topic-2'],
        date: '2026-03-05'
      };

      recordStudySession(testExamCode, session1);
      const progress = recordStudySession(testExamCode, session2);

      expect(progress.sessions).toHaveLength(2);
      expect(progress.domainProgress['domain-a'].studyTime).toBe(105);
    });

    test('handles multiple domains in one session', () => {
      const sessionData = {
        domains: ['domain-a', 'domain-b'],
        duration: 120,
        topics: ['topic-1', 'topic-2'],
        date: '2026-03-04'
      };

      const progress = recordStudySession(testExamCode, sessionData);

      // Duration should be split evenly across domains
      expect(progress.domainProgress['domain-a'].studyTime).toBe(60);
      expect(progress.domainProgress['domain-b'].studyTime).toBe(60);
    });

    test('updates updatedAt timestamp', () => {
      const initialProgress = loadProgress(testExamCode);
      const initialUpdatedAt = initialProgress.updatedAt;

      // Wait a tiny bit to ensure timestamp difference
      const sessionData = {
        domains: ['domain-a'],
        duration: 60,
        topics: ['topic-1'],
        date: '2026-03-04'
      };

      const progress = recordStudySession(testExamCode, sessionData);

      expect(progress.updatedAt).toBeDefined();
      expect(progress.updatedAt >= initialUpdatedAt).toBe(true);
    });

    test('saves progress to file', () => {
      const sessionData = {
        domains: ['domain-a'],
        duration: 60,
        topics: ['topic-1'],
        date: '2026-03-04'
      };

      recordStudySession(testExamCode, sessionData);

      const loaded = loadProgress(testExamCode);
      expect(loaded.sessions).toHaveLength(1);
    });

    test('initializes domain progress if not exists', () => {
      const sessionData = {
        domains: ['new-domain'],
        duration: 30,
        topics: ['topic-1'],
        date: '2026-03-04'
      };

      const progress = recordStudySession(testExamCode, sessionData);

      expect(progress.domainProgress['new-domain']).toEqual({
        studyTime: 30,
        quizAttempts: 0,
        averageScore: 0
      });
    });
  });

  describe('recordQuizAttempt', () => {
    beforeEach(() => {
      const userProfile = { examDate: '2026-06-01', studyHoursPerWeek: 10 };
      initializeProgress(testExamCode, userProfile);
    });

    test('appends quiz attempt to quiz history', () => {
      const quizData = {
        domain: 'domain-a',
        score: 85,
        total: 20,
        correct: 17,
        date: '2026-03-04'
      };

      const progress = recordQuizAttempt(testExamCode, quizData);

      expect(progress.quizHistory).toHaveLength(1);
      expect(progress.quizHistory[0]).toEqual(quizData);
    });

    test('updates domain progress with quiz attempt', () => {
      const quizData = {
        domain: 'domain-a',
        score: 85,
        total: 20,
        correct: 17,
        date: '2026-03-04'
      };

      const progress = recordQuizAttempt(testExamCode, quizData);

      expect(progress.domainProgress['domain-a']).toBeDefined();
      expect(progress.domainProgress['domain-a'].quizAttempts).toBe(1);
      expect(progress.domainProgress['domain-a'].averageScore).toBe(85);
    });

    test('calculates average score across multiple attempts', () => {
      const quiz1 = {
        domain: 'domain-a',
        score: 80,
        total: 20,
        correct: 16,
        date: '2026-03-04'
      };
      const quiz2 = {
        domain: 'domain-a',
        score: 90,
        total: 20,
        correct: 18,
        date: '2026-03-05'
      };

      recordQuizAttempt(testExamCode, quiz1);
      const progress = recordQuizAttempt(testExamCode, quiz2);

      expect(progress.domainProgress['domain-a'].quizAttempts).toBe(2);
      expect(progress.domainProgress['domain-a'].averageScore).toBe(85);
    });

    test('initializes domain progress if not exists', () => {
      const quizData = {
        domain: 'new-domain',
        score: 75,
        total: 20,
        correct: 15,
        date: '2026-03-04'
      };

      const progress = recordQuizAttempt(testExamCode, quizData);

      expect(progress.domainProgress['new-domain']).toBeDefined();
      expect(progress.domainProgress['new-domain'].studyTime).toBe(0);
      expect(progress.domainProgress['new-domain'].quizAttempts).toBe(1);
      expect(progress.domainProgress['new-domain'].averageScore).toBe(75);
    });

    test('updates updatedAt timestamp', () => {
      const quizData = {
        domain: 'domain-a',
        score: 85,
        total: 20,
        correct: 17,
        date: '2026-03-04'
      };

      const progress = recordQuizAttempt(testExamCode, quizData);

      expect(progress.updatedAt).toBeDefined();
    });

    test('saves progress to file', () => {
      const quizData = {
        domain: 'domain-a',
        score: 85,
        total: 20,
        correct: 17,
        date: '2026-03-04'
      };

      recordQuizAttempt(testExamCode, quizData);

      const loaded = loadProgress(testExamCode);
      expect(loaded.quizHistory).toHaveLength(1);
    });
  });

  describe('getProgressSummary', () => {
    beforeEach(() => {
      const userProfile = { examDate: '2026-06-01', studyHoursPerWeek: 10 };
      initializeProgress(testExamCode, userProfile);
    });

    test('calculates total study hours correctly', () => {
      recordStudySession(testExamCode, {
        domains: ['domain-a'],
        duration: 60,
        topics: ['topic-1'],
        date: '2026-03-04'
      });
      recordStudySession(testExamCode, {
        domains: ['domain-b'],
        duration: 90,
        topics: ['topic-2'],
        date: '2026-03-05'
      });

      const summary = getProgressSummary(testExamCode);

      expect(summary.totalHours).toBe(2.5); // 150 minutes = 2.5 hours
    });

    test('calculates overall quiz average correctly', () => {
      recordQuizAttempt(testExamCode, {
        domain: 'domain-a',
        score: 80,
        total: 20,
        correct: 16,
        date: '2026-03-04'
      });
      recordQuizAttempt(testExamCode, {
        domain: 'domain-b',
        score: 90,
        total: 20,
        correct: 18,
        date: '2026-03-05'
      });

      const summary = getProgressSummary(testExamCode);

      expect(summary.quizAverage).toBe(85);
    });

    test('identifies weak domains (< 70%)', () => {
      recordQuizAttempt(testExamCode, {
        domain: 'domain-a',
        score: 85,
        total: 20,
        correct: 17,
        date: '2026-03-04'
      });
      recordQuizAttempt(testExamCode, {
        domain: 'domain-b',
        score: 65,
        total: 20,
        correct: 13,
        date: '2026-03-05'
      });

      const summary = getProgressSummary(testExamCode);

      expect(summary.weakDomains).toContain('domain-b');
      expect(summary.weakDomains).not.toContain('domain-a');
    });

    test('calculates readiness percentage based on quiz performance', () => {
      recordQuizAttempt(testExamCode, {
        domain: 'domain-a',
        score: 80,
        total: 20,
        correct: 16,
        date: '2026-03-04'
      });

      const summary = getProgressSummary(testExamCode);

      expect(summary.readiness).toBeDefined();
      expect(summary.readiness).toBeGreaterThanOrEqual(0);
      expect(summary.readiness).toBeLessThanOrEqual(100);
    });

    test('returns zero hours when no sessions recorded', () => {
      const summary = getProgressSummary(testExamCode);

      expect(summary.totalHours).toBe(0);
    });

    test('returns zero quiz average when no quizzes taken', () => {
      const summary = getProgressSummary(testExamCode);

      expect(summary.quizAverage).toBe(0);
    });

    test('returns empty weak domains when no quizzes taken', () => {
      const summary = getProgressSummary(testExamCode);

      expect(summary.weakDomains).toEqual([]);
    });
  });

  describe('getDomainProgress', () => {
    beforeEach(() => {
      const userProfile = { examDate: '2026-06-01', studyHoursPerWeek: 10 };
      initializeProgress(testExamCode, userProfile);
    });

    test('returns domain-specific progress data', () => {
      recordStudySession(testExamCode, {
        domains: ['domain-a'],
        duration: 120,
        topics: ['topic-1'],
        date: '2026-03-04'
      });
      recordQuizAttempt(testExamCode, {
        domain: 'domain-a',
        score: 85,
        total: 20,
        correct: 17,
        date: '2026-03-04'
      });

      const domainProgress = getDomainProgress(testExamCode, 'domain-a');

      expect(domainProgress.studyTime).toBe(120);
      expect(domainProgress.quizAverage).toBe(85);
      expect(domainProgress.attempts).toBe(1);
    });

    test('includes last studied date', () => {
      const sessionDate = '2026-03-04';
      recordStudySession(testExamCode, {
        domains: ['domain-a'],
        duration: 60,
        topics: ['topic-1'],
        date: sessionDate
      });

      const domainProgress = getDomainProgress(testExamCode, 'domain-a');

      expect(domainProgress.lastStudied).toBe(sessionDate);
    });

    test('returns zero values for unstudied domain', () => {
      const domainProgress = getDomainProgress(testExamCode, 'nonexistent-domain');

      expect(domainProgress.studyTime).toBe(0);
      expect(domainProgress.quizAverage).toBe(0);
      expect(domainProgress.attempts).toBe(0);
      expect(domainProgress.lastStudied).toBeNull();
    });

    test('tracks last studied date across multiple sessions', () => {
      recordStudySession(testExamCode, {
        domains: ['domain-a'],
        duration: 60,
        topics: ['topic-1'],
        date: '2026-03-04'
      });
      recordStudySession(testExamCode, {
        domains: ['domain-a'],
        duration: 30,
        topics: ['topic-2'],
        date: '2026-03-06'
      });

      const domainProgress = getDomainProgress(testExamCode, 'domain-a');

      expect(domainProgress.lastStudied).toBe('2026-03-06');
    });
  });

  describe('Security and Validation Tests', () => {
    describe('Path Traversal Prevention', () => {
      test('rejects path traversal attempt with ../', () => {
        expect(() => {
          initializeProgress('../../../etc/passwd', { examDate: '2026-06-01' });
        }).toThrow('Invalid exam code: only alphanumeric characters, hyphens, and underscores allowed');
      });

      test('rejects path traversal with absolute path', () => {
        expect(() => {
          loadProgress('/etc/passwd');
        }).toThrow('Invalid exam code: only alphanumeric characters, hyphens, and underscores allowed');
      });

      test('rejects exam code with forward slashes', () => {
        expect(() => {
          initializeProgress('test/exam/code', { examDate: '2026-06-01' });
        }).toThrow('Invalid exam code: only alphanumeric characters, hyphens, and underscores allowed');
      });

      test('rejects exam code with backslashes', () => {
        expect(() => {
          loadProgress('test\\exam\\code');
        }).toThrow('Invalid exam code: only alphanumeric characters, hyphens, and underscores allowed');
      });
    });

    describe('Exam Code Validation', () => {
      test('rejects null exam code', () => {
        expect(() => {
          initializeProgress(null, { examDate: '2026-06-01' });
        }).toThrow('Invalid exam code: must be a non-empty string');
      });

      test('rejects undefined exam code', () => {
        expect(() => {
          loadProgress(undefined);
        }).toThrow('Invalid exam code: must be a non-empty string');
      });

      test('rejects empty string exam code', () => {
        expect(() => {
          initializeProgress('', { examDate: '2026-06-01' });
        }).toThrow('Invalid exam code: must be a non-empty string');
      });

      test('rejects numeric exam code', () => {
        expect(() => {
          loadProgress(12345);
        }).toThrow('Invalid exam code: must be a non-empty string');
      });

      test('rejects exam code with special characters', () => {
        expect(() => {
          initializeProgress('exam@code!', { examDate: '2026-06-01' });
        }).toThrow('Invalid exam code: only alphanumeric characters, hyphens, and underscores allowed');
      });

      test('accepts valid exam code with alphanumeric, hyphens, and underscores', () => {
        const validCode = 'valid-exam_code123';
        expect(() => {
          initializeProgress(validCode, { examDate: '2026-06-01' });
        }).not.toThrow();
      });
    });

    describe('Session Data Validation', () => {
      beforeEach(() => {
        initializeProgress(testExamCode, { examDate: '2026-06-01' });
      });

      test('rejects empty domains array', () => {
        expect(() => {
          recordStudySession(testExamCode, {
            domains: [],
            duration: 60,
            topics: ['topic-1'],
            date: '2026-03-04'
          });
        }).toThrow('Invalid session data: domains must be a non-empty array');
      });

      test('rejects null domains', () => {
        expect(() => {
          recordStudySession(testExamCode, {
            domains: null,
            duration: 60,
            topics: ['topic-1'],
            date: '2026-03-04'
          });
        }).toThrow('Invalid session data: domains must be a non-empty array');
      });

      test('rejects non-array domains', () => {
        expect(() => {
          recordStudySession(testExamCode, {
            domains: 'domain-a',
            duration: 60,
            topics: ['topic-1'],
            date: '2026-03-04'
          });
        }).toThrow('Invalid session data: domains must be a non-empty array');
      });

      test('rejects zero duration', () => {
        expect(() => {
          recordStudySession(testExamCode, {
            domains: ['domain-a'],
            duration: 0,
            topics: ['topic-1'],
            date: '2026-03-04'
          });
        }).toThrow('Invalid session data: duration must be a positive number');
      });

      test('rejects negative duration', () => {
        expect(() => {
          recordStudySession(testExamCode, {
            domains: ['domain-a'],
            duration: -60,
            topics: ['topic-1'],
            date: '2026-03-04'
          });
        }).toThrow('Invalid session data: duration must be a positive number');
      });

      test('rejects non-numeric duration', () => {
        expect(() => {
          recordStudySession(testExamCode, {
            domains: ['domain-a'],
            duration: '60',
            topics: ['topic-1'],
            date: '2026-03-04'
          });
        }).toThrow('Invalid session data: duration must be a positive number');
      });

      test('rejects null session data', () => {
        expect(() => {
          recordStudySession(testExamCode, null);
        }).toThrow('Invalid session data: must be an object');
      });
    });

    describe('Quiz Data Validation', () => {
      beforeEach(() => {
        initializeProgress(testExamCode, { examDate: '2026-06-01' });
      });

      test('rejects score above 100', () => {
        expect(() => {
          recordQuizAttempt(testExamCode, {
            domain: 'domain-a',
            score: 150,
            total: 20,
            correct: 17,
            date: '2026-03-04'
          });
        }).toThrow('Invalid quiz data: score must be a number between 0 and 100');
      });

      test('rejects negative score', () => {
        expect(() => {
          recordQuizAttempt(testExamCode, {
            domain: 'domain-a',
            score: -10,
            total: 20,
            correct: 17,
            date: '2026-03-04'
          });
        }).toThrow('Invalid quiz data: score must be a number between 0 and 100');
      });

      test('rejects non-numeric score', () => {
        expect(() => {
          recordQuizAttempt(testExamCode, {
            domain: 'domain-a',
            score: '85',
            total: 20,
            correct: 17,
            date: '2026-03-04'
          });
        }).toThrow('Invalid quiz data: score must be a number between 0 and 100');
      });

      test('rejects zero total', () => {
        expect(() => {
          recordQuizAttempt(testExamCode, {
            domain: 'domain-a',
            score: 85,
            total: 0,
            correct: 17,
            date: '2026-03-04'
          });
        }).toThrow('Invalid quiz data: total must be a positive number');
      });

      test('rejects negative total', () => {
        expect(() => {
          recordQuizAttempt(testExamCode, {
            domain: 'domain-a',
            score: 85,
            total: -20,
            correct: 17,
            date: '2026-03-04'
          });
        }).toThrow('Invalid quiz data: total must be a positive number');
      });

      test('rejects negative correct', () => {
        expect(() => {
          recordQuizAttempt(testExamCode, {
            domain: 'domain-a',
            score: 85,
            total: 20,
            correct: -5,
            date: '2026-03-04'
          });
        }).toThrow('Invalid quiz data: correct must be a non-negative number');
      });

      test('rejects empty domain', () => {
        expect(() => {
          recordQuizAttempt(testExamCode, {
            domain: '',
            score: 85,
            total: 20,
            correct: 17,
            date: '2026-03-04'
          });
        }).toThrow('Invalid quiz data: domain must be a non-empty string');
      });

      test('rejects null domain', () => {
        expect(() => {
          recordQuizAttempt(testExamCode, {
            domain: null,
            score: 85,
            total: 20,
            correct: 17,
            date: '2026-03-04'
          });
        }).toThrow('Invalid quiz data: domain must be a non-empty string');
      });

      test('rejects null quiz data', () => {
        expect(() => {
          recordQuizAttempt(testExamCode, null);
        }).toThrow('Invalid quiz data: must be an object');
      });

      test('accepts valid quiz data with boundary values', () => {
        expect(() => {
          recordQuizAttempt(testExamCode, {
            domain: 'domain-a',
            score: 0,
            total: 1,
            correct: 0,
            date: '2026-03-04'
          });
        }).not.toThrow();

        expect(() => {
          recordQuizAttempt(testExamCode, {
            domain: 'domain-b',
            score: 100,
            total: 1,
            correct: 1,
            date: '2026-03-04'
          });
        }).not.toThrow();
      });
    });

    describe('Validation in All Functions', () => {
      test('getProgressSummary validates exam code', () => {
        expect(() => {
          getProgressSummary('../../../etc/passwd');
        }).toThrow('Invalid exam code');
      });

      test('getDomainProgress validates exam code', () => {
        expect(() => {
          getDomainProgress('/etc/passwd', 'domain-a');
        }).toThrow('Invalid exam code');
      });

      test('recordStudySession validates exam code', () => {
        expect(() => {
          recordStudySession('invalid@code', {
            domains: ['domain-a'],
            duration: 60,
            topics: ['topic-1'],
            date: '2026-03-04'
          });
        }).toThrow('Invalid exam code');
      });

      test('recordQuizAttempt validates exam code', () => {
        expect(() => {
          recordQuizAttempt('test/code', {
            domain: 'domain-a',
            score: 85,
            total: 20,
            correct: 17,
            date: '2026-03-04'
          });
        }).toThrow('Invalid exam code');
      });
    });
  });
});
