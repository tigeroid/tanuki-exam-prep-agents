# Exam Prep

AI-powered certification exam preparation system with adaptive learning, progress tracking, and BMAD agent integration. Built for RIMS-CRMP certification and extensible to other exams.

## Features

- **Three AI Agents for Complete Learning Cycle**
  - 🎓 **Alvin** - Study session tutor providing adaptive learning based on your progress
  - 🤓 **Simon** - Mock exam generator creating quizzes focused on your weak areas
  - 🧸 **Theodore** - Evaluation specialist analyzing your performance and recommending improvements

- **Adaptive Learning** - Automatically focuses on domains where you need the most improvement
- **Progress Tracking** - Tracks study hours, quiz scores, domain mastery, and readiness
- **BMAD Workflow Integration** - Structured workflows combining agent expertise with your context
- **Plugin Architecture** - Easily extensible to support multiple certification exams
- **Resource Management** - Configurable paths to your study materials

## Requirements

- Node.js 18 or higher
- Claude (claude.ai or Claude Code) for running AI agent sessions
- Your study materials (PDFs, notes, etc.)

## Installation

Install globally via npm:

```bash
npm install -g exam-prep
```

Or run directly with npx:

```bash
npx exam-prep --version
```

## Quick Start

### 1. Run the installer

```bash
npx exam-prep-installer
```

This will:
- Initialize progress tracking for your exam
- Set up your exam date and study schedule
- Configure BMAD workflows and agents

### 2. Set up your study resources

Create a directory for your study materials and set the environment variable:

```bash
# Option 1: Set environment variable
export EXAM_PREP_RESOURCES="/path/to/your/study-materials"

# Option 2: Create default directory
mkdir -p ~/exam-prep-resources
# Copy your study materials there
```

### 3. Start studying with Alvin

```bash
exam-prep study risk-assessment
```

This generates a prompt file you paste into Claude. Alvin will:
- Review your progress and weak areas
- Focus on the specified domain (or all domains if not specified)
- Provide adaptive learning based on your current level
- Reference your study materials

### 4. Test yourself with Simon

```bash
exam-prep quiz --quick
```

Simon generates practice quizzes:
- 10 questions (quick) or 20 questions (full)
- Automatically targets your weak domains
- Mimics real exam format and difficulty

### 5. Get feedback from Theodore

```bash
exam-prep evaluate
```

After completing a quiz, Theodore will:
- Analyze your performance trends
- Identify specific weak areas
- Recommend targeted study topics for Alvin
- Track your learning velocity and readiness

### 6. Check your progress

```bash
exam-prep progress
```

View your study hours, quiz history, domain mastery, and exam readiness.

## Commands

```bash
exam-prep study [domain]       # Start study session with Alvin
exam-prep quiz [--quick]       # Generate practice quiz with Simon
exam-prep evaluate             # Analyze quiz results with Theodore
exam-prep progress             # View your study progress
```

## Supported Certifications

### RIMS-CRMP (Certified Risk Management Professional)
- ✅ Full support with official exam structure
- 5 domains: Risk Model Analysis, Strategy Design, Implementation, Risk Competency, Decision Support
- 100 questions, 71% passing score, 120 minutes

### Coming Soon
- ITPMP (IT Project Management Professional) - template included
- Custom exam plugins via YAML configuration

## Configuration

### Resource Paths

The system resolves resource paths in this order:
1. `EXAM_PREP_RESOURCES` environment variable
2. `~/exam-prep-resources/` directory
3. `./resources/` directory (relative to working directory)

Example resource structure for RIMS-CRMP:

```
~/exam-prep-resources/
├── RIMS-CRMP-Study-Guide-2025.pdf
├── Module 1/
│   └── 01_Lecture Notes/
│       ├── Session 1 and 2 RM in context.pdf
│       └── Session 4 ISO and COSO.pdf
├── Module 2/
│   ├── 01_Lecture Notes/
│   ├── 02_Reports/
│   └── 03_Case Studies/
└── Cheat Sheets/
    ├── RIMS-CRMP-Master-Reference.md
    └── RIMS-CRMP-Flashcards.md
```

### Progress Data

Progress is stored in `~/.exam-prep/progress/[exam-code].json`:
- Study sessions and hours
- Quiz attempts and scores
- Domain mastery calculations
- Readiness assessment

## How It Works

1. **You run a command** - Generates a comprehensive prompt file
2. **You paste into Claude** - The appropriate agent (Alvin/Simon/Theodore) takes over
3. **AI agent guides you** - Uses your progress data and study materials
4. **System tracks progress** - Automatically updates based on your activity
5. **Adaptive focus** - Next session targets your weak areas

## Workflow Integration

The system uses BMAD (Best Modular Agent Development) framework:
- **Workflows** - Structured markdown files defining agent tasks
- **Context** - Your exam config, progress, resources, and memory
- **Agents** - Specialized AI personas with expertise and communication style
- **Memories** - Persistent state between sessions for continuity

Generated prompts combine: `[Agent Spec] + [Workflow Instructions] + [Your Context]`

## Creating Custom Exam Plugins

See `exams/README.md` for detailed instructions on creating your own exam configurations.

## License

MIT License - see LICENSE file for details

## Contributing

Contributions welcome! Please open an issue or pull request on GitHub.

## Acknowledgments

Built with Claude Code and designed for RIMS exam candidates preparing for their CRMP certification.
