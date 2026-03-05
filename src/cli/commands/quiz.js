const chalk = require('chalk');
const bmad = require('../../bmad');
const fs = require('fs');
const path = require('path');

function execute(opts) {
  console.log(chalk.blue('Generating quiz...'));
  if (opts.quick) {
    console.log(chalk.gray('Type: Quick'));
  }
  console.log();

  try {
    // Execute BMAD quiz generation workflow
    const options = {
      questionCount: opts.quick ? 10 : 20,
      targetWeakAreas: true
    };
    const execution = bmad.executeQuizGeneration('rims-crmp', options);

    // Create output directory
    const outputDir = path.join(process.cwd(), '.exam-prep-prompts');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save prompt to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const type = opts.quick ? 'quick' : 'full';
    const filename = `quiz-${type}-${timestamp}.txt`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, execution.prompt);

    console.log(chalk.green('✓ Quiz generation prompt prepared'));
    console.log();
    console.log(chalk.cyan('Agent:'), 'Simon (Mock Exam Generator) 🤓');
    console.log(chalk.cyan('Workflow:'), 'generate-mock-exam');
    console.log(chalk.cyan('Questions:'), options.questionCount);
    console.log(chalk.cyan('Focus:'), 'Your weak areas');
    console.log(chalk.cyan('Context loaded:'));
    console.log(chalk.gray('  • Exam format and structure'));
    console.log(chalk.gray('  • Your current progress'));
    console.log(chalk.gray('  • Identified weak domains'));
    console.log(chalk.gray('  • Recent quiz history'));
    console.log();
    console.log(chalk.yellow('━'.repeat(60)));
    console.log(chalk.bold('Next Steps:'));
    console.log('1. Open Claude (claude.ai or Claude Code)');
    console.log(`2. Paste the contents of: ${chalk.cyan(filename)}`);
    console.log('3. Simon will generate and administer your quiz');
    console.log('4. After completing, use `exam-prep progress` to track results');
    console.log();
    console.log(chalk.gray('Prompt saved to:'), filepath);
    console.log(chalk.yellow('━'.repeat(60)));

  } catch (error) {
    console.error(chalk.red('✗ Error:'), error.message);
    console.log();
    console.log(chalk.yellow('Troubleshooting:'));
    console.log('• Make sure you have run the installer first');
    console.log('• Check that RIMS exam plugin is configured');
    console.log('• Verify _bmad/rims-prep/ directory exists');
    process.exit(1);
  }
}

module.exports = { execute };
