const fs = require('fs');
const path = require('path');

/**
 * Progress Tracker - Tracks study sessions, quiz attempts, and domain mastery
 */

// Base path for progress data
const PROGRESS_BASE_PATH = path.join(__dirname, '../../../user-data/progress');

/**
 * Validate exam code for security
 * @param {string} examCode - The exam code to validate
 * @throws {Error} If exam code is invalid
 */
function validateExamCode(examCode) {
  if (!examCode || typeof examCode !== 'string') {
    throw new Error('Invalid exam code: must be a non-empty string');
  }
  if (!/^[a-zA-Z0-9-_]+$/.test(examCode)) {
    throw new Error('Invalid exam code: only alphanumeric characters, hyphens, and underscores allowed');
  }
}

/**
 * Validate session data
 * @param {Object} sessionData - The session data to validate
 * @throws {Error} If session data is invalid
 */
function validateSessionData(sessionData) {
  if (!sessionData || typeof sessionData !== 'object') {
    throw new Error('Invalid session data: must be an object');
  }
  if (!Array.isArray(sessionData.domains) || sessionData.domains.length === 0) {
    throw new Error('Invalid session data: domains must be a non-empty array');
  }
  if (typeof sessionData.duration !== 'number' || sessionData.duration <= 0) {
    throw new Error('Invalid session data: duration must be a positive number');
  }
}

/**
 * Validate quiz data
 * @param {Object} quizData - The quiz data to validate
 * @throws {Error} If quiz data is invalid
 */
function validateQuizData(quizData) {
  if (!quizData || typeof quizData !== 'object') {
    throw new Error('Invalid quiz data: must be an object');
  }
  if (!quizData.domain || typeof quizData.domain !== 'string') {
    throw new Error('Invalid quiz data: domain must be a non-empty string');
  }
  if (typeof quizData.score !== 'number' || quizData.score < 0 || quizData.score > 100) {
    throw new Error('Invalid quiz data: score must be a number between 0 and 100');
  }
  if (typeof quizData.total !== 'number' || quizData.total <= 0) {
    throw new Error('Invalid quiz data: total must be a positive number');
  }
  if (typeof quizData.correct !== 'number' || quizData.correct < 0) {
    throw new Error('Invalid quiz data: correct must be a non-negative number');
  }
}

/**
 * Ensure progress directory exists
 */
function ensureProgressDirectory() {
  if (!fs.existsSync(PROGRESS_BASE_PATH)) {
    fs.mkdirSync(PROGRESS_BASE_PATH, { recursive: true });
  }
}

/**
 * Get path to progress file for an exam
 * @param {string} examCode - The exam code
 * @returns {string} Path to progress file
 */
function getProgressFilePath(examCode) {
  return path.join(PROGRESS_BASE_PATH, `${examCode}.json`);
}

/**
 * Initialize new progress tracking for an exam
 * @param {string} examCode - The exam code
 * @param {Object} userProfile - User profile data (examDate, studyHoursPerWeek, etc.)
 * @returns {Object} The initialized progress object
 */
function initializeProgress(examCode, userProfile) {
  validateExamCode(examCode);
  ensureProgressDirectory();

  const now = new Date().toISOString();
  const progress = {
    examCode: examCode,
    userProfile: userProfile,
    createdAt: now,
    updatedAt: now,
    sessions: [],
    quizHistory: [],
    domainProgress: {}
  };

  // Save to file
  const filePath = getProgressFilePath(examCode);
  fs.writeFileSync(filePath, JSON.stringify(progress, null, 2), 'utf8');

  return progress;
}

/**
 * Load existing progress for an exam
 * @param {string} examCode - The exam code
 * @returns {Object|null} The progress object, or null if not found
 */
function loadProgress(examCode) {
  validateExamCode(examCode);
  const filePath = getProgressFilePath(examCode);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    throw new Error(`Failed to load progress: ${error.message}`);
  }
}

/**
 * Save progress to file
 * @param {Object} progress - The progress object to save
 */
function saveProgress(progress) {
  ensureProgressDirectory();

  progress.updatedAt = new Date().toISOString();
  const filePath = getProgressFilePath(progress.examCode);
  fs.writeFileSync(filePath, JSON.stringify(progress, null, 2), 'utf8');
}

/**
 * Initialize domain progress if it doesn't exist
 * @param {Object} progress - The progress object
 * @param {string} domainCode - The domain code
 */
