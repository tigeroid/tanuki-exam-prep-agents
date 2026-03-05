# Exam Plugin System

This directory contains exam plugins for the RIMS Exam Prep application. Each exam is configured using a standardized YAML format that defines exam structure, domains, and learning resources.

## Overview

The exam plugin system allows you to:
- **Add new certifications** without modifying core code
- **Customize exam structures** for different certification types
- **Map resources** to specific exam domains
- **Validate configurations** automatically through schema validation

## Directory Structure

```
exams/
├── README.md                 # This file - plugin system documentation
├── sample/                   # Minimal example plugin
│   └── exam.yaml
├── rims-crmp/               # RIMS Certified Risk Management Professional
│   └── exam.yaml
└── itpmp/                   # IT Project Management Professional (general template)
    └── exam.yaml
```

Each exam plugin is a directory containing an `exam.yaml` configuration file.

## YAML Schema

### Top-Level Structure

```yaml
code: exam-identifier          # Unique exam code (lowercase, hyphens only)
name: Full Exam Name          # Human-readable exam name

format:                       # Exam format specifications
  total_questions: 100        # Total number of scored questions
  passing_score: 70           # Passing percentage (0-100)
  question_type: multiple-choice-4  # Question format
  time_limit_minutes: 120     # Time limit in minutes

domains:                      # Array of exam domains
  - code: domain-code         # Domain identifier
    name: Domain Name         # Human-readable domain name
    description: Description  # Detailed domain description
    weight: 30               # Domain weight as percentage (must sum to 100%)

resources:                    # Array of learning resources
  - domain: domain-code       # Domain this resource belongs to (or 'all')
    type: resource-type       # Resource type (see below)
    title: Resource Title     # Human-readable title
    path: /absolute/path      # Absolute path to resource file
```

### Required Fields

All fields shown above are **required** except:
- `resources` array (can be empty, but must exist)
- Individual resource `path` fields may use placeholder values for templates

### Validation Rules

1. **Code Format**: Must be lowercase alphanumeric with hyphens only
   - Valid: `rims-crmp`, `itpmp`, `sample`
   - Invalid: `RIMS_CRMP`, `exam 1`, `exam/test`

2. **Domain Weights**: Must sum to exactly **100%**
   ```yaml
   # Correct - sums to 100
   domains:
     - weight: 30
     - weight: 35
     - weight: 25
     - weight: 10

   # Invalid - sums to 95
   domains:
     - weight: 30
     - weight: 35
     - weight: 30
   ```

3. **Passing Score**: Must be between 0 and 100
   - Common values: 65, 70, 71, 75, 80

4. **Question Types**: Recommended values
   - `multiple-choice-4` (4 options, most common)
   - `multiple-choice-5` (5 options)
   - `multiple-select` (multiple correct answers)
   - `true-false`

### Resource Types

Common resource types used across exam plugins:

| Type | Description | Example |
|------|-------------|---------|
| `study-guide` | Official certification study guide | PDF study guide |
| `textbook` | Reference textbook or manual | PMBOK Guide, ISO standards |
| `lecture` | Lecture notes or slides | Classroom materials |
| `video-series` | Video course or playlist | Online training modules |
| `case-study` | Real-world scenario analysis | Implementation examples |
| `practice-exam` | Practice questions and mock exams | Question banks |
| `reference` | Quick reference material | Standards, frameworks |
| `template` | Document templates | Project charters, forms |
| `flashcards` | Flashcard sets for memorization | Study flashcards |
| `quick-reference` | Cheat sheets and summaries | Formula sheets |

You can define custom resource types as needed for your exam.

## Example Plugins

### RIMS-CRMP: Real-World Example

The **RIMS-CRMP** plugin demonstrates a complete, production-ready configuration:

