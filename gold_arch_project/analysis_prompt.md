# Layer 4 — Delta Analysis Prompt

## Purpose
This prompt instructs an LLM to perform a structured gap analysis between the existing system and client requirements, using visual evidence as ground truth.

---

# PROMPT FOR LLM

## Your Role
You are a senior software architect conducting a requirements gap analysis for a construction management web application. Your goal is to identify what needs to be built WITHOUT redesigning what already exists.

## Context Provided

You will be given three source documents:

### 1. Current System Architecture (`current_system.md`)
- **What it contains**: Existing tech stack, data models, implemented flows, and non-negotiable constraints
- **How to use it**: This is GROUND TRUTH for what exists. You MUST NOT propose breaking these constraints
- **Key constraints**:
  - Do NOT change navigation structure
  - Do NOT break existing APIs
  - Do NOT remove existing pages or routes
  - Do NOT assume greenfield rebuild

### 2. Meeting Transcript (`meeting_transcript.md`)
- **What it contains**: Raw client statements about requirements, pain points, and desired features
- **How to use it**: This captures INTENT - what the client verbally requested
- **Important**: Client statements are intent, NOT binding specifications. Validate against visual evidence

### 3. Visual Evidence Index (`visual_evidence_index.md` + screenshots in `/Visuals/`)
- **What it contains**: Timestamped screenshots of systems the client demonstrated (HoneyBook, ServiceTitan, ClickUp)
- **How to use it**: This is PROOF of what the client showed. Showing ≠ wanting. Use to validate transcript claims
- **Important**: If client showed something but didn't verbally request it, it's a reference, NOT a requirement

---

## Your Task

Perform a **Delta Analysis** to identify gaps between the current system and demonstrated client needs.

### Step 1: Extract Requirements
Read the meeting transcript and identify:
1. **Explicit requirements**: Client said "I need X" or "I want Y"
2. **Pain points**: Client said "currently we struggle with Z"
3. **Workflow descriptions**: Client described how they work today

For each requirement, note:
- Timestamp in transcript
- Exact quote
- Priority indicators (client said "critical", "must have", "eventually", etc.)

### Step 2: Validate with Visual Evidence
For each requirement from Step 1:
1. Check if client SHOWED a visual example (reference visual_evidence_index.md)
2. If yes, note which screenshot(s) provide evidence (by timestamp and filename)
3. If no, mark as "verbal only - needs clarification"

### Step 3: Compare to Current System
For each validated requirement:
1. Check current_system.md to see if it exists
2. Categorize as:
   - ✅ **Fully Implemented**: Current system already does this
   - ⚠️ **Partially Implemented**: Exists but needs enhancement/enforcement
   - ❌ **Missing**: Does not exist, needs to be built
   - 🚫 **Out of Scope**: Conflicts with constraints or not requested

### Step 4: Identify Dependencies
For each ❌ Missing or ⚠️ Partial item:
1. List what existing components it depends on
2. Identify what it might break or impact
3. Note if it requires auth/permissions layer first
4. Flag if it requires database schema changes

---

## Output Format

Your analysis MUST follow this exact structure:

### Part 1: Feature Gap Table

Present findings in a markdown table:

| Feature | Client Request | Evidence | Current Status | Gap Type | Priority | Notes |
|---------|---------------|----------|----------------|----------|----------|-------|
| [Feature name] | [Quote from transcript with timestamp] | [Screenshot ref or "verbal only"] | ✅/⚠️/❌/🚫 | [Explanation] | High/Med/Low | [Context] |

**Priority Guidelines**:
- **High**: Client said "critical", "must have", or referenced multiple times
- **Medium**: Client mentioned once with clear need
- **Low**: Client mentioned as "nice to have" or "eventually"

### Part 2: Dependency Impact Analysis

For each ❌ Missing feature, provide:

```markdown
## [Feature Name]

**What needs to be built:**
- [Specific component/capability]

**Dependencies:**
- Requires: [List existing system components this depends on]
- Blocks: [List features that depend on this]
- Auth requirement: [Yes/No - if yes, specify permission level]

**Potential Impacts:**
- Database: [Schema changes needed, if any]
- API: [New endpoints or changes to existing ones]
- Frontend: [New pages or changes to existing ones]
- Risk: [What could break]

**Complexity Estimate:**
[Low/Medium/High] - [Brief justification]
```

### Part 3: Safe Implementation Plan (Incremental)

Provide a phased roadmap that:
1. Respects current system constraints
2. Builds incrementally (no "rip and replace")
3. Prioritizes auth/permissions if needed
4. Groups related features logically

**Format:**

