const { loadExam, buildExamContext } = require('../core/engine/exam-loader');
const { loadProgress, getProgressSummary, getDomainProgress } = require('../core/engine/progress-tracker');
const path = require('path');

/**
 * BMAD Context Builder - Builds structured context for workflow execution
 *
 * Combines exam configuration, user progress, domain resources, and memories
 * into structured objects that workflows can consume.
 */

const EXAMS_PATH = path.join(__dirname, '../../exams');

/**
 * Build context for a study session
 * @param {string} examCode - The exam code
 * @param {string} domain - The domain code to study (optional)
 * @returns {Object} Structured context for study session
 */
function buildStudyContext(examCode, domain = null) {
  // Load exam configuration
  const exam = loadExam(examCode, EXAMS_PATH);
  const examContext = buildExamContext(exam);

  // Load user progress
  const progress = loadProgress(examCode);
  if (!progress) {
    throw new Error(`Progress not initialized for exam: ${examCode}. Run setup first.`);
  }

  const progressSummary = getProgressSummary(examCode);

  // Build domain-specific context if domain provided
  let domainContext = null;
  let domainResources = [];
  if (domain) {
    domainContext = getDomainProgress(examCode, domain);

    // Get resources for this domain
    if (examContext.resourceMap[domain]) {
      domainResources = examContext.resourceMap[domain];
    }

    // Add domain metadata
    if (examContext.domainMap[domain]) {
      domainContext.metadata = examContext.domainMap[domain];
    }
  }

  // Identify weak areas (domains with < 70% average)
  const weakAreas = progressSummary.weakDomains.map(domainCode => {
    const domainData = progress.domainProgress[domainCode];
    const domainInfo = examContext.domainMap[domainCode];

    return {
      domainCode,
      domainName: domainInfo ? domainInfo.name : domainCode,
      averageScore: domainData.averageScore,
      attempts: domainData.quizAttempts,
      studyTime: domainData.studyTime
    };
  });

  // Get recently studied topics (last 5 sessions)
  const recentSessions = progress.sessions.slice(-5).map(session => ({
    date: session.date,
    domains: session.domains,
    duration: session.duration,
    topics: session.topics || []
  }));

  return {
    examConfig: {
      code: exam.code,
      name: exam.name,
      format: exam.format,
      domains: exam.domains
    },
    userProgress: {
      totalHours: progressSummary.totalHours,
      readiness: progressSummary.readiness,
      quizAverage: progressSummary.quizAverage,
      domainProgress: progress.domainProgress
    },
    currentDomain: domainContext,
    domainResources: domainResources,
    weakAreas: weakAreas,
    recentSessions: recentSessions,
    additionalNotes: domain
      ? `Focus area: ${domain} - ${examContext.domainMap[domain]?.name || domain}`
      : 'General study session - domain to be selected by student'
  };
}

/**
 * Build context for quiz generation
 * @param {string} examCode - The exam code
 * @param {Object} options - Options { domain, questionCount, focusWeak }
 * @returns {Object} Structured context for quiz generation
 */