```yaml
code: rims-crmp
name: RIMS-CRMP Certification

format:
  total_questions: 100
  passing_score: 71
  question_type: multiple-choice-4
  time_limit_minutes: 120

# 5 domains with specific weights matching official exam
domains:
  - code: domain-a
    name: Analyzing the Organizational Risk Model
    weight: 16
  - code: domain-b
    name: Designing Risk Management Strategies
    weight: 26
  - code: domain-c
    name: Implementing Risk Management Processes
    weight: 32  # Highest weighted domain
  - code: domain-d
    name: Developing Risk Competency
    weight: 16
  - code: domain-e
    name: Supporting Decision Making
    weight: 10
```

**Key Features**:
- 5 domains matching official RIMS exam structure
- Weights sum to exactly 100% (16+26+32+16+10)
- Domain C has highest weight (32%) reflecting exam emphasis
- Real file paths to actual study materials
- Multiple resource types per domain

### ITPMP: General Template

The **itpmp** plugin demonstrates a different exam structure:

```yaml
code: itpmp
name: IT Project Management Professional

format:
  total_questions: 150  # Longer exam
  passing_score: 65    # Lower passing threshold
  time_limit_minutes: 180  # 3 hours

# 4 domains (different from RIMS' 5)
domains:
  - code: initiation-planning
    name: Project Initiation and Planning
    weight: 30
  - code: execution-delivery
    name: Project Execution and Delivery
    weight: 35  # Highest weighted
  - code: monitoring-control
    name: Monitoring and Control
    weight: 25
  - code: closure-optimization
    name: Project Closure and Continuous Improvement
    weight: 10
```

**Key Differences from RIMS**:
- 4 domains instead of 5
- 150 questions vs 100
- 180 minutes vs 120
- Different weight distribution
- Placeholder resource paths (template use)
- Different resource types (templates, video-series)

## Creating a New Exam Plugin

### Step 1: Create Directory Structure

```bash
mkdir -p exams/your-exam-code
```

### Step 2: Create exam.yaml

Create `exams/your-exam-code/exam.yaml`:

```yaml
code: your-exam-code
name: Your Certification Name

format:
  total_questions: 100
  passing_score: 70
  question_type: multiple-choice-4
  time_limit_minutes: 120

domains:
  - code: domain-1
    name: First Domain
    description: Description of first domain
    weight: 25

  - code: domain-2
    name: Second Domain
    description: Description of second domain
    weight: 30

  - code: domain-3
    name: Third Domain
    description: Description of third domain
    weight: 25

  - code: domain-4
    name: Fourth Domain
    description: Description of fourth domain
    weight: 20

resources:
  - domain: domain-1
    type: study-guide
    title: Official Study Guide
    path: /path/to/study-guide.pdf

  - domain: all
    type: quick-reference
    title: Quick Reference Sheet
    path: /path/to/quick-ref.pdf
```

### Step 3: Validate Configuration

The exam loader automatically validates your configuration:

```javascript
const { loadExam } = require('./src/core/engine/exam-loader');

try {
  const exam = loadExam('your-exam-code', './exams');
  console.log('✓ Configuration valid');
} catch (error) {
  console.error('✗ Validation failed:', error.message);
}
```

Common validation errors:
- Domain weights don't sum to 100%
- Invalid code format (uppercase, spaces, special characters)
- Missing required fields
- Invalid passing score (outside 0-100 range)

### Step 4: Test Your Plugin

Create integration tests in `tests/integration/`:

```javascript
describe('Your Exam Plugin Integration', () => {
  test('should load exam configuration', () => {
    const config = loadExam('your-exam-code', examsPath);
    expect(config).toBeDefined();
    expect(config.code).toBe('your-exam-code');
  });

  test('should have domain weights summing to 100%', () => {
    const config = loadExam('your-exam-code', examsPath);
    const total = config.domains.reduce((sum, d) => sum + d.weight, 0);
    expect(total).toBe(100);
  });
});
```

## Best Practices

### Domain Design

1. **Clear Separation**: Ensure domains have distinct, non-overlapping content
2. **Logical Flow**: Order domains in a logical learning sequence
3. **Weight Alignment**: Align weights with actual exam emphasis
4. **Descriptive Names**: Use clear, professional domain names

### Resource Organization

