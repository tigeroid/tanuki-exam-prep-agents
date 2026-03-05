#!/usr/bin/env node
const { program } = require('commander');
const chalk = require('chalk');

program
  .version('1.0.0')
  .description('AI-powered exam preparation');

program
  .command('study [domain]')
  .description('Start study session')
  .action((domain) => {
    require('../src/cli/commands/study').execute(domain);
  });

program
  .command('quiz')
  .description('Generate quiz')
  .option('--quick', 'Quick quiz (10 questions)')
  .option('--full-exam', 'Full RIMS exam simulation (100 questions in 4 batches)')
  .action((opts) => {
    require('../src/cli/commands/quiz').execute(opts);
  });

program
  .command('progress')
  .description('View progress')
  .action(() => {
    require('../src/cli/commands/progress').execute();
  });

program
  .command('evaluate')
  .description('Evaluate quiz results with Theodore')
  .action(async () => {
    await require('../src/cli/commands/evaluate').execute();
  });

program.parse(process.argv);
