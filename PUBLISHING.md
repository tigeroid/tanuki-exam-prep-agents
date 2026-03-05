# Publishing Guide

This guide walks through publishing the `exam-prep` package to npm and GitHub.

## Prerequisites

1. **GitHub Account** - You'll need a GitHub account to host the repository
2. **npm Account** - Create a free account at https://www.npmjs.com/signup
3. **npm CLI Authentication** - Run `npm login` to authenticate

## Step 1: Update Package.json with Your GitHub Username

Replace `GITHUB_USERNAME` in `package.json` with your actual GitHub username:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/YOUR_USERNAME/exam-prep.git"
},
"bugs": {
  "url": "https://github.com/YOUR_USERNAME/exam-prep/issues"
},
"homepage": "https://github.com/YOUR_USERNAME/exam-prep#readme"
```

You can do this with a find-and-replace:

```bash
sed -i '' 's/GITHUB_USERNAME/your-actual-username/g' package.json
```

## Step 2: Create GitHub Repository

### Option A: Using GitHub CLI (gh)

```bash
# Install gh if needed: brew install gh (macOS) or see https://cli.github.com/
gh auth login
gh repo create exam-prep --public --source=. --description="AI-powered certification exam preparation system"
gh repo view --web  # Opens repository in browser
```

### Option B: Using GitHub Web Interface

1. Go to https://github.com/new
2. Repository name: `exam-prep`
3. Description: "AI-powered certification exam preparation system"
4. Make it **Public**
5. Don't initialize with README (we already have one)
6. Click "Create repository"

Then connect your local repository:

```bash
git remote add origin https://github.com/YOUR_USERNAME/exam-prep.git
git branch -M main
git push -u origin main
```

## Step 3: Verify the Package

Before publishing, verify everything looks good:

```bash
# Check what files will be included in the package
npm pack --dry-run

# This should show:
# - bin/
# - src/
# - exams/
# - README.md
# - LICENSE
# - package.json

# Run all tests
npm test

# Verify no personal paths leaked
grep -r "henrytano" exams/
# Should only find placeholder comments, not actual paths

# Check package validity
npm pack
# This creates exam-prep-1.0.0.tgz
# You can extract and inspect: tar -xzf exam-prep-1.0.0.tgz
```

## Step 4: Publish to npm

```bash
# First time publishing
npm publish --access public

# The package will be available at:
# https://www.npmjs.com/package/exam-prep
```

### If You Get an Error

**"You do not have permission to publish"** - Someone else owns this package name. Choose a different name:
- `rims-exam-prep`
- `ai-exam-prep`
- `exam-prep-ai`

Update `package.json` with the new name and try again.

**"You must verify your email"** - Check your npm account email and verify it first.

## Step 5: Test Installation

After publishing, test that users can install it:

```bash
# Test with npx (no installation)
npx exam-prep@latest --version

# Test global installation
npm install -g exam-prep
exam-prep --version
exam-prep-installer --help

# Uninstall when done testing
npm uninstall -g exam-prep
```

## Step 6: Announce to RIMS Community

Once published, share with RIMS students:

### Installation Instructions for Students

```bash
# Install globally
npm install -g exam-prep

# Or run directly without installing
npx exam-prep-installer
```

### First-Time Setup

```markdown
## Setting Up Your Study Resources

1. **Organize your study materials** in a directory:
   ```
   ~/exam-prep-resources/
   ├── RIMS-CRMP-Study-Guide-2025.pdf
   ├── Module 1/
   ├── Module 2/
   └── Cheat Sheets/
   ```

2. **Set the environment variable**:
   ```bash
   # Add to your ~/.zshrc or ~/.bashrc
   export EXAM_PREP_RESOURCES="$HOME/exam-prep-resources"
   ```

3. **Run the installer**:
   ```bash
   exam-prep-installer
   ```

4. **Start studying**:
   ```bash
   exam-prep study risk-assessment
   # Copy the generated prompt and paste into Claude
   ```
```

## Updating the Package

When you make changes:

1. **Update version** in `package.json`:
   ```bash
   npm version patch  # 1.0.0 -> 1.0.1
   npm version minor  # 1.0.1 -> 1.1.0
   npm version major  # 1.1.0 -> 2.0.0
   ```

2. **Commit and push**:
   ```bash
   git add .
   git commit -m "Release v1.0.1: [describe changes]"
   git push origin main
   ```

3. **Publish update**:
   ```bash
   npm publish
   ```

4. **Create GitHub release**:
   ```bash
   gh release create v1.0.1 --title "Release 1.0.1" --notes "Release notes here"
   ```

## Package Statistics

After publishing, you can track usage at:
- npm package page: `https://www.npmjs.com/package/exam-prep`
- Download stats: `npm view exam-prep`
- GitHub insights: `https://github.com/YOUR_USERNAME/exam-prep/pulse`

## Maintenance

### Responding to Issues

When students report issues on GitHub:

1. **Bug reports** - Reproduce, fix, test, publish update
2. **Feature requests** - Consider if it fits the vision
3. **Questions** - Answer or point to documentation

### Security

If a security vulnerability is reported:

1. Fix it immediately
2. Publish a patch version
3. Update GitHub security advisory
4. Notify users to upgrade

## License

This package is MIT licensed - students are free to:
- Use it for their exam prep
- Modify it for their needs
- Share it with other RIMS candidates

---

## Quick Command Reference

```bash
# One-time setup
npm login
sed -i '' 's/GITHUB_USERNAME/your-username/g' package.json
gh repo create exam-prep --public --source=.
git push -u origin main

# Publish
npm test
npm publish --access public

# Update
npm version patch
git push origin main
npm publish
```

## Support

If you encounter issues during publishing:
- npm support: https://www.npmjs.com/support
- GitHub support: https://support.github.com
- npm documentation: https://docs.npmjs.com/
