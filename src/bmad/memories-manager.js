const fs = require('fs');
const path = require('path');

/**
 * BMAD Memories Manager - Manages the memories.md file for state persistence
 *
 * Memories.md stores state between sessions including:
 * - Weak areas and remediation plans
 * - Recently studied topics
 * - Session history
 * - Learning progress and patterns
 */

const MEMORY_BASE_PATH = path.join(__dirname, '../../../_bmad/_memory');
const MEMORIES_FILE = path.join(MEMORY_BASE_PATH, 'memories.md');

/**
 * Ensure memory directory exists
 */
function ensureMemoryDirectory() {
  if (!fs.existsSync(MEMORY_BASE_PATH)) {
    fs.mkdirSync(MEMORY_BASE_PATH, { recursive: true });
  }
}

/**
 * Initialize default memories.md structure if it doesn't exist
 * @returns {string} The initialized memories content
 */
function initializeMemories() {
  ensureMemoryDirectory();

  const defaultContent = `# BMAD Memories - RIMS Exam Prep

## Weak Areas & Remediation

_Topics that need focused attention based on quiz performance_

- None identified yet

## Recently Studied Topics

_Topics covered in recent study sessions, ready for testing_

- None yet

## Session History

_Record of recent study sessions and progress_

**Last Session:** None yet
**Last Topic:** N/A
**Duration:** 0 minutes
**Next Steps:** Begin first study session

## Learning Progress

_Mastery levels by topic (0-5 scale)_

- No topics studied yet

## User Preferences & Learning Style

_Observed patterns in how the student learns best_

- **Teaching Style:** Not yet determined
- **Preferred Modalities:** Not yet observed
- **Best Times:** Not tracked
- **Pacing:** Not established

## Emotional & Motivational State

_Track stress, confidence, and motivation levels_

- **Confidence Level:** Not assessed
- **Stress Indicators:** None observed
- **Motivation:** Not tracked
- **Recent Wins:** None yet

## Cross-Agent Communication

### From Theodore (Evaluator)
_Weak concepts, error types, confidence levels_

- No evaluation data yet

### To Simon (Mock Exam Generator)
_Ready-for-testing topics, shaky concepts, focus requests_

- No topics ready for testing yet

### From Alvin (Study Assistant)
_Study session outcomes, concept mastery_

- No study sessions completed yet

---

_Last Updated:_ ${new Date().toISOString()}
`;

  fs.writeFileSync(MEMORIES_FILE, defaultContent, 'utf8');
  return defaultContent;
}

/**
 * Load memories from memories.md
 * @returns {string} The memories content, or creates default if doesn't exist
 */
function loadMemories() {
  ensureMemoryDirectory();

  if (!fs.existsSync(MEMORIES_FILE)) {
    return initializeMemories();
  }

  try {
    return fs.readFileSync(MEMORIES_FILE, 'utf8');
  } catch (error) {
    throw new Error(`Failed to load memories: ${error.message}`);
  }
}

/**
 * Parse memories into sections
 * @param {string} memoriesContent - The memories.md content
 * @returns {Object} Sections mapped by heading
 */
