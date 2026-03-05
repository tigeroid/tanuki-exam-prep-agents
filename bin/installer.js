#!/usr/bin/env node
const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log(chalk.bold.blue('╔═══════════════════════════════════════╗'));
  console.log(chalk.bold.blue('║   Exam Prep Installer                 ║'));
  console.log(chalk.bold.blue('╚═══════════════════════════════════════╝'));
  console.log();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'examType',
      message: 'Select exam type:',
      choices: [
        { name: 'RIMS-CRMP (Certified Risk Management Professional)', value: 'rims-crmp' },
        { name: 'ITPMP (IT Project Management Professional)', value: 'itpmp' },
        { name: 'Sample (Test/Demo)', value: 'sample' }
      ]
    },
    {
      type: 'list',
      name: 'profile',
      message: 'Study style:',
      choices: [
        { name: 'Intensive (15+ hours/week)', value: 'intensive' },
        { name: 'Balanced (8-15 hours/week)', value: 'balanced' },
        { name: 'Relaxed (3-8 hours/week)', value: 'relaxed' }
      ],
      default: 'balanced'
    },
    {
      type: 'input',
      name: 'examDate',
      message: 'Exam date (optional, format: YYYY-MM-DD):',
      default: '',
      validate: (input) => {
        if (!input) return true; // Optional field
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(input)) {
          return 'Please enter a valid date in YYYY-MM-DD format or leave blank';
        }
        return true;
      }
    }
  ]);

  console.log();
  console.log(chalk.blue('Installing...'));

  // Create installation directory
  const installPath = path.join(process.cwd(), 'exam-prep-data');
  const configPath = path.join(installPath, '.exam-prep');

  try {
    // Create directories
    fs.mkdirSync(configPath, { recursive: true });
    fs.mkdirSync(path.join(installPath, 'progress'), { recursive: true });

    // Create config file
    const config = {
      examType: answers.examType,
      profile: answers.profile,
      examDate: answers.examDate || null,
      installedAt: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(configPath, 'config.json'),
      JSON.stringify(config, null, 2)
    );

    console.log(chalk.green('✓ Installation complete'));
    console.log();
    console.log(chalk.cyan('Configuration:'));
    console.log(chalk.gray(`  Exam: ${answers.examType}`));
    console.log(chalk.gray(`  Profile: ${answers.profile}`));
    if (answers.examDate) {
      console.log(chalk.gray(`  Exam Date: ${answers.examDate}`));
    }
    console.log(chalk.gray(`  Location: ${installPath}`));
    console.log();
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.white('  $ exam-prep --help        # View available commands'));
    console.log(chalk.white('  $ exam-prep study         # Start studying'));
    console.log(chalk.white('  $ exam-prep quiz          # Take a practice quiz'));
    console.log(chalk.white('  $ exam-prep progress      # View your progress'));
    console.log();
  } catch (error) {
    console.error(chalk.red('✗ Installation failed:'), error.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});