function ensureDomainProgress(progress, domainCode) {
  if (!progress.domainProgress[domainCode]) {
    progress.domainProgress[domainCode] = {
      studyTime: 0,
      quizAttempts: 0,
      averageScore: 0
    };
  }
}

/**
 * Record a study session
 * @param {string} examCode - The exam code
 * @param {Object} sessionData - Session data { domains, duration, topics, date }
 * @returns {Object} Updated progress object
 */
function recordStudySession(examCode, sessionData) {
  validateExamCode(examCode);
  validateSessionData(sessionData);
  const progress = loadProgress(examCode);

  if (!progress) {
    throw new Error(`Progress not found for exam: ${examCode}`);
  }

  // Add session to history
  progress.sessions.push(sessionData);

  // Update domain progress
  const { domains, duration } = sessionData;
  const timePerDomain = duration / domains.length;

  domains.forEach(domainCode => {
    ensureDomainProgress(progress, domainCode);
    progress.domainProgress[domainCode].studyTime += timePerDomain;
  });

  // Save progress
  saveProgress(progress);

  return progress;
}

/**
 * Record a quiz attempt
 * @param {string} examCode - The exam code
 * @param {Object} quizData - Quiz data { domain, score, total, correct, date }
 * @returns {Object} Updated progress object
 */
function recordQuizAttempt(examCode, quizData) {
  validateExamCode(examCode);
  validateQuizData(quizData);
  const progress = loadProgress(examCode);

  if (!progress) {
    throw new Error(`Progress not found for exam: ${examCode}`);
  }

  // Add quiz to history
  progress.quizHistory.push(quizData);

  // Update domain progress
  const { domain, score } = quizData;
  ensureDomainProgress(progress, domain);

  const domainProgress = progress.domainProgress[domain];
  const currentTotal = domainProgress.averageScore * domainProgress.quizAttempts;
  domainProgress.quizAttempts += 1;
  domainProgress.averageScore = (currentTotal + score) / domainProgress.quizAttempts;

  // Save progress
  saveProgress(progress);

  return progress;
}

/**
 * Get progress summary
 * @param {string} examCode - The exam code
 * @returns {Object} Summary { totalHours, readiness, weakDomains, quizAverage }
 */
function getProgressSummary(examCode) {
  validateExamCode(examCode);
  const progress = loadProgress(examCode);

  if (!progress) {
    throw new Error(`Progress not found for exam: ${examCode}`);
  }

  // Calculate total study hours
  const totalMinutes = progress.sessions.reduce((sum, session) => sum + session.duration, 0);
  const totalHours = totalMinutes / 60;

  // Calculate overall quiz average
  let quizAverage = 0;
  if (progress.quizHistory.length > 0) {
    const totalScore = progress.quizHistory.reduce((sum, quiz) => sum + quiz.score, 0);
    quizAverage = totalScore / progress.quizHistory.length;
  }

  // Identify weak domains (< 70%)
  const weakDomains = [];
  Object.keys(progress.domainProgress).forEach(domainCode => {
    const domainData = progress.domainProgress[domainCode];
    if (domainData.quizAttempts > 0 && domainData.averageScore < 70) {
      weakDomains.push(domainCode);
    }
  });

  // Calculate readiness percentage (based on quiz average)
  const readiness = quizAverage;

  return {
    totalHours,
    readiness,
    weakDomains,
    quizAverage
  };
}

/**
 * Get detailed domain progress
 * @param {string} examCode - The exam code
 * @param {string} domainCode - The domain code
 * @returns {Object} Domain progress { studyTime, quizAverage, attempts, lastStudied }
 */
function getDomainProgress(examCode, domainCode) {
  validateExamCode(examCode);
  const progress = loadProgress(examCode);

  if (!progress) {
    throw new Error(`Progress not found for exam: ${examCode}`);
  }

  // Get domain progress data
  const domainData = progress.domainProgress[domainCode] || {
    studyTime: 0,
    quizAttempts: 0,
    averageScore: 0
  };

  // Find last studied date
  let lastStudied = null;
  for (let i = progress.sessions.length - 1; i >= 0; i--) {
    const session = progress.sessions[i];
    if (session.domains.includes(domainCode)) {
      lastStudied = session.date;
      break;
    }
  }

  return {
    studyTime: domainData.studyTime,
    quizAverage: domainData.averageScore,
    attempts: domainData.quizAttempts,
    lastStudied: lastStudied
  };
}

module.exports = {
  initializeProgress,
  loadProgress,
  recordStudySession,
  recordQuizAttempt,
  getProgressSummary,
  getDomainProgress
};
