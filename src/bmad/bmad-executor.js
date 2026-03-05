/**
 * BMAD Executor - Main entry point for executing BMAD workflows with Claude
 *
 * This module orchestrates the execution of BMAD workflows by:
 * 1. Loading workflow and agent specifications
 * 2. Building context from exam data, progress, and memories
 * 3. Combining everything into a complete prompt
 * 4. Calling Claude API to execute the workflow
 * 5. Updating progress and memories after completion
 *
 * NOTE: This module provides the structure for BMAD integration.
 * The actual Claude API calls will be handled by the CLI environment
 * which has access to the Anthropic SDK.
 */

const { loadWorkflow, loadAgent, buildWorkflowPrompt } = require('./workflow-loader');
const { buildStudyContext, buildQuizContext, buildEvaluationContext } = require('./context-builder');
const { loadMemories, updateSessionHistory, addRecentlyStudied } = require('./memories-manager');
const { recordStudySession } = require('../core/engine/progress-tracker');

/**
 * Execute a study session workflow with Alvin
 * @param {string} examCode - The exam code
 * @param {Object} options - Options { domain }
 * @returns {Object} Execution context { prompt, metadata }
 */
function executeStudySession(examCode, options = {}) {
  const { domain = null } = options;

  try {
    // 1. Load workflow and agent
    const workflowContent = loadWorkflow('study-session');
    const agentContent = loadAgent('alvin');

    // 2. Build context
    const context = buildStudyContext(examCode, domain);

    // 3. Load memories
    const memories = loadMemories();
    context.memories = memories;

    // 4. Build complete prompt
    const prompt = buildWorkflowPrompt(workflowContent, agentContent, context);

    // 5. Return execution package
    return {
      prompt: prompt,
      metadata: {
        workflow: 'study-session',
        agent: 'alvin',
        examCode: examCode,
        domain: domain,
        timestamp: new Date().toISOString()
      },
      context: context
    };
  } catch (error) {
    throw new Error(`Failed to prepare study session: ${error.message}`);
  }
}

/**
 * Execute a quiz generation workflow with Simon
 * @param {string} examCode - The exam code
 * @param {Object} options - Options { domain, questionCount, focusWeak }
 * @returns {Object} Execution context { prompt, metadata }
 */
function executeQuizGeneration(examCode, options = {}) {
  try {
    // 1. Load workflow and agent
    const workflowContent = loadWorkflow('generate-mock-exam');
    const agentContent = loadAgent('simon');

    // 2. Build context
    const context = buildQuizContext(examCode, options);

    // 3. Load memories
    const memories = loadMemories();
    context.memories = memories;

    // 4. Build complete prompt
    const prompt = buildWorkflowPrompt(workflowContent, agentContent, context);

    // 5. Return execution package
    return {
      prompt: prompt,
      metadata: {
        workflow: 'generate-mock-exam',
        agent: 'simon',
        examCode: examCode,
        options: options,
        timestamp: new Date().toISOString()
      },
      context: context
    };
  } catch (error) {
    throw new Error(`Failed to prepare quiz generation: ${error.message}`);
  }
}

/**
 * Execute an exam evaluation workflow with Theodore
 * @param {string} examCode - The exam code
 * @param {Object} examResults - The exam results to evaluate
 * @returns {Object} Execution context { prompt, metadata }
 */
function executeEvaluation(examCode, examResults) {
  try {
    // 1. Load workflow and agent
    const workflowContent = loadWorkflow('evaluate-exam');
    const agentContent = loadAgent('theodore');

    // 2. Build context
    const context = buildEvaluationContext(examCode, examResults);

    // 3. Load memories
    const memories = loadMemories();
    context.memories = memories;

    // 4. Build complete prompt
    const prompt = buildWorkflowPrompt(workflowContent, agentContent, context);

    // 5. Return execution package
    return {
      prompt: prompt,
      metadata: {
        workflow: 'evaluate-exam',
        agent: 'theodore',
        examCode: examCode,
        timestamp: new Date().toISOString()
      },
      context: context
    };
  } catch (error) {
    throw new Error(`Failed to prepare exam evaluation: ${error.message}`);
  }
}

/**
 * Execute targeted remediation workflow with Alvin
 * @param {string} examCode - The exam code
 * @param {string} weakArea - The weak area domain code
 * @returns {Object} Execution context { prompt, metadata }
 */
