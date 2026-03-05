#!/usr/bin/env node

/**
 * BMAD Integration Demo
 *
 * This script demonstrates the BMAD workflow integration capabilities:
 * 1. Loading workflows and agent specs
 * 2. Building context from exam data
 * 3. Combining into complete prompts
 * 4. Managing memories
 */

const bmad = require('./src/bmad');

console.log('='.repeat(80));
console.log('BMAD WORKFLOW INTEGRATION DEMO');
console.log('='.repeat(80));
console.log();

// 1. List available workflows and agents
console.log('1. AVAILABLE WORKFLOWS AND AGENTS');
console.log('-'.repeat(80));

const workflows = bmad.listWorkflows();
console.log(`Found ${workflows.length} workflows:`);
workflows.forEach(w => console.log(`  - ${w}`));
console.log();

const agents = bmad.listAgents();
console.log(`Found ${agents.length} agents:`);
agents.forEach(a => console.log(`  - ${a}`));
console.log();

// 2. Load a workflow and agent
console.log('2. LOADING WORKFLOW AND AGENT');
console.log('-'.repeat(80));

try {
  const studyWorkflow = bmad.loadWorkflow('study-session');
  console.log(`✓ Loaded study-session workflow (${studyWorkflow.length} chars)`);
  console.log(`  Preview: ${studyWorkflow.substring(0, 100)}...`);
  console.log();

  const alvinAgent = bmad.loadAgent('alvin');
  console.log(`✓ Loaded alvin agent spec (${alvinAgent.length} chars)`);
  console.log(`  Preview: ${alvinAgent.substring(0, 100)}...`);
  console.log();
} catch (error) {
  console.error('✗ Error loading workflow/agent:', error.message);
  console.log();
}

// 3. Initialize and manage memories
console.log('3. MEMORIES MANAGEMENT');
console.log('-'.repeat(80));

try {
  bmad.initializeMemories();
  console.log('✓ Initialized memories.md');

  bmad.addWeakArea({
    topic: 'Risk Financing',
    averageScore: 65,
    attempts: 3,
    reason: 'Struggles with insurance concepts'
  });
  console.log('✓ Added weak area: Risk Financing');

  bmad.addRecentlyStudied({
    topic: 'Risk Assessment',
    date: new Date().toISOString(),
    confidence: 4,
    readyForTesting: true
  });
  console.log('✓ Added recently studied: Risk Assessment');

  bmad.updateLearningProgress('COSO ERM Framework', 5, 'Complete mastery');
  console.log('✓ Updated learning progress: COSO ERM Framework');

  const weakAreas = bmad.getSection('Weak Areas & Remediation');
  console.log(`✓ Retrieved weak areas section (${weakAreas.length} chars)`);
  console.log();
} catch (error) {
  console.error('✗ Error managing memories:', error.message);
  console.log();
}

// 4. Build prompt example
console.log('4. BUILD COMPLETE WORKFLOW PROMPT');
console.log('-'.repeat(80));

try {
  const workflow = bmad.loadWorkflow('study-session');
  const agent = bmad.loadAgent('alvin');
  const memories = bmad.loadMemories();

  const context = {
    examConfig: {
      code: 'RIMS-CRMP',
      name: 'Certified Risk Management Professional',
      domains: [
        { code: 'RA', name: 'Risk Assessment', weight: 20 },
        { code: 'RF', name: 'Risk Financing', weight: 20 },
        { code: 'RC', name: 'Risk Control', weight: 20 },
        { code: 'AL', name: 'Administrative Leadership', weight: 20 },
        { code: 'LS', name: 'Legal & Standards', weight: 20 }
      ]
    },
    userProgress: {
      totalHours: 12.5,
      readiness: 72,
      quizAverage: 72,
      domainProgress: {
        'RA': { studyTime: 180, quizAttempts: 3, averageScore: 80 },
        'RF': { studyTime: 120, quizAttempts: 2, averageScore: 65 }
      }
    },
    weakAreas: [
      {
        domainCode: 'RF',
        domainName: 'Risk Financing',
        averageScore: 65,
        attempts: 2
      }
    ],
    memories: memories,
    additionalNotes: 'Focus session on Risk Financing domain'
  };

  const prompt = bmad.buildWorkflowPrompt(workflow, agent, context);
  console.log(`✓ Built complete prompt (${prompt.length} chars)`);
  console.log();
  console.log('Prompt structure:');
  console.log('  - Agent Specification (Alvin personality & principles)');
  console.log('  - Workflow Instructions (study-session steps)');
  console.log('  - Current Context (exam config, progress, memories)');
  console.log();
  console.log('Prompt preview (first 500 chars):');
  console.log('-'.repeat(80));
  console.log(prompt.substring(0, 500));
  console.log('...');
  console.log('-'.repeat(80));
  console.log();
} catch (error) {
  console.error('✗ Error building prompt:', error.message);
  console.log();
}

// 5. Workflow status (requires actual exam data)
console.log('5. WORKFLOW STATUS');
console.log('-'.repeat(80));
console.log('Workflow status requires initialized exam progress data.');
console.log('Run the exam-prep setup to initialize progress, then:');
console.log('  const status = bmad.getWorkflowStatus("rims-crmp");');
console.log('This will provide:');
console.log('  - Current progress summary');
console.log('  - Weak areas identification');
console.log('  - Workflow recommendations (study, quiz, remediation)');
console.log();

console.log('='.repeat(80));
console.log('DEMO COMPLETE');
console.log('='.repeat(80));
console.log();
console.log('Next steps:');
console.log('1. Initialize exam progress: exam-prep setup');
console.log('2. Use bmad.executeStudySession() to prepare prompts for Claude');
console.log('3. Use bmad.executeQuizGeneration() to generate quizzes');
console.log('4. Update memories after each session');
console.log();
