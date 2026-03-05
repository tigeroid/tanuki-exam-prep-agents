const chalk = require('chalk');
const bmad = require('../../bmad');
const fs = require('fs');
const path = require('path');

function execute(domain) {
  console.log(chalk.blue('Study session starting...'));
  if (domain) {
    console.log(chalk.gray(`Domain: ${domain.toUpperCase()}`));
  }
  console.log();

  try {
    // Execute BMAD study session workflow
    const execution = bmad.executeStudySession('rims-crmp', { domain });

    // Create output directory
    const outputDir = path.join(process.cwd(), '.exam-prep-prompts');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save prompt to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `study-session-${domain || 'all'}-${timestamp}.txt`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, execution.prompt);

    console.log(chalk.green('✓ Study session prompt prepared'));
    console.log();
    console.log(chalk.cyan('Agent:'), 'Alvin (Study Assistant) 🎸');
    console.log(chalk.cyan('Workflow:'), 'study-session');
    if (domain) {
      console.log(chalk.cyan('Domain:'), domain);
    }
    console.log(chalk.cyan('Context loaded:'));
    console.log(chalk.gray('  • Exam configuration'));
    console.log(chalk.gray('  • Your progress data'));
    console.log(chalk.gray('  • Course materials'));
    console.log(chalk.gray('  • Previous session memories'));
    console.log();
    console.log(chalk.yellow('━'.repeat(60)));
    console.log(chalk.bold('Next Steps:'));
    console.log('1. Open Claude (claude.ai or Claude Code)');
    console.log(`2. Paste the contents of: ${chalk.cyan(filename)}`);
    console.log('3. Start your interactive study session with Alvin');
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
