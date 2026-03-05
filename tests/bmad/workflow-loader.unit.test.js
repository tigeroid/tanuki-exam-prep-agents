const fs = require('fs');
const path = require('path');
const { loadWorkflow, loadAgent, buildWorkflowPrompt, listWorkflows, listAgents } = require('../../src/bmad/workflow-loader');

describe('Workflow Loader', () => {
  describe('loadWorkflow', () => {
    test('should load study-session workflow', () => {
      const content = loadWorkflow('study-session');
      expect(content).toBeTruthy();
      expect(typeof content).toBe('string');
      expect(content).toContain('Study Session Workflow');
    });

    test('should throw error for non-existent workflow', () => {
      expect(() => {
        loadWorkflow('non-existent-workflow');
      }).toThrow('Workflow not found');
    });

    test('should reject path traversal attempts', () => {
      expect(() => {
        loadWorkflow('../../../etc/passwd');
      }).toThrow('Invalid name');
    });

    test('should reject invalid workflow names', () => {
      expect(() => {
        loadWorkflow('workflow/with/slashes');
      }).toThrow('Invalid name');
    });
  });

  describe('loadAgent', () => {
    test('should load alvin agent spec', () => {
      const content = loadAgent('alvin');
      expect(content).toBeTruthy();
      expect(typeof content).toBe('string');
      expect(content).toContain('Agent Specification: Alvin');
    });

    test('should load simon agent spec', () => {
      const content = loadAgent('simon');
      expect(content).toBeTruthy();
      expect(content).toContain('Agent Specification: Simon');
    });

    test('should load theodore agent spec', () => {
      const content = loadAgent('theodore');
      expect(content).toBeTruthy();
      expect(content).toContain('Agent Specification: Theodore');
    });

    test('should throw error for non-existent agent', () => {
      expect(() => {
        loadAgent('non-existent-agent');
      }).toThrow('Agent spec not found');
    });

    test('should reject path traversal attempts', () => {
      expect(() => {
        loadAgent('../../../etc/passwd');
      }).toThrow('Invalid name');
    });
  });

  describe('buildWorkflowPrompt', () => {
    test('should combine workflow, agent, and context into prompt', () => {
      const workflow = '# Test Workflow\nStep 1: Do something';
      const agent = '# Test Agent\nPersonality: Helpful';
      const context = {
        examConfig: { code: 'RIMS-CRMP', name: 'RIMS-CRMP' },
        userProgress: { totalHours: 5, quizAverage: 75 }
      };

      const prompt = buildWorkflowPrompt(workflow, agent, context);

      expect(prompt).toContain('# Agent Specification');
      expect(prompt).toContain('# Test Agent');
      expect(prompt).toContain('# Workflow Instructions');
      expect(prompt).toContain('# Test Workflow');
      expect(prompt).toContain('# Current Context');
      expect(prompt).toContain('RIMS-CRMP');
      expect(prompt).toContain('Now begin the workflow execution');
    });

    test('should include exam config in prompt', () => {
      const context = {
        examConfig: { code: 'TEST', name: 'Test Exam' }
      };

      const prompt = buildWorkflowPrompt('workflow', 'agent', context);
      expect(prompt).toContain('## Exam Configuration');
      expect(prompt).toContain('TEST');
    });

    test('should include user progress in prompt', () => {
      const context = {
        userProgress: { totalHours: 10, quizAverage: 80 }
      };

      const prompt = buildWorkflowPrompt('workflow', 'agent', context);
      expect(prompt).toContain('## User Progress');
      expect(prompt).toContain('"totalHours": 10');
    });

    test('should include weak areas when present', () => {
      const context = {
        weakAreas: [
          { domainCode: 'RA', domainName: 'Risk Assessment', averageScore: 65 }
        ]
      };

      const prompt = buildWorkflowPrompt('workflow', 'agent', context);
      expect(prompt).toContain('## Identified Weak Areas');
      expect(prompt).toContain('Risk Assessment');
    });

    test('should include memories when present', () => {
      const context = {
        memories: '## Recent Sessions\n- Session 1: Risk Assessment'
      };

      const prompt = buildWorkflowPrompt('workflow', 'agent', context);
      expect(prompt).toContain('## Memories from Previous Sessions');
      expect(prompt).toContain('Recent Sessions');
    });
  });

  describe('listWorkflows', () => {
    test('should return array of workflow names', () => {
      const workflows = listWorkflows();
      expect(Array.isArray(workflows)).toBe(true);
      expect(workflows.length).toBeGreaterThan(0);
    });

    test('should include study-session workflow', () => {
      const workflows = listWorkflows();
      expect(workflows).toContain('study-session');
    });

    test('should include generate-mock-exam workflow', () => {
      const workflows = listWorkflows();
      expect(workflows).toContain('generate-mock-exam');
    });
  });

  describe('listAgents', () => {
    test('should return array of agent names', () => {
      const agents = listAgents();
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
    });

    test('should include all three chipmunks', () => {
      const agents = listAgents();
      expect(agents).toContain('alvin');
      expect(agents).toContain('simon');
      expect(agents).toContain('theodore');
    });

    test('should not include .spec.md extension', () => {
      const agents = listAgents();
      agents.forEach(agent => {
        expect(agent).not.toContain('.spec.md');
      });
    });
  });
});
