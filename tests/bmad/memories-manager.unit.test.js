const fs = require('fs');
const path = require('path');
const {
  loadMemories,
  initializeMemories,
  parseMemories,
  updateMemories,
  appendToSection,
  updateSessionHistory,
  addWeakArea,
  addRecentlyStudied,
  updateLearningProgress,
  getSection,
  clearSection
} = require('../../src/bmad/memories-manager');

describe('Memories Manager', () => {
  const MEMORY_PATH = path.join(__dirname, '../../../_bmad/_memory/memories.md');

  // Clean up memories file before each test
  beforeEach(() => {
    if (fs.existsSync(MEMORY_PATH)) {
      fs.unlinkSync(MEMORY_PATH);
    }
  });

  describe('initializeMemories', () => {
    test('should create memories.md with default structure', () => {
      const content = initializeMemories();
      expect(content).toBeTruthy();
      expect(content).toContain('# BMAD Memories - RIMS Exam Prep');
      expect(content).toContain('## Weak Areas & Remediation');
      expect(content).toContain('## Recently Studied Topics');
      expect(content).toContain('## Session History');
      expect(content).toContain('## Learning Progress');
    });

    test('should create memories file on disk', () => {
      initializeMemories();
      expect(fs.existsSync(MEMORY_PATH)).toBe(true);
    });
  });

  describe('loadMemories', () => {
    test('should initialize memories if file does not exist', () => {
      const content = loadMemories();
      expect(content).toContain('# BMAD Memories');
      expect(fs.existsSync(MEMORY_PATH)).toBe(true);
    });

    test('should load existing memories', () => {
      // Create initial memories
      initializeMemories();

      // Load them back
      const content = loadMemories();
      expect(content).toContain('# BMAD Memories');
    });
  });

  describe('parseMemories', () => {
    test('should parse memories into sections', () => {
      const content = `# BMAD Memories

## Section One
Content for section one

## Section Two
Content for section two
`;

      const sections = parseMemories(content);
      expect(sections['Section One']).toContain('Content for section one');
      expect(sections['Section Two']).toContain('Content for section two');
    });

    test('should handle empty sections', () => {
      const content = `# BMAD Memories

## Empty Section

## Another Section
Some content
`;

      const sections = parseMemories(content);
      expect(sections['Empty Section']).toBe('');
      expect(sections['Another Section']).toContain('Some content');
    });
  });

  describe('updateMemories', () => {
    test('should update a specific section', () => {
      initializeMemories();

      const updated = updateMemories('Session History', 'New session data');
      expect(updated).toContain('## Session History');
      expect(updated).toContain('New session data');
    });

    test('should preserve other sections when updating one', () => {
      initializeMemories();

      updateMemories('Session History', 'Updated history');
      const content = loadMemories();

      expect(content).toContain('## Weak Areas & Remediation');
      expect(content).toContain('## Learning Progress');
      expect(content).toContain('Updated history');
    });
  });

  describe('appendToSection', () => {
    test('should append entry to empty section', () => {
      initializeMemories();

      appendToSection('Recently Studied Topics', 'Risk Assessment - 2024-03-04');
      const section = getSection('Recently Studied Topics');

      expect(section).toContain('Risk Assessment');
    });

    test('should append to existing entries', () => {
      initializeMemories();

      appendToSection('Recently Studied Topics', 'Topic 1');
      appendToSection('Recently Studied Topics', 'Topic 2');

      const section = getSection('Recently Studied Topics');
      expect(section).toContain('Topic 1');
      expect(section).toContain('Topic 2');
    });

    test('should format entries as bullets', () => {
      initializeMemories();

      appendToSection('Recently Studied Topics', 'Risk Assessment');
      const section = getSection('Recently Studied Topics');

      expect(section).toMatch(/^-\s+Risk Assessment/m);
    });

    test('should remove placeholder text', () => {
      initializeMemories();

      appendToSection('Recently Studied Topics', 'First real topic');
      const section = getSection('Recently Studied Topics');

      expect(section).not.toContain('None yet');
      expect(section).toContain('First real topic');
    });
  });

  describe('updateSessionHistory', () => {
    test('should update session history with structured data', () => {
      initializeMemories();

      updateSessionHistory({
        topic: 'Risk Assessment',
        duration: 45,
        date: '2024-03-04',
        masteryLevel: 4,
        nextSteps: 'Take quiz on this topic'
      });

      const section = getSection('Session History');
      expect(section).toContain('Risk Assessment');
      expect(section).toContain('45 minutes');
      expect(section).toContain('4/5');
    });
  });

  describe('addWeakArea', () => {
    test('should add weak area with details', () => {
      initializeMemories();

      addWeakArea({
        topic: 'Risk Financing',
        averageScore: 65,
        attempts: 3,
        reason: 'Struggles with insurance concepts'
      });

      const section = getSection('Weak Areas & Remediation');
      expect(section).toContain('Risk Financing');
      expect(section).toContain('65%');
      expect(section).toContain('3 attempts');
    });
  });

  describe('addRecentlyStudied', () => {
    test('should add recently studied topic', () => {
      initializeMemories();

      addRecentlyStudied({
        topic: 'Risk Assessment',
        date: '2024-03-04',
        confidence: 4,
        readyForTesting: true
      });

      const section = getSection('Recently Studied Topics');
      expect(section).toContain('Risk Assessment');
      expect(section).toContain('Ready for testing');
    });

    test('should mark as needs practice when not ready', () => {
      initializeMemories();

      addRecentlyStudied({
        topic: 'Risk Assessment',
        date: '2024-03-04',
        confidence: 2,
        readyForTesting: false
      });

      const section = getSection('Recently Studied Topics');
      expect(section).toContain('Needs more practice');
    });
  });

  describe('updateLearningProgress', () => {
    test('should add new topic to learning progress', () => {
      initializeMemories();

      updateLearningProgress('Risk Assessment', 4, 'Strong understanding');

      const section = getSection('Learning Progress');
      expect(section).toContain('Risk Assessment');
      expect(section).toContain('4/5');
      expect(section).toContain('★★★★☆');
    });

    test('should update existing topic mastery', () => {
      initializeMemories();

      updateLearningProgress('Risk Assessment', 3);
      updateLearningProgress('Risk Assessment', 5);

      const section = getSection('Learning Progress');
      expect(section).toContain('5/5');
      expect(section).toContain('★★★★★');
    });

    test('should sort topics by mastery level', () => {
      initializeMemories();

      updateLearningProgress('Topic A', 3);
      updateLearningProgress('Topic B', 5);
      updateLearningProgress('Topic C', 4);

      const section = getSection('Learning Progress');
      const lines = section.split('\n');
      const topicLines = lines.filter(line => line.includes('**Topic'));

      // Topic B (5/5) should come before Topic C (4/5) and Topic A (3/5)
      const indexB = topicLines.findIndex(line => line.includes('Topic B'));
      const indexC = topicLines.findIndex(line => line.includes('Topic C'));
      const indexA = topicLines.findIndex(line => line.includes('Topic A'));

      expect(indexB).toBeLessThan(indexC);
      expect(indexC).toBeLessThan(indexA);
    });
  });

  describe('getSection', () => {
    test('should retrieve specific section content', () => {
      initializeMemories();
      updateMemories('Session History', 'Test content');

      const section = getSection('Session History');
      expect(section).toContain('Test content');
    });

    test('should return empty string for non-existent section', () => {
      initializeMemories();

      const section = getSection('Non Existent Section');
      expect(section).toBe('');
    });
  });

  describe('clearSection', () => {
    test('should clear section and add placeholder', () => {
      initializeMemories();
      appendToSection('Recently Studied Topics', 'Topic 1');
      appendToSection('Recently Studied Topics', 'Topic 2');

      clearSection('Recently Studied Topics', 'Cleared');

      const section = getSection('Recently Studied Topics');
      expect(section).toBe('Cleared');
      expect(section).not.toContain('Topic 1');
    });
  });
});
