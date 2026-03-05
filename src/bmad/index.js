/**
 * BMAD Integration Layer - Main Export
 *
 * This module provides the complete BMAD workflow integration for the exam-prep CLI.
 * It combines workflow loading, context building, memories management, and execution.
 */

const workflowLoader = require('./workflow-loader');
const contextBuilder = require('./context-builder');
const memoriesManager = require('./memories-manager');
const bmadExecutor = require('./bmad-executor');

module.exports = {
  // Workflow Loader
  loadWorkflow: workflowLoader.loadWorkflow,
  loadAgent: workflowLoader.loadAgent,
  buildWorkflowPrompt: workflowLoader.buildWorkflowPrompt,
  listWorkflows: workflowLoader.listWorkflows,
  listAgents: workflowLoader.listAgents,

  // Context Builder
  buildStudyContext: contextBuilder.buildStudyContext,
  buildQuizContext: contextBuilder.buildQuizContext,
  buildEvaluationContext: contextBuilder.buildEvaluationContext,

  // Memories Manager
  loadMemories: memoriesManager.loadMemories,
  initializeMemories: memoriesManager.initializeMemories,
  updateMemories: memoriesManager.updateMemories,
  appendToSection: memoriesManager.appendToSection,
  updateSessionHistory: memoriesManager.updateSessionHistory,
  addWeakArea: memoriesManager.addWeakArea,
  addRecentlyStudied: memoriesManager.addRecentlyStudied,
  updateLearningProgress: memoriesManager.updateLearningProgress,
  addAgentCommunication: memoriesManager.addAgentCommunication,
  getSection: memoriesManager.getSection,
  clearSection: memoriesManager.clearSection,
  parseMemories: memoriesManager.parseMemories,

  // BMAD Executor
  executeStudySession: bmadExecutor.executeStudySession,
  executeQuizGeneration: bmadExecutor.executeQuizGeneration,
  executeEvaluation: bmadExecutor.executeEvaluation,
  executeTargetedRemediation: bmadExecutor.executeTargetedRemediation,
  recordStudySessionCompletion: bmadExecutor.recordStudySessionCompletion,
  getWorkflowStatus: bmadExecutor.getWorkflowStatus
};
