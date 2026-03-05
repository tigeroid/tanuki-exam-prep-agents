const fs = require('fs');
const path = require('path');

/**
 * BMAD Workflow Loader - Loads workflows and agent specs as text prompts
 *
 * BMAD workflows are markdown files that serve as prompts for Claude.
 * They are loaded as text and combined with agent specs and context.
 */

// Base paths for BMAD components
const BMAD_BASE_PATH = path.join(__dirname, '../../../_bmad');
const WORKFLOWS_PATH = path.join(BMAD_BASE_PATH, 'rims-prep/workflows');
const AGENTS_PATH = path.join(BMAD_BASE_PATH, 'rims-prep/agents');

/**
 * Validate workflow/agent name for security
 * @param {string} name - The name to validate
 * @throws {Error} If name is invalid
 */
function validateName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Invalid name: must be a non-empty string');
  }
  // Prevent path traversal
  if (name.includes('..') || name.includes(path.sep) || name.includes('/') || name.includes('\\')) {
    throw new Error('Invalid name: path traversal detected');
  }
  // Only allow alphanumeric, hyphens, and underscores
  if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
    throw new Error('Invalid name: only alphanumeric characters, hyphens, and underscores allowed');
  }
}

/**
 * Load a workflow markdown file as text
 * @param {string} workflowName - The workflow name (directory name)
 * @returns {string} The workflow content as text
 * @throws {Error} If workflow not found or cannot be read
 */
function loadWorkflow(workflowName) {
  validateName(workflowName);

  const workflowPath = path.join(WORKFLOWS_PATH, workflowName, 'workflow.md');

  if (!fs.existsSync(workflowPath)) {
    throw new Error(`Workflow not found: ${workflowName} (expected at ${workflowPath})`);
  }

  try {
    return fs.readFileSync(workflowPath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to load workflow ${workflowName}: ${error.message}`);
  }
}

/**
 * Load an agent specification file as text
 * @param {string} agentName - The agent name (e.g., 'alvin', 'simon', 'theodore')
 * @returns {string} The agent spec content as text
 * @throws {Error} If agent spec not found or cannot be read
 */
function loadAgent(agentName) {
  validateName(agentName);

  const agentPath = path.join(AGENTS_PATH, `${agentName}.spec.md`);

  if (!fs.existsSync(agentPath)) {
    throw new Error(`Agent spec not found: ${agentName} (expected at ${agentPath})`);
  }

  try {
    return fs.readFileSync(agentPath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to load agent ${agentName}: ${error.message}`);
  }
}

/**
 * Build a complete prompt by combining agent spec, workflow, and context
 * @param {string} workflowContent - The workflow markdown content
 * @param {string} agentContent - The agent spec markdown content
 * @param {Object} context - The context object with current state
 * @returns {string} The complete prompt for Claude
 */
function buildWorkflowPrompt(workflowContent, agentContent, context) {
  const sections = [];

  // Section 1: Agent Specification (defines personality and behavior)
  sections.push('# Agent Specification');
  sections.push('');
  sections.push(agentContent);
  sections.push('');
  sections.push('---');
  sections.push('');

  // Section 2: Workflow Instructions (the actual steps to execute)
  sections.push('# Workflow Instructions');
  sections.push('');
  sections.push(workflowContent);
  sections.push('');
  sections.push('---');
  sections.push('');

  // Section 3: Current Context (exam data, progress, resources, memories)
  sections.push('# Current Context');
  sections.push('');

  if (context.examConfig) {
    sections.push('## Exam Configuration');
    sections.push('```json');
    sections.push(JSON.stringify(context.examConfig, null, 2));
    sections.push('```');
    sections.push('');
  }

  if (context.userProgress) {
    sections.push('## User Progress');
    sections.push('```json');
    sections.push(JSON.stringify(context.userProgress, null, 2));
    sections.push('```');
    sections.push('');
  }

  if (context.domainResources) {
    sections.push('## Domain Resources');
    sections.push('```json');
    sections.push(JSON.stringify(context.domainResources, null, 2));
    sections.push('```');
    sections.push('');
  }

  if (context.weakAreas && context.weakAreas.length > 0) {
    sections.push('## Identified Weak Areas');
    sections.push('```json');
    sections.push(JSON.stringify(context.weakAreas, null, 2));
    sections.push('```');
    sections.push('');
  }

  if (context.memories) {
    sections.push('## Memories from Previous Sessions');
    sections.push('');
    sections.push(context.memories);
    sections.push('');
  }

  if (context.additionalNotes) {
    sections.push('## Additional Notes');
    sections.push('');
    sections.push(context.additionalNotes);
    sections.push('');
  }

  sections.push('---');
  sections.push('');
  sections.push('Now begin the workflow execution based on the instructions above.');
  sections.push('');

  return sections.join('\n');
}

/**
 * List available workflows
 * @returns {Array<string>} Array of workflow names
 */
function listWorkflows() {
  if (!fs.existsSync(WORKFLOWS_PATH)) {
    return [];
  }

  const entries = fs.readdirSync(WORKFLOWS_PATH, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => {
      // Only include if it has a workflow.md file
      const workflowFile = path.join(WORKFLOWS_PATH, name, 'workflow.md');
      return fs.existsSync(workflowFile);
    });
}

/**
 * List available agents
 * @returns {Array<string>} Array of agent names (without .spec.md extension)
 */
function listAgents() {
  if (!fs.existsSync(AGENTS_PATH)) {
    return [];
  }

  const entries = fs.readdirSync(AGENTS_PATH);
  return entries
    .filter(entry => entry.endsWith('.spec.md'))
    .map(entry => entry.replace('.spec.md', ''));
}

module.exports = {
  loadWorkflow,
  loadAgent,
  buildWorkflowPrompt,
  listWorkflows,
  listAgents
};
