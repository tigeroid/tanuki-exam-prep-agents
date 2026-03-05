const chalk = require('chalk');
const bmad = require('../../bmad');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');

async function execute() {
  console.log(chalk.blue('Exam Evaluation'));
  console.log('━'.repeat(40));
  console.log();

  try {
    // Ask user for quiz results
    console.log(chalk.cyan('Enter your quiz results:'));
    console.log(chalk.gray('(Theodore will analyze your performance and provide feedback)'));
    console.log();

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'totalQuestions',
        message: 'Total questions:',
        validate: (input) => {
          const num = parseInt(input);
          return !isNaN(num) && num > 0 ? true : 'Please enter a valid number';
        }
      },
      {
        type: 'input',
        name: 'correct',
        message: 'Correct answers:',
        validate: (input) => {
          const num = parseInt(input);
          return !isNaN(num) && num >= 0 ? true : 'Please enter a valid number';
        }
      },
      {
        type: 'input',
        name: 'domain',
        message: 'Domain focus (or "mixed" for general):',
        default: 'mixed'
      }
    ]);

    const results = {
      totalQuestions: parseInt(answers.totalQuestions),
      correct: parseInt(answers.correct),
      incorrect: parseInt(answers.totalQuestions) - parseInt(answers.correct),
      score: Math.round((parseInt(answers.correct) / parseInt(answers.totalQuestions)) * 100),
      domain: answers.domain,
      date: new Date().toISOString()
    };

    console.log();
    console.log(chalk.cyan('Quiz Results:'));
    console.log(chalk.gray(`  Score: ${results.score}% (${results.correct}/${results.totalQuestions})`));
    console.log();

    // Execute BMAD evaluation workflow
    const execution = bmad.executeEvaluation('rims-crmp', results);

    // Create output directory
    const outputDir = path.join(process.cwd(), '.exam-prep-prompts');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save prompt to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `evaluation-${results.score}pct-${timestamp}.txt`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, execution.prompt);

    console.log(chalk.green('✓ Evaluation prompt prepared'));
    console.log();
    console.log(chalk.cyan('Agent:'), 'Theodore (Evaluator) 🧸');
    console.log(chalk.cyan('Workflow:'), 'evaluate-exam');
    console.log(chalk.cyan('Your Score:'), `${results.score}%`);
    console.log(chalk.cyan('Context loaded:'));
    console.log(chalk.gray('  • Your quiz results'));
    console.log(chalk.gray('  • Previous performance history'));
    console.log(chalk.gray('  • Learning progress and velocity'));
    console.log(chalk.gray('  • Weak areas to address'));
    console.log();
    console.log(chalk.yellow('━'.repeat(60)));
    console.log(chalk.bold('Next Steps:'));
    console.log('1. Open Claude (claude.ai or Claude Code)');
    console.log(`2. Paste the contents of: ${chalk.cyan(filename)}`);
    console.log('3. Theodore will:');
    console.log(chalk.gray('   • Grade your exam with detailed feedback'));
    console.log(chalk.gray('   • Identify specific weak areas'));
    console.log(chalk.gray('   • Recommend remediation topics for Alvin'));
    console.log(chalk.gray('   • Track your learning velocity'));
    console.log('4. Then run: exam-prep study [weak-domain]');
    console.log();
    console.log(chalk.gray('Prompt saved to:'), filepath);
    console.log(chalk.yellow('━'.repeat(60)));

    // Record quiz to progress tracker (after Theodore's evaluation)
    console.log();
    console.log(chalk.gray('💾 Recording quiz to progress tracker...'));
    const { recordQuizAttempt } = require('../../core/engine/progress-tracker');
    recordQuizAttempt('rims-crmp', {
      domain: results.domain,
      score: results.score,
      total: results.totalQuestions,
      correct: results.correct,
      date: results.date
    });
    console.log(chalk.green('✓ Progress updated'));

  } catch (error) {
    console.error(chalk.red('✗ Error:'), error.message);
    process.exit(1);
  }
}

module.exports = { execute };
