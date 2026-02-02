---
name: code-integration-verifier
description: Systematic approach to integrating features and changes into a codebase with mandatory self-verification after each phase. Prevents mixed plans, corrupted commits, and branch confusion. Use when implementing new features, integrating multiple plan files, or making complex code changes across a git repository.
---

# Code Integration Verifier

A structured workflow for safely integrating code changes with built-in verification gates after each phase. This skill ensures Claude critically reviews its own work before progressing.

## Core Principle

**NEVER proceed to the next phase without completing the review for the current phase.**

Each phase has two parts:
1. **Action** - Perform the work
2. **Review** - Critically verify the work before continuing

## Workflow Phases

### Phase 1: Discovery & Analysis

#### Actions:
1. List ALL relevant files in the working directory
   ```bash
   find . -type f -name "*.md" -o -name "plan*" -o -name "summary*" | head -20
   ```
2. Identify all plan files, summaries, and documentation
3. Check git status to understand current state
   ```bash
   git status
   git branch -a
   git log --oneline -10
   ```

#### Phase 1 Review (MANDATORY):
Before proceeding, verify:

- [ ] I have identified ALL plan files in the repository
- [ ] I understand the current git branch structure
- [ ] I can see any uncommitted changes
- [ ] I know which files might conflict with each other

**Review Questions to Answer:**
- What branch am I currently on?
- Are there any uncommitted changes?
- How many different plan/summary files exist?
- Do any plan files appear to contradict each other?

**If any item is unclear or uncertain, STOP and ask the user for clarification.**

---

### Phase 2: Plan Reconciliation

#### Actions:
1. Read each plan file completely
2. Compare plans to identify:
   - Overlapping features
   - Contradictory approaches
   - Duplicate implementations
   - Version conflicts (older vs newer plans)
3. Create a single consolidated plan that:
   - Uses the most recent/authoritative information
   - Resolves conflicts explicitly
   - Documents which original plans were used

#### Phase 2 Review (MANDATORY):
Before proceeding, verify:

- [ ] I have read EVERY plan file in full
- [ ] I have identified which plans are most recent/authoritative
- [ ] I have documented any conflicts found
- [ ] I have created a clear, unified plan of action
- [ ] The unified plan doesn't mix incompatible features

**Review Questions to Answer:**
- Which plan file is the source of truth for each feature?
- Are there any contradictions in my consolidated plan?
- Have I accidentally mixed parts of different plans that shouldn't be combined?

**Create a summary document showing:**
```
PLAN RECONCILIATION SUMMARY
===========================
Files analyzed: [list]
Primary source: [filename] (reason: most recent/comprehensive)
Conflicts found: [list with resolutions]
Final approach: [brief description]
```

**If reconciliation reveals major conflicts, STOP and consult the user.**

---

### Phase 3: Branch Strategy

#### Actions:
1. Determine the correct branch for this work:
   - New feature → new feature branch
   - Bug fix → bugfix branch or main
   - Experimental → experimental branch
   - Multiple features → separate branches per feature
2. Check if the branch already exists
3. Create or switch to the appropriate branch

```bash
# Check existing branches
git branch -a

# Create new branch if needed
git checkout -b feature/descriptive-name

# Or switch to existing
git checkout existing-branch-name
```

#### Phase 3 Review (MANDATORY):
Before proceeding, verify:

- [ ] The branch name clearly describes the work
- [ ] I'm on the correct branch for this type of change
- [ ] I haven't mixed multiple unrelated features into one branch
- [ ] The base branch (what I branched from) is correct

**Review Questions to Answer:**
- What branch am I on right now?
- Does this branch match the type of work I'm doing?
- Should I create separate branches for different features?
- Am I accidentally working on main/master when I should be on a feature branch?

**Verification command:**
```bash
git branch --show-current
```

**If branch strategy is wrong, fix it NOW before making code changes.**

---

### Phase 4: Code Implementation

#### Actions:
1. Make code changes according to the consolidated plan
2. Work on ONE logical change at a time
3. Document changes inline with clear comments
4. Keep track of which files were modified

#### Phase 4 Review (MANDATORY):
Before proceeding, verify:

- [ ] Changes match the consolidated plan (not a different plan)
- [ ] I haven't accidentally implemented features from the wrong plan
- [ ] Modified files are logically related to the current feature
- [ ] Code changes are complete for this logical unit
- [ ] No temporary/debug code remains

**Review Questions to Answer:**
- Did I implement exactly what the consolidated plan specified?
- Did I accidentally mix code from different plans?
- Are all my changes for the current feature, or did I drift to other features?
- Does each modified file make sense for this branch?

**Verification checklist:**
```bash
# Check what files changed
git status

# Review actual changes
git diff

# For each changed file, ask:
# "Does this change belong to the current feature/branch?"
```

**Self-Critique Questions:**
1. Is this the code the plan called for, or did I implement something else?
2. Did I stay focused on one logical change?
3. Are there any signs I mixed different plans together?

**If code doesn't match the plan or mixes features, STOP and fix it.**

---

### Phase 5: Integration Testing

#### Actions:
1. Test that changes work with the existing codebase
2. Check for broken imports or dependencies
3. Verify no unintended side effects
4. Run any available tests

```bash
# Example checks
npm run build   # or appropriate build command
npm test        # if tests exist
```