```markdown
### Phase 0: Foundation (If Needed)
**Goal**: Address prerequisites before feature work
**Items**:
- [ ] [Item 1 - e.g., "Implement role-based access control"]
- [ ] [Item 2]

**Why first**: [Justification]
**Risk if skipped**: [Consequence]

### Phase 1: [Theme Name]
**Goal**: [What this phase achieves]
**Items**:
- [ ] [Feature A] - Complexity: [Low/Med/High]
- [ ] [Feature B] - Complexity: [Low/Med/High]

**Dependencies**: [What from Phase 0 is required]
**Deliverable**: [What user can do after this phase]

### Phase 2: [Theme Name]
[Repeat structure]

...
```

---

## Critical Guidelines

### DO:
- ✅ Cite transcript timestamps for every claim
- ✅ Reference screenshot filenames when using visual evidence
- ✅ Respect all constraints in current_system.md
- ✅ Distinguish between "client showed this" vs "client wants this"
- ✅ Propose extensions, not redesigns
- ✅ Flag ambiguities that need client clarification
- ✅ Consider auth/permissions impact for every feature

### DO NOT:
- ❌ Assume visual reference = requirement
- ❌ Propose breaking existing navigation or APIs
- ❌ Suggest greenfield rebuilds
- ❌ Add features not mentioned by client
- ❌ Ignore stated constraints
- ❌ Make assumptions without flagging them
- ❌ Propose changes that require "rip and replace"

---

## Example Output Snippet

### Part 1: Feature Gap Table (Example)

| Feature | Client Request | Evidence | Current Status | Gap Type | Priority | Notes |
|---------|---------------|----------|----------------|----------|----------|-------|
| Supplier filtering by region | "For Joy login, only kitchen suppliers... only US, not China" (Meeting 2, 03:22) | Screenshot 38-40 (ClickUp supplier directory) | ⚠️ Partial | Supplier DB exists, but no region-based visibility control | High | Blocks outsourcing workflow |
| Document templates | "I had a letterhead done with a quotation format" (Meeting 2, 06:06) | Screenshot 5-7 (HoneyBook invoicing) | ❌ Missing | No template system exists | High | Mentioned multiple times |
| Payment milestones | "10,000... advance for 2,000... first milestone 2,500" (Meeting 2, 19:55) | Screenshot 6-7 (HoneyBook payment plans) | ❌ Missing | No milestone tracking | Medium | Part of project lifecycle |

### Part 2: Dependency Impact Analysis (Example)

```markdown
## Supplier Filtering by Region

**What needs to be built:**
- Region/category-based visibility rules for suppliers
- User-to-supplier access mapping

**Dependencies:**
- Requires: Supplier table (exists), User roles (needs implementation)
- Blocks: Safe outsourcing workflow, team collaboration features
- Auth requirement: Yes - Role-based access control (RBAC) system

**Potential Impacts:**
- Database: Add `supplier_access_rules` table, link to users/roles
- API: Modify supplier list endpoint to filter by user permissions
- Frontend: Add admin UI for managing access rules
- Risk: Could break existing supplier list if not backwards compatible

**Complexity Estimate:**
Medium - Requires RBAC foundation first, then feature implementation
```

### Part 3: Safe Implementation Plan (Example)

```markdown
### Phase 0: Foundation (CRITICAL)
**Goal**: Implement auth/permission layer required by multiple features
**Items**:
- [ ] Implement role-based access control (RBAC)
- [ ] Create user-to-role mapping
- [ ] Create role-to-resource permissions

**Why first**: 8 out of 12 missing features require permission scoping
**Risk if skipped**: Security vulnerabilities, unsafe outsourcing

### Phase 1: Supplier Management
**Goal**: Enable safe supplier database access and procurement delegation
**Items**:
- [ ] Region/category-based supplier filtering - Complexity: Medium
- [ ] Supplier ratings and internal notes with visibility control - Complexity: Low
- [ ] Master supplier directory with search - Complexity: Low

**Dependencies**: Phase 0 (RBAC) must be complete
**Deliverable**: Admin can grant team members filtered access to suppliers by region/category
```

---

## Validation Checklist

Before submitting your analysis, verify:

- [ ] Every requirement is backed by a transcript timestamp
- [ ] Visual evidence is cited by screenshot filename when applicable
- [ ] No proposed changes violate current_system.md constraints
- [ ] Feature gaps are categorized (✅/⚠️/❌/🚫)
- [ ] Dependencies are identified for each missing feature
- [ ] Implementation plan is incremental (no "Phase 1: Rebuild Everything")
- [ ] Auth/permissions impact is considered
- [ ] Ambiguities are flagged for client clarification

---

## Start Your Analysis

You have now been provided with:
1. Current system architecture (current_system.md)
2. Meeting transcripts with client intent (meeting_transcript.md)
3. Visual evidence index with screenshots (visual_evidence_index.md + /Visuals/)

Begin your delta analysis following the structure above.