function parseMemories(memoriesContent) {
  const sections = {};
  const lines = memoriesContent.split('\n');
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    // Check for ## headings (main sections)
    if (line.startsWith('## ')) {
      // Save previous section
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      // Start new section
      currentSection = line.substring(3).trim();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return sections;
}

/**
 * Update a specific section in memories
 * @param {string} sectionName - The section heading (without ##)
 * @param {string} newContent - The new content for the section
 * @returns {string} The updated memories content
 */
function updateMemories(sectionName, newContent) {
  const currentMemories = loadMemories();
  const sections = parseMemories(currentMemories);

  // Update the section
  sections[sectionName] = newContent;

  // Rebuild memories.md
  const lines = ['# BMAD Memories - RIMS Exam Prep', ''];

  for (const [section, content] of Object.entries(sections)) {
    lines.push(`## ${section}`);
    lines.push('');
    lines.push(content);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push(`_Last Updated:_ ${new Date().toISOString()}`);
  lines.push('');

  const updatedContent = lines.join('\n');
  fs.writeFileSync(MEMORIES_FILE, updatedContent, 'utf8');

  return updatedContent;
}

/**
 * Append an entry to a list-based section
 * @param {string} sectionName - The section heading
 * @param {string} entry - The entry to append (will be formatted as bullet)
 * @returns {string} The updated memories content
 */
function appendToSection(sectionName, entry) {
  const currentMemories = loadMemories();
  const sections = parseMemories(currentMemories);

  let sectionContent = sections[sectionName] || '';

  // Remove "None yet" or similar placeholders
  if (sectionContent.includes('None yet') ||
      sectionContent.includes('None identified yet') ||
      sectionContent.includes('No topics studied yet') ||
      sectionContent.includes('No evaluation data yet') ||
      sectionContent.includes('No study sessions completed yet')) {
    sectionContent = '';
  }

  // Add new entry as bullet point
  const formattedEntry = entry.startsWith('-') ? entry : `- ${entry}`;

  if (sectionContent.trim()) {
    sectionContent = `${sectionContent}\n${formattedEntry}`;
  } else {
    sectionContent = formattedEntry;
  }

  return updateMemories(sectionName, sectionContent);
}

/**
 * Update session history section
 * @param {Object} sessionData - { topic, duration, date, masteryLevel, nextSteps }
 * @returns {string} The updated memories content
 */
function updateSessionHistory(sessionData) {
  const { topic, duration, date, masteryLevel, nextSteps } = sessionData;

  const sessionContent = `**Last Session:** ${date}
**Last Topic:** ${topic}
**Duration:** ${duration} minutes
**Mastery Level:** ${masteryLevel}/5
**Next Steps:** ${nextSteps}`;

  return updateMemories('Session History', sessionContent);
}

/**
 * Add a weak area
 * @param {Object} weakArea - { topic, averageScore, attempts, reason }
 * @returns {string} The updated memories content
 */
function addWeakArea(weakArea) {
  const { topic, averageScore, attempts, reason } = weakArea;
  const entry = `**${topic}** (${averageScore}% avg, ${attempts} attempts) - ${reason}`;
  return appendToSection('Weak Areas & Remediation', entry);
}

/**
 * Add a recently studied topic
 * @param {Object} studyData - { topic, date, confidence, readyForTesting }
 * @returns {string} The updated memories content
 */
function addRecentlyStudied(studyData) {
  const { topic, date, confidence, readyForTesting } = studyData;
  const status = readyForTesting ? '✓ Ready for testing' : '○ Needs more practice';
  const entry = `**${topic}** (${date}) - Confidence: ${confidence}/5 - ${status}`;
  return appendToSection('Recently Studied Topics', entry);
}

/**
 * Update learning progress for a topic
 * @param {string} topic - The topic name
 * @param {number} masteryLevel - Mastery level 0-5
 * @param {string} notes - Optional notes
 * @returns {string} The updated memories content
 */
function updateLearningProgress(topic, masteryLevel, notes = '') {
  const currentMemories = loadMemories();
  const sections = parseMemories(currentMemories);

  let progressContent = sections['Learning Progress'] || '';

  // Remove placeholder
  if (progressContent.includes('No topics studied yet')) {
    progressContent = '';
  }

  // Parse existing progress entries
  const lines = progressContent.split('\n').filter(line => line.trim());
  const progressMap = {};

  // Build map of existing progress
  lines.forEach(line => {
    const match = line.match(/^-\s+\*\*(.+?)\*\*.*:\s+(\d)/);
    if (match) {
      const [, topicName, level] = match;
      progressMap[topicName] = { level: parseInt(level), line };
    }
  });

  // Update or add the topic
  const stars = '★'.repeat(masteryLevel) + '☆'.repeat(5 - masteryLevel);
  const notesPart = notes ? ` - ${notes}` : '';
  const entry = `- **${topic}** Mastery: ${masteryLevel}/5 ${stars}${notesPart}`;

  progressMap[topic] = { level: masteryLevel, line: entry };

  // Rebuild progress section sorted by mastery (highest first)
  const sortedEntries = Object.values(progressMap)
    .sort((a, b) => b.level - a.level)
    .map(item => item.line);

  const newProgressContent = sortedEntries.join('\n');
  return updateMemories('Learning Progress', newProgressContent);
}

/**
 * Add cross-agent communication entry
 * @param {string} fromAgent - Agent name (Theodore, Simon, Alvin)
 * @param {string} message - The message content
 * @returns {string} The updated memories content
 */
function addAgentCommunication(fromAgent, message) {
  const sectionName = `From ${fromAgent} (${fromAgent === 'Theodore' ? 'Evaluator' :
                                              fromAgent === 'Simon' ? 'Mock Exam Generator' :
                                              'Study Assistant'})`;
  return appendToSection('Cross-Agent Communication', `### ${sectionName}\n${message}`);
}

/**
 * Get a specific section from memories
 * @param {string} sectionName - The section heading
 * @returns {string} The section content
 */
function getSection(sectionName) {
  const memories = loadMemories();
  const sections = parseMemories(memories);
  return sections[sectionName] || '';
}

/**
 * Clear a section (replace with placeholder)
 * @param {string} sectionName - The section heading
 * @param {string} placeholder - Optional placeholder text
 * @returns {string} The updated memories content
 */
function clearSection(sectionName, placeholder = 'None yet') {
  return updateMemories(sectionName, placeholder);
}

module.exports = {
  loadMemories,
  initializeMemories,
  updateMemories,
  appendToSection,
  updateSessionHistory,
  addWeakArea,
  addRecentlyStudied,
  updateLearningProgress,
  addAgentCommunication,
  getSection,
  clearSection,
  parseMemories
};