#### Phase 5 Review (MANDATORY):
Before proceeding, verify:

- [ ] Code compiles/runs without errors
- [ ] No broken imports or missing dependencies
- [ ] Changes don't break existing functionality
- [ ] Integration with other parts of codebase is clean

**Review Questions to Answer:**
- Does the code actually work?
- Did I break anything that was working before?
- Are there any error messages or warnings I'm ignoring?

**If tests fail or code doesn't work, STOP and fix issues.**

---

### Phase 6: Commit Preparation

#### Actions:
1. Review all staged changes one final time
2. Write a clear, descriptive commit message
3. Verify commit is going to the correct branch

**Commit Message Template:**
```
<type>: <short summary>

- What: [what changed]
- Why: [reason for change]
- Source: [which plan/summary this implements]
- Branch: [current branch]
```

Types: feat, fix, refactor, docs, test, chore

#### Phase 6 Review (MANDATORY):
Before committing, verify:

- [ ] I'm on the correct branch
- [ ] Only related changes are staged
- [ ] Commit message accurately describes changes
- [ ] No unintended files are included (credentials, temp files, etc.)
- [ ] Changes in this commit belong together logically

**Review Questions to Answer:**
- Am I committing to the right branch?
- Does my commit message match what I actually changed?
- Are there any files staged that shouldn't be?
- Is this a single logical change, or should it be multiple commits?

**Verification commands:**
```bash
git branch --show-current
git status
git diff --cached
```

**Self-Critique Checklist:**
1. Does this commit mix changes from different plans? ❌ NO
2. Does this commit belong on this branch? ✅ YES
3. Is the commit message clear and accurate? ✅ YES
4. Would someone reviewing this commit understand what I did? ✅ YES

**If any review item fails, STOP and fix before committing.**

---

### Phase 7: Final Verification & Commit

#### Actions:
1. Make the commit
2. Verify commit was created successfully
3. Review the commit log

```bash
git commit -m "your message"
git log -1 --stat
```

#### Phase 7 Review (MANDATORY):
After committing, verify:

- [ ] Commit was created successfully
- [ ] Commit is on the expected branch
- [ ] Commit includes the expected files
- [ ] Commit message is what I intended

**Review Questions to Answer:**
- Did the commit succeed?
- Is the commit on the branch I expected?
- Does `git log -1` show what I intended?

**Verification command:**
```bash
git log -1 --name-only
```

---

### Phase 8: Progress Gate

#### Actions:
Only if ALL previous reviews passed:
1. Report completion to user
2. Summarize what was done
3. Note which branch contains the changes
4. Suggest next steps if applicable

#### Phase 8 Review (MANDATORY):
Before reporting completion, verify:

- [ ] All previous phase reviews were completed
- [ ] No review items were skipped or ignored
- [ ] Work matches the user's original request
- [ ] Git repository is in a clean state

**Final Self-Critique:**
1. Did I complete all reviews honestly?
2. Is the repository better organized than before?
3. Would I be confident explaining these changes to the user?
4. Are there any lingering doubts about what I did?

**If anything feels wrong, STOP and address it.**

---

## Review Failure Protocol

If ANY review fails:

1. **STOP immediately** - Do not proceed to next phase
2. **Document the issue** - What specifically failed?
3. **Fix the problem** - Undo changes if necessary
4. **Re-run the review** - Don't skip ahead
5. **Only proceed when review passes**

## Common Pitfalls to Watch For

During reviews, be especially alert for:

- ❌ Mixing features from plan-v1.md and plan-v2.md in the same commit
- ❌ Committing to `main` when should be on feature branch
- ❌ Including unrelated file changes in a commit
- ❌ Vague commit messages like "updates" or "fixes"
- ❌ Skipping reviews because "it looks fine"
- ❌ Continuing despite failed tests
- ❌ Implementing plan A while claiming to implement plan B

## Usage Example

```
User: "Integrate the new authentication feature from the plans"

Claude follows:
1. Phase 1: Find all plan files → Review findings
2. Phase 2: Read plans, find auth-plan-v3.md is newest → Review reconciliation
3. Phase 3: Create feature/auth-implementation branch → Review branch choice
4. Phase 4: Implement auth code → Review code matches plan
5. Phase 5: Test integration → Review tests pass
6. Phase 6: Prepare commit → Review commit contents
7. Phase 7: Commit → Review commit succeeded
8. Phase 8: Report to user → Review all steps completed
```

## Key Principles

1. **Reviews are not optional** - They are mandatory gates
2. **Be honest in reviews** - Don't just check boxes
3. **Stop if uncertain** - Ask the user rather than guessing
4. **One feature per branch** - Don't mix unrelated changes
5. **Verify before progressing** - Never skip ahead

## Integration with Git Workflows

This skill works with any git workflow (Git Flow, GitHub Flow, trunk-based, etc.). Adapt branch naming and merge strategies to your project's conventions.

## When to Use This Skill

Use this skill when:
- Integrating multiple plan files or features
- Working with complex branching strategies
- Risk of mixing unrelated changes
- Need to ensure code quality and organization
- Working on critical production code
- User specifically requests careful, verified integration

Do NOT use this skill for:
- Simple one-line changes
- Emergency hotfixes (adapt as needed)
- Exploratory/experimental work where speed matters more