1. **Resource Distribution**: Provide multiple resources per domain
2. **Weight Correlation**: Higher-weighted domains should have more resources
3. **Type Diversity**: Include varied resource types (guides, practice, video)
4. **Absolute Paths**: Use absolute paths for resources, not relative
5. **Cross-Domain Resources**: Use `domain: all` for exam-wide materials

### Exam Format

1. **Realistic Values**: Match actual certification exam specifications
2. **Time Management**: Ensure time limit is appropriate for question count
3. **Passing Threshold**: Use realistic passing scores (65-80% typical)
4. **Question Types**: Match actual exam question format

## Plugin Loading

Plugins are loaded using the exam loader:

```javascript
const { loadExam, buildExamContext } = require('./src/core/engine/exam-loader');

// Load exam configuration
const exam = loadExam('rims-crmp', './exams');

// Build enriched context for agents
const context = buildExamContext(exam);

// Access domain map
console.log(context.domainMap['domain-c'].weight); // 32

// Access resources by domain
console.log(context.resourceMap['domain-a'].length); // 5 resources
```

## Validation Schema

The exam loader validates configurations against this schema:

- **code**: string, lowercase alphanumeric with hyphens
- **name**: non-empty string
- **format.total_questions**: positive integer
- **format.passing_score**: number between 0 and 100
- **format.question_type**: non-empty string
- **format.time_limit_minutes**: positive integer
- **domains**: non-empty array
- **domains[].code**: string, lowercase alphanumeric with hyphens
- **domains[].name**: non-empty string
- **domains[].description**: non-empty string
- **domains[].weight**: positive number
- **domains weights sum**: must equal exactly 100
- **resources**: array (can be empty)
- **resources[].domain**: non-empty string (must match domain code or 'all')
- **resources[].type**: non-empty string
- **resources[].title**: non-empty string
- **resources[].path**: non-empty string

## Troubleshooting

### Weights Don't Sum to 100%

```
Error: Exam configuration validation failed: Domain weights must sum to 100%
```

**Solution**: Verify your domain weights:
```javascript
// Calculate total
const total = domains.reduce((sum, d) => sum + d.weight, 0);
console.log('Total:', total); // Must be 100
```

### Invalid Code Format

```
Error: Exam configuration validation failed: Invalid exam code format
```

**Solution**: Use lowercase letters, numbers, and hyphens only:
- ✓ `rims-crmp`, `itpmp`, `sample-exam`
- ✗ `RIMS-CRMP`, `exam_1`, `my exam`

### Missing Required Field

```
Error: Exam configuration validation failed: Missing required field: domains
```

**Solution**: Ensure all required fields are present:
- code, name, format, domains
- Each domain needs: code, name, description, weight

## Advanced Usage

### Multiple Exam Instances

You can create multiple configurations for the same certification:

```
exams/
├── rims-crmp/           # Current exam version
├── rims-crmp-2024/      # Archived 2024 version
└── rims-crmp-practice/  # Practice exam variant
```

### Custom Resource Types

Define custom resource types for specialized content:

```yaml
resources:
  - domain: domain-a
    type: simulation
    title: Risk Assessment Simulation Tool
    path: /path/to/simulation.exe

  - domain: domain-b
    type: podcast
    title: Risk Management Podcast Series
    path: /path/to/podcasts/
```

### Resource Metadata

Add custom metadata fields as needed:

```yaml
resources:
  - domain: domain-a
    type: video-series
    title: Advanced Topics
    path: /path/to/videos/
    duration_minutes: 180
    instructor: Dr. Jane Smith
    release_date: 2025-01-15
```

## Contributing

When adding new exam plugins:

1. Follow the schema exactly
2. Validate weights sum to 100%
3. Use descriptive domain names
4. Include integration tests
5. Document any custom resource types
6. Use realistic exam specifications

## Support

For questions or issues with exam plugins:
- Review existing plugins (rims-crmp, general) for examples
- Check validation error messages carefully
- Ensure all required fields are present
- Verify domain weights sum to exactly 100%
