# BMAD Workflow Integration Layer

This module provides complete integration with BMAD (Base Module for Agent Development) workflows for the exam-prep CLI. It enables the CLI to execute sophisticated learning workflows powered by specialized AI agents.

## Overview

The BMAD integration layer combines:
- **Workflow Loading**: Loads workflow instructions from markdown files
- **Agent Specifications**: Loads agent personality and behavior specs
- **Context Building**: Combines exam data, progress, and resources
- **Memories Management**: Persists state between sessions
- **Execution Orchestration**: Prepares complete prompts for Claude

## Architecture

```
src/bmad/
├── workflow-loader.js     # Load workflows & agents from _bmad/rims-prep/
├── context-builder.js     # Build context from exam data & progress
├── memories-manager.js    # Manage memories.md state persistence
├── bmad-executor.js       # Main execution orchestrator
└── index.js              # Public API exports
```

## Components

### 1. Workflow Loader (`workflow-loader.js`)

Loads BMAD workflows and agent specifications as text.

```javascript
const { loadWorkflow, loadAgent, buildWorkflowPrompt } = require('./bmad/workflow-loader');

// Load workflow instructions
const workflow = loadWorkflow('study-session');

// Load agent personality
const agent = loadAgent('alvin');

// Combine into complete prompt
const prompt = buildWorkflowPrompt(workflow, agent, context);
```

**Key Functions:**
- `loadWorkflow(name)` - Loads workflow.md from _bmad/rims-prep/workflows/{name}/
- `loadAgent(name)` - Loads {name}.spec.md from _bmad/rims-prep/agents/
- `buildWorkflowPrompt(workflow, agent, context)` - Combines all parts into prompt
- `listWorkflows()` - Lists all available workflows
- `listAgents()` - Lists all available agents (alvin, simon, theodore)

### 2. Context Builder (`context-builder.js`)

Builds structured context from exam configuration, user progress, and resources.

```javascript
const { buildStudyContext, buildQuizContext } = require('./bmad/context-builder');

// Build context for study session
const context = buildStudyContext('rims-crmp', 'RA');

// Build context for quiz generation
const quizContext = buildQuizContext('rims-crmp', {
  questionCount: 15,
  focusWeak: true
});
```

**Key Functions:**
- `buildStudyContext(examCode, domain)` - Context for study sessions
- `buildQuizContext(examCode, options)` - Context for quiz generation
- `buildEvaluationContext(examCode, results)` - Context for exam evaluation

**Context Structure:**
```javascript
{
  examConfig: { code, name, domains, format },
  userProgress: { totalHours, quizAverage, readiness, domainProgress },
  domainResources: [...],
  weakAreas: [...],
  recentSessions: [...],
  memories: "...",
  additionalNotes: "..."
}
```

### 3. Memories Manager (`memories-manager.js`)

Manages `_bmad/_memory/memories.md` for state persistence between sessions.

```javascript
const { loadMemories, addWeakArea, updateLearningProgress } = require('./bmad/memories-manager');

// Load current memories
const memories = loadMemories();

// Add weak area
addWeakArea({
  topic: 'Risk Financing',
  averageScore: 65,
  attempts: 3,
  reason: 'Struggles with insurance concepts'
});

// Update learning progress
updateLearningProgress('COSO ERM', 5, 'Complete mastery');
```

**Key Functions:**
- `loadMemories()` - Load memories.md (creates if missing)
- `updateMemories(section, content)` - Update specific section
- `appendToSection(section, entry)` - Append to list-based sections
- `updateSessionHistory(data)` - Update session history
- `addWeakArea(weakArea)` - Add identified weak area
- `addRecentlyStudied(studyData)` - Mark topic as recently studied
- `updateLearningProgress(topic, level, notes)` - Update topic mastery
- `getSection(section)` - Retrieve specific section content

**Memories Structure:**
- Weak Areas & Remediation
- Recently Studied Topics
- Session History
- Learning Progress
- User Preferences & Learning Style
- Emotional & Motivational State
- Cross-Agent Communication

### 4. BMAD Executor (`bmad-executor.js`)

Main orchestrator for workflow execution. Prepares complete prompts ready for Claude.

```javascript
const { executeStudySession, executeQuizGeneration } = require('./bmad/bmad-executor');

// Prepare study session
const execution = executeStudySession('rims-crmp', { domain: 'RA' });
// Returns: { prompt, metadata, context }

// Prepare quiz generation
const quiz = executeQuizGeneration('rims-crmp', {
  questionCount: 15,
  focusWeak: true
});
```

