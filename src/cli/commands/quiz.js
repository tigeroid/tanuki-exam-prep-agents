const chalk = require('chalk');
const bmad = require('../../bmad');
const fs = require('fs');
const path = require('path');

function execute(opts) {
  console.log(chalk.blue('Generating quiz...'));

  // Determine quiz type and question count
  let quizType, questionCount, batchCount;
  if (opts.fullExam) {
    quizType = 'full-exam';
    questionCount = 25;  // Questions per batch
    batchCount = 4;      // Total batches for 100 questions
    console.log(chalk.gray('Type: Full RIMS Exam Simulation (100 questions in 4 batches)'));
  } else if (opts.quick) {
    quizType = 'quick';
    questionCount = 10;
    batchCount = 1;
    console.log(chalk.gray('Type: Quick (10 questions)'));
  } else {
    quizType = 'practice';
    questionCount = 20;
    batchCount = 1;
    console.log(chalk.gray('Type: Practice (20 questions)'));
  }
  console.log();

  try {
    // Create output directory
    const outputDir = path.join(process.cwd(), '.exam-prep-prompts');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const generatedFiles = [];

    // Generate batch(es)
    for (let batch = 1; batch <= batchCount; batch++) {
      const options = {
        questionCount: questionCount,
        targetWeakAreas: true,
        batchInfo: batchCount > 1 ? {
          currentBatch: batch,
          totalBatches: batchCount,
          totalQuestions: questionCount * batchCount
        } : null
      };

      const execution = bmad.executeQuizGeneration('rims-crmp', options);

      // Save prompt to file
      const batchSuffix = batchCount > 1 ? `-batch${batch}of${batchCount}` : '';
      const filename = `quiz-${quizType}${batchSuffix}-${timestamp}.txt`;
      const filepath = path.join(outputDir, filename);

      fs.writeFileSync(filepath, execution.prompt);
      generatedFiles.push({ filename, filepath, batch, questions: questionCount });
    }

    console.log(chalk.green(`✓ Quiz generation prompt(s) prepared`));
    console.log();
    console.log(chalk.cyan('Agent:'), 'Simon (Mock Exam Generator) 🤓');
    console.log(chalk.cyan('Workflow:'), 'generate-mock-exam');
    console.log(chalk.cyan('Total Questions:'), questionCount * batchCount);

    if (batchCount > 1) {
      console.log(chalk.cyan('Batches:'), `${batchCount} × ${questionCount} questions each`);
      console.log(chalk.cyan('Reason:'), 'Batched to avoid Claude Code output token limits');
    }

    console.log(chalk.cyan('Focus:'), 'Your weak areas');
    console.log(chalk.cyan('Context loaded:'));
    console.log(chalk.gray('  • Exam format and structure'));
    console.log(chalk.gray('  • Your current progress'));
    console.log(chalk.gray('  • Identified weak domains'));
    console.log(chalk.gray('  • Recent quiz history'));
    console.log();
    console.log(chalk.yellow('━'.repeat(60)));
    console.log(chalk.bold('Next Steps:'));

    if (batchCount > 1) {
      console.log(chalk.bold.cyan('\n📝 Full Exam Simulation Instructions:'));
      console.log('This simulates the real RIMS-CRMP exam experience (100 scored questions)');
      console.log();
      generatedFiles.forEach(file => {
        console.log(chalk.cyan(`Batch ${file.batch}/${batchCount}:`), `${file.questions} questions`);
        console.log(`  1. Open Claude and paste: ${chalk.gray(file.filename)}`);
        console.log(`  2. Complete all ${file.questions} questions`);
        console.log(`  3. Record your score before moving to next batch`);
        console.log();
      });
      console.log(chalk.yellow('💡 Tip:'), 'Take a 5-minute break between batches, just like the real exam!');
      console.log(chalk.yellow('📊 After all batches:'), 'Run `exam-prep evaluate` with your combined score');
    } else {
      console.log('1. Open Claude (claude.ai or Claude Code)');
      console.log(`2. Paste the contents of: ${chalk.cyan(generatedFiles[0].filename)}`);
      console.log('3. Simon will generate and administer your quiz');
      console.log('4. After completing, use `exam-prep evaluate` to track results');
    }

    console.log();
    console.log(chalk.gray('Prompt(s) saved to:'), outputDir);
    generatedFiles.forEach(file => {
      console.log(chalk.gray(`  • ${file.filename}`));
    });
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