function buildQuizContext(examCode, options = {}) {
  const {
    domain = null,
    questionCount = 10,
    focusWeak = true,
    batchInfo = null
  } = options;

  // Load exam configuration
  const exam = loadExam(examCode, EXAMS_PATH);
  const examContext = buildExamContext(exam);

  // Load user progress
  const progress = loadProgress(examCode);
  if (!progress) {
    throw new Error(`Progress not initialized for exam: ${examCode}. Run setup first.`);
  }

  const progressSummary = getProgressSummary(examCode);

  // Identify weak areas
  const weakAreas = progressSummary.weakDomains.map(domainCode => {
    const domainData = progress.domainProgress[domainCode];
    const domainInfo = examContext.domainMap[domainCode];

    return {
      domainCode,
      domainName: domainInfo ? domainInfo.name : domainCode,
      averageScore: domainData.averageScore,
      attempts: domainData.quizAttempts,
      studyTime: domainData.studyTime,
      priority: domainData.averageScore < 60 ? 'high' : 'medium'
    };
  });

  // Sort weak areas by priority (lowest score first)
  weakAreas.sort((a, b) => a.averageScore - b.averageScore);

  // Determine target domains for quiz
  let targetDomains = [];
  if (domain) {
    // Specific domain requested
    targetDomains = [domain];
  } else if (focusWeak && weakAreas.length > 0) {
    // Focus on weak areas
    targetDomains = weakAreas.slice(0, 3).map(area => area.domainCode);
  } else {
    // All domains
    targetDomains = exam.domains.map(d => d.code);
  }

  // Get recently studied topics
  const recentSessions = progress.sessions.slice(-5).map(session => ({
    date: session.date,
    domains: session.domains,
    topics: session.topics || []
  }));

  // Get resources for target domains
  const relevantResources = {};
  targetDomains.forEach(domainCode => {
    if (examContext.resourceMap[domainCode]) {
      relevantResources[domainCode] = examContext.resourceMap[domainCode];
    }
  });

  // Build additional notes with batch information
  let additionalNotes;
  if (batchInfo) {
    additionalNotes = `Full RIMS-CRMP Exam Simulation - Batch ${batchInfo.currentBatch} of ${batchInfo.totalBatches}\n` +
      `This is part of a ${batchInfo.totalQuestions}-question exam simulation.\n` +
      `Generate ${questionCount} questions for this batch.\n` +
      `Note: Batched to work within Claude Code output token limits.`;
  } else {
    additionalNotes = focusWeak && weakAreas.length > 0
      ? `Focusing on weak areas: ${weakAreas.map(a => a.domainName).join(', ')}`
      : domain
        ? `Specific domain quiz: ${examContext.domainMap[domain]?.name || domain}`
        : 'Comprehensive quiz across all domains';
  }

  return {
    examConfig: {
      code: exam.code,
      name: exam.name,
      format: exam.format,
      domains: exam.domains
    },
    userProgress: {
      totalHours: progressSummary.totalHours,
      readiness: progressSummary.readiness,
      quizAverage: progressSummary.quizAverage,
      domainProgress: progress.domainProgress
    },
    quizParameters: {
      targetDomains: targetDomains,
      questionCount: questionCount,
      focusWeak: focusWeak,
      difficulty: progressSummary.quizAverage >= 80 ? 'hard' :
                  progressSummary.quizAverage >= 70 ? 'medium' : 'easy',
      batchInfo: batchInfo  // Include batch information if present
    },
    weakAreas: weakAreas,
    recentSessions: recentSessions,
    relevantResources: relevantResources,
    additionalNotes: additionalNotes
  };
}

/**
 * Build context for exam evaluation
 * @param {string} examCode - The exam code
 * @param {Object} examResults - The exam results to evaluate
 * @returns {Object} Structured context for evaluation
 */
function buildEvaluationContext(examCode, examResults) {
  // Load exam configuration
  const exam = loadExam(examCode, EXAMS_PATH);
  const examContext = buildExamContext(exam);

  // Load user progress
  const progress = loadProgress(examCode);
  if (!progress) {
    throw new Error(`Progress not initialized for exam: ${examCode}. Run setup first.`);
  }

  const progressSummary = getProgressSummary(examCode);

  // Get recent quiz history for comparison
  const recentQuizzes = progress.quizHistory.slice(-5).map(quiz => ({
    date: quiz.date,
    domain: quiz.domain,
    score: quiz.score,
    total: quiz.total
  }));

  return {
    examConfig: {
      code: exam.code,
      name: exam.name,
      format: exam.format,
      domains: exam.domains
    },
    userProgress: {
      totalHours: progressSummary.totalHours,
      readiness: progressSummary.readiness,
      quizAverage: progressSummary.quizAverage,
      domainProgress: progress.domainProgress
    },
    examResults: examResults,
    recentQuizzes: recentQuizzes,
    additionalNotes: 'Evaluate performance and identify areas for improvement'
  };
}

module.exports = {
  buildStudyContext,
  buildQuizContext,
  buildEvaluationContext
};
