const chalk = require('chalk');
const { loadProgress, getProgressSummary } = require('../../core/engine/progress-tracker');

function execute() {
  console.log(chalk.blue('Progress'));
  console.log('━'.repeat(40));

  try {
    // Try to load progress for rims-crmp exam
    const progress = loadProgress('rims-crmp');

    if (!progress || progress.sessions.length === 0 && progress.quizHistory.length === 0) {
      console.log(chalk.yellow('\nNo data yet'));
      return;
    }

    // Get progress summary
    const summary = getProgressSummary('rims-crmp');

    console.log(`\nTotal Study Hours: ${chalk.cyan(summary.totalHours.toFixed(1))}`);
    console.log(`Quiz Average: ${chalk.cyan(summary.quizAverage.toFixed(1) + '%')}`);
    console.log(`Readiness: ${chalk.cyan(summary.readiness.toFixed(1) + '%')}`);

    if (summary.weakDomains.length > 0) {
      console.log(`\nWeak Domains: ${chalk.yellow(summary.weakDomains.join(', '))}`);
    }

    console.log(`\nSessions: ${progress.sessions.length}`);
    console.log(`Quizzes: ${progress.quizHistory.length}`);
  } catch (error) {
    console.log(chalk.yellow('\nNo data yet'));
  }
}

module.exports = { execute };