function executeTargetedRemediation(examCode, weakArea) {
  try {
    // 1. Load workflow and agent
    const workflowContent = loadWorkflow('targeted-remediation');
    const agentContent = loadAgent('alvin');

    // 2. Build context (use study context with specific domain)
    const context = buildStudyContext(examCode, weakArea);

    // 3. Load memories
    const memories = loadMemories();
    context.memories = memories;

    // Add note that this is remediation
    context.additionalNotes = `REMEDIATION SESSION: This topic was identified as a weak area. Focus on addressing gaps and building confidence.`;

    // 4. Build complete prompt
    const prompt = buildWorkflowPrompt(workflowContent, agentContent, context);

    // 5. Return execution package
    return {
      prompt: prompt,
      metadata: {
        workflow: 'targeted-remediation',
        agent: 'alvin',
        examCode: examCode,
        weakArea: weakArea,
        timestamp: new Date().toISOString()
      },
      context: context
    };
  } catch (error) {
    throw new Error(`Failed to prepare targeted remediation: ${error.message}`);
  }
}

/**
 * Record completion of a study session
 * This is called after the workflow completes successfully
 * @param {string} examCode - The exam code
 * @param {Object} sessionData - { domain, duration, topics, masteryLevel }
 */
function recordStudySessionCompletion(examCode, sessionData) {
  const { domain, duration, topics, masteryLevel } = sessionData;

  // Record in progress tracker
  recordStudySession(examCode, {
    domains: [domain],
    duration: duration,
    topics: topics,
    date: new Date().toISOString()
  });

  // Update session history in memories
  updateSessionHistory({
    topic: domain,
    duration: duration,
    date: new Date().toISOString(),
    masteryLevel: masteryLevel,
    nextSteps: 'Ready for quiz on this topic with Simon'
  });

  // Mark as recently studied
  addRecentlyStudied({
    topic: domain,
    date: new Date().toISOString(),
    confidence: masteryLevel,
    readyForTesting: masteryLevel >= 3
  });
}

/**
 * Get workflow status and recommendations
 * @param {string} examCode - The exam code
 * @returns {Object} Status and recommendations
 */
function getWorkflowStatus(examCode) {
  try {
    const context = buildStudyContext(examCode);
    const memories = loadMemories();

    const recommendations = [];

    // Check if user has weak areas
    if (context.weakAreas.length > 0) {
      recommendations.push({
        workflow: 'targeted-remediation',
        agent: 'alvin',
        priority: 'high',
        reason: `You have ${context.weakAreas.length} weak area(s) that need attention`,
        domains: context.weakAreas.map(a => a.domainCode)
      });
    }

    // Check if ready for quiz
    if (context.recentSessions.length > 0) {
      const lastSession = context.recentSessions[context.recentSessions.length - 1];
      recommendations.push({
        workflow: 'generate-mock-exam',
        agent: 'simon',
        priority: 'medium',
        reason: `Test your knowledge from recent study session`,
        domains: lastSession.domains
      });
    }

    // Check overall readiness
    if (context.userProgress.quizAverage >= 85) {
      recommendations.push({
        workflow: 'custom-exam-builder',
        agent: 'simon',
        priority: 'low',
        reason: 'You\'re doing great! Try a challenging custom exam',
        domains: []
      });
    } else if (context.userProgress.quizAverage < 70) {
      recommendations.push({
        workflow: 'study-session',
        agent: 'alvin',
        priority: 'high',
        reason: 'Focus on building foundational knowledge',
        domains: context.weakAreas.map(a => a.domainCode)
      });
    }

    return {
      examCode: examCode,
      currentProgress: {
        totalHours: context.userProgress.totalHours,
        quizAverage: context.userProgress.quizAverage,
        readiness: context.userProgress.readiness
      },
      weakAreas: context.weakAreas,
      recentSessions: context.recentSessions,
      recommendations: recommendations,
      memories: memories
    };
  } catch (error) {
    throw new Error(`Failed to get workflow status: ${error.message}`);
  }
}

module.exports = {
  executeStudySession,
  executeQuizGeneration,
  executeEvaluation,
  executeTargetedRemediation,
  recordStudySessionCompletion,
  getWorkflowStatus
};