**Key Functions:**
- `executeStudySession(examCode, options)` - Prepare study session with Alvin
- `executeQuizGeneration(examCode, options)` - Prepare quiz with Simon
- `executeEvaluation(examCode, results)` - Prepare evaluation with Theodore
- `executeTargetedRemediation(examCode, weakArea)` - Prepare remediation with Alvin
- `recordStudySessionCompletion(examCode, data)` - Record completed session
- `getWorkflowStatus(examCode)` - Get status and recommendations

## Available Workflows

Located in `_bmad/rims-prep/workflows/`:

1. **study-session** - Interactive learning with Socratic dialogue
2. **generate-mock-exam** - Generate practice questions
3. **evaluate-exam** - Analyze exam results and identify weak areas
4. **targeted-remediation** - Focus on specific weak areas
5. **create-learning-path** - Create personalized study plan
6. **scenario-deep-dive** - Work through complex case studies
7. **custom-exam-builder** - Build custom practice exams
8. **index-course-materials** - Scan and catalog study materials
9. **progress-report** - Generate progress reports
10. **workflow-status** - Show workflow status and recommendations

## Available Agents

Located in `_bmad/rims-prep/agents/`:

1. **Alvin** (`alvin.spec.md`) - Study Assistant & Teaching Mentor
   - Personality: Energetic, Socratic, encouraging
   - Role: Interactive learning through dialogue and pattern recognition
   - Workflows: study-session, targeted-remediation, create-learning-path

2. **Simon** (`simon.spec.md`) - Mock Exam Generator
   - Personality: Professional, fair, precise
   - Role: Generate practice questions and exams
   - Workflows: generate-mock-exam, custom-exam-builder

3. **Theodore** (`theodore.spec.md`) - Evaluator & Performance Analyst
   - Personality: Analytical, detailed, constructive
   - Role: Analyze performance and identify improvement areas
   - Workflows: evaluate-exam, progress-report

## Usage Example

Complete workflow execution:

```javascript
const bmad = require('./src/bmad');

// 1. Initialize memories (first time)
bmad.initializeMemories();

// 2. Prepare study session
const execution = bmad.executeStudySession('rims-crmp', {
  domain: 'RA' // Risk Assessment
});

// 3. The execution object contains:
console.log(execution.prompt);      // Complete prompt for Claude
console.log(execution.metadata);    // Workflow metadata
console.log(execution.context);     // Full context used

// 4. Pass prompt to Claude (via CLI environment)
// ... Claude executes the workflow ...

// 5. After session completes, record it
bmad.recordStudySessionCompletion('rims-crmp', {
  domain: 'RA',
  duration: 45,
  topics: ['Risk Identification', 'Risk Analysis'],
  masteryLevel: 4
});

// 6. Memories are automatically updated
const updatedMemories = bmad.loadMemories();
```

## Integration with CLI

The CLI commands use BMAD integration like this:

```javascript
// In src/cli/commands/study.js
const bmad = require('../../bmad');

async function studyCommand(examCode, options) {
  // Prepare the workflow
  const execution = bmad.executeStudySession(examCode, options);

  // Display to user
  console.log('Starting study session with Alvin...');

  // Pass to Claude (handled by Claude Code environment)
  // The prompt becomes the system prompt for Claude
  // Claude executes the workflow interactively

  // After completion, record it
  bmad.recordStudySessionCompletion(examCode, sessionData);
}
```

## File Paths

**BMAD Root:** `/path/to/_bmad/`
- Workflows: `_bmad/rims-prep/workflows/{name}/workflow.md`
- Agents: `_bmad/rims-prep/agents/{name}.spec.md`
- Memories: `_bmad/_memory/memories.md`

**Exam Data:** `/path/to/exam-prep/`
- Exams: `exam-prep/exams/{exam-code}/exam.yaml`
- Progress: `exam-prep/user-data/progress/{exam-code}.json`

## Security

All file paths are validated to prevent path traversal:
- Only alphanumeric, hyphens, and underscores allowed in names
- Path separators rejected
- Files loaded from specific base directories only

## Testing

Run unit tests:
```bash
npm run test:unit -- tests/bmad/
```

Run demo:
```bash
node demo-bmad.js
```

## Module Stats

- **Total Lines:** ~1,151 lines of code
- **Files:** 5 modules + 1 index
- **Size:** ~34KB total
- **Test Coverage:** Workflow loader and memories manager

## Next Steps

1. Integrate with CLI commands (study, quiz, progress)
2. Add streaming support for real-time Claude responses
3. Implement progress tracking after workflow completion
4. Add workflow chaining (study → quiz → evaluation)
5. Build workflow recommendation engine

---

**Created:** 2026-03-04
**Module:** exam-prep/src/bmad
**Purpose:** BMAD workflow integration for AI-powered exam preparation
