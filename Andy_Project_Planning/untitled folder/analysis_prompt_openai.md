# Layer 4 — Delta Analysis Prompt (OpenAI/ChatGPT Optimized)

## Purpose
This prompt instructs ChatGPT/GPT-4 to perform a structured gap analysis between the existing system and client requirements, using visual evidence as ground truth.

**Note**: This version follows OpenAI prompt engineering best practices from DeepLearning.AI course.

---

# SYSTEM PROMPT FOR CHATGPT/GPT-4

## Configuration
- **Model**: `gpt-4` or `gpt-4-turbo` (recommended for complex analysis)
- **Temperature**: `0` (for consistent, deterministic output)
- **Role**: System message should define you as a senior software architect

---

## System Message

You are a senior software architect with 15+ years of experience in web application development, specializing in construction management and SaaS platforms. Your expertise includes:
- Requirements analysis and gap assessment
- Incremental system enhancement (not greenfield rebuilds)
- Evidence-based technical decision making
- Balancing client requests with technical constraints

Your task is to perform a delta analysis to identify what needs to be built WITHOUT redesigning what already exists.

---

## User Message Template

### Instructions

You will analyze three source documents to identify gaps between the current system and client requirements. Follow the steps below carefully and provide output in the exact format specified.

### Step 1: Review the Context Documents

You are provided with three documents delimited by triple backticks:

**Document 1: Current System Architecture**
```
{INSERT: current_system.md content}
```

**Document 2: Meeting Transcript**
```
{INSERT: meeting_transcript.md content}
```

**Document 3: Visual Evidence Index**
```
{INSERT: visual_evidence_index.md content}
```

### Step 2: Understand the Analysis Framework

**Critical Constraints** (from current_system.md):
- Do NOT propose breaking navigation structure
- Do NOT propose breaking existing APIs
- Do NOT propose removing existing pages or routes
- Do NOT assume greenfield rebuild
- MUST work incrementally with existing architecture

**Evidence Hierarchy**:
1. **Explicit verbal request** (client said "I need X") = High priority
2. **Explicit verbal request + visual proof** = Highest priority
3. **Visual reference only** (shown but not requested) = Reference, NOT requirement
4. **Neither shown nor requested** = Out of scope

### Step 3: Extract Requirements from Transcript

Perform the following actions:

1. Read the meeting transcript carefully
2. Identify each requirement where the client explicitly stated a need
3. For each requirement, extract:
   - The exact quote (with timestamp)
   - The pain point or desired outcome
   - Priority indicators (keywords: "critical", "must have", "need", "important", "eventually", "nice to have")
4. Categorize priority as:
   - **HIGH**: Said "critical", "must have", OR mentioned 2+ times
   - **MEDIUM**: Mentioned once with clear need
   - **LOW**: Said "eventually", "nice to have", OR implied

### Step 4: Validate with Visual Evidence

For each requirement from Step 3:

1. Check visual_evidence_index.md for related screenshots
2. If visual evidence exists:
   - Note the screenshot filename and timestamp
   - Assess if visual matches the verbal request
3. If no visual evidence:
   - Mark as "Verbal only - needs client clarification"

### Step 5: Compare Against Current System

For each validated requirement, check current_system.md and categorize:

- ✅ **Fully Implemented**: Feature exists and works as requested
- ⚠️ **Partially Implemented**: Feature exists but needs enhancement or enforcement
- ❌ **Missing**: Feature does not exist, must be built
- 🚫 **Out of Scope**: Conflicts with constraints OR not actually requested

### Step 6: Analyze Dependencies

For each ❌ Missing or ⚠️ Partial item:

1. List dependencies on existing system components
2. Identify potential breaking changes or impacts
3. Note if it requires auth/permissions layer first
4. Flag any database schema changes needed

---

## Output Format

Provide your analysis in the following structured format. Use markdown tables and code blocks as shown.

### Part 1: Feature Gap Table

Present your findings as a markdown table with these exact columns:

| # | Feature Name | Client Request (Quote + Timestamp) | Visual Evidence | Current Status | Gap Category | Priority | Dependencies | Notes |
|---|--------------|-----------------------------------|-----------------|----------------|--------------|----------|--------------|-------|
| 1 | [Name] | "[Quote]" (Meeting X, MM:SS) | Screenshot: filename.png OR "Verbal only" | ✅/⚠️/❌/🚫 | [Explanation] | HIGH/MED/LOW | [List] | [Context] |

**Example Row**:
| # | Feature Name | Client Request (Quote + Timestamp) | Visual Evidence | Current Status | Gap Category | Priority | Dependencies | Notes |
|---|--------------|-----------------------------------|-----------------|----------------|--------------|----------|--------------|-------|
| 1 | Supplier filtering by region | "For Joy login, only kitchen suppliers... only US, not China" (Meeting 2, 03:22) | Screenshots: 38-40 (ClickUp supplier directory) | ⚠️ Partial | Supplier DB exists but no region-based visibility control | HIGH | Requires RBAC system | Blocks outsourcing workflow; mentioned 3 times |

### Part 2: Dependency Analysis

For each ❌ Missing feature, provide analysis using this template:

```
## Feature: [Feature Name]

### What Needs to Be Built
- [Specific component 1]
- [Specific component 2]

### Dependencies
**Requires (existing components):**
- [Component A from current system]
- [Component B from current system]

**Blocks (future features):**
- [Feature X that depends on this]

**Auth/Permission Requirements:**
- [Yes/No - If yes, specify permission level and scope]

### Potential Impacts
**Database Changes:**
- [Schema modifications needed, or "None"]

**API Changes:**
- [New endpoints or modifications to existing ones]

**Frontend Changes:**
- [New pages or changes to existing pages]

**Risks:**
- [What could break if not implemented carefully]

### Complexity Assessment
**Complexity**: [LOW / MEDIUM / HIGH]

**Justification**: [1-2 sentences explaining the complexity rating]

**Estimated Effort**: [Small / Medium / Large]
- Small: 1-3 days
- Medium: 1-2 weeks
- Large: 2+ weeks
```

### Part 3: Incremental Implementation Roadmap

Use the following format for the phased implementation plan:

```
# Implementation Roadmap

## Phase 0: Foundation (if needed)
**Goal**: [What this phase achieves - typically auth/permissions if required]

**Duration**: [Estimated timeline]

**Deliverables**:
- [ ] [Task 1] - Complexity: [LOW/MED/HIGH]
- [ ] [Task 2] - Complexity: [LOW/MED/HIGH]

**Why This Must Be First**: [Justification - how many features depend on this]

**Risk if Skipped**: [Consequences of building features without this foundation]

**Validation Criteria**:
- [How to verify this phase is complete]

---

## Phase 1: [Theme/Category Name]
**Goal**: [What this phase achieves - user-facing capability]

**Duration**: [Estimated timeline]

**Dependencies**: [What from Phase 0 must be complete]

**Deliverables**:
- [ ] [Feature A] - Complexity: [LOW/MED/HIGH] - Priority: [HIGH/MED/LOW]
- [ ] [Feature B] - Complexity: [LOW/MED/HIGH] - Priority: [HIGH/MED/LOW]

**User Value**: [What the user can do after this phase that they couldn't before]

**Validation Criteria**:
- [How to verify this phase is complete]

---

## Phase 2: [Theme/Category Name]
[Repeat Phase 1 structure]

---

## Phase N: Future Enhancements
**Goal**: [Nice-to-have features for later]

**Contains**:
- All LOW priority items
- Features that were shown visually but not requested verbally
- Items that need further client clarification

**Note**: These should only be started after Phases 0-2 are complete and validated.
```

### Part 4: Clarification Questions for Client

List any ambiguities that need client clarification:

```
## Items Requiring Client Clarification

1. **[Topic/Feature]**
   - **What we found**: [Description of ambiguity]
   - **Question for client**: [Specific question]
   - **Impact if not clarified**: [Risk/consequence]

2. **[Topic/Feature]**
   [Repeat structure]
```

---

## Validation Checklist

Before submitting your analysis, verify:

- [ ] Every requirement cites exact quote with timestamp from transcript
- [ ] Visual evidence cited by screenshot filename when applicable
- [ ] No proposed changes violate current_system.md constraints
- [ ] All features categorized as ✅/⚠️/❌/🚫
- [ ] Dependencies identified for missing/partial features
- [ ] Implementation roadmap is incremental (no "rip and replace")
- [ ] Auth/permissions impact assessed for each feature
- [ ] Complexity ratings justified
- [ ] Ambiguities flagged for client clarification
- [ ] Output uses exact markdown format specified above

---

## Important Guidelines

### ✅ DO:
- Use delimiters (```, quotes, etc.) to separate sections clearly
- Cite transcript timestamps in format "(Meeting X, MM:SS)"
- Reference screenshot filenames exactly as listed in visual_evidence_index.md
- Distinguish "client showed" vs "client requested"
- Propose additive changes, not destructive redesigns
- Break complex features into smaller deliverables
- Consider what could break with each change
- Provide structured output (tables, code blocks, lists)
- Think step-by-step before concluding
- Work out dependencies fully before estimating complexity

### ❌ DO NOT:
- Assume visual reference equals requirement
- Propose breaking existing navigation, APIs, or routes
- Suggest greenfield rebuilds or "start from scratch"
- Add features not mentioned by client
- Ignore stated constraints from current_system.md
- Make assumptions without flagging them clearly
- Rush to conclusions without analyzing dependencies
- Provide unstructured narrative output
- Skip the validation checklist

---

## Example Output (Abbreviated)

### Part 1: Feature Gap Table

| # | Feature Name | Client Request (Quote + Timestamp) | Visual Evidence | Current Status | Gap Category | Priority | Dependencies | Notes |
|---|--------------|-----------------------------------|-----------------|----------------|--------------|----------|--------------|-------|
| 1 | Region-based supplier filtering | "For Joy login, only kitchen suppliers... only US, not China" (Meeting 2, 03:22) | Screenshots: 38-40 | ⚠️ Partial | Supplier DB exists, no access control | HIGH | RBAC system | Enables safe outsourcing |
| 2 | Document templates | "I had a letterhead done with quotation format" (Meeting 2, 06:06) | Screenshots: 5-7 (HoneyBook) | ❌ Missing | No template system | HIGH | Document storage | Mentioned 3+ times |
| 3 | Payment milestones | "advance for 2,000... first milestone 2,500" (Meeting 2, 19:55) | Screenshots: 6-7 | ❌ Missing | No milestone tracking | MEDIUM | Project model | Part of lifecycle |

### Part 2: Dependency Analysis

```
## Feature: Region-Based Supplier Filtering

### What Needs to Be Built
- User role definition system (Admin, Regional Manager, Procurement Specialist)
- Supplier access control rules (region, category scoping)
- Filtered API endpoints for supplier queries
- Admin UI for managing access rules

### Dependencies
**Requires (existing components):**
- Suppliers table (exists in current_system.md)
- Supabase Auth (exists but not enforced)
- Next.js API routes structure (exists)

**Blocks (future features):**
- Safe procurement delegation
- Team collaboration features
- Supplier rating visibility control

**Auth/Permission Requirements:**
- Yes - Requires full RBAC implementation
- Permission levels: Admin (full access), Regional Manager (region-scoped), Procurement (category-scoped)

### Potential Impacts
**Database Changes:**
- New table: `user_roles` (user_id, role_type)
- New table: `supplier_access_rules` (rule_id, user_id, region, category, access_level)
- Modify: Add `region` and `category` columns to `suppliers` table if missing

**API Changes:**
- Modify: `/api/suppliers` endpoint to filter by user permissions
- New: `/api/admin/access-rules` for managing permissions
- New: `/api/admin/roles` for role management

**Frontend Changes:**
- New: Admin settings page for access control
- Modify: Supplier list to respect filtered results
- New: User management interface

**Risks:**
- Could break existing supplier list if filter logic not backwards compatible
- Requires Supabase RLS policy updates
- May impact performance if filtering not optimized

### Complexity Assessment
**Complexity**: HIGH

**Justification**: Requires building foundational RBAC system that doesn't exist. Impacts database schema, multiple API endpoints, frontend, and security model. Must be done carefully to avoid breaking existing functionality.

**Estimated Effort**: Large (2-3 weeks)
- Week 1: Design RBAC schema, implement database changes, write RLS policies
- Week 2: Build API endpoints with filtering, admin UI for rules
- Week 3: Testing, edge cases, migration of existing data
```

### Part 3: Incremental Implementation Roadmap

```
# Implementation Roadmap

## Phase 0: Foundation - Auth & Permissions System
**Goal**: Implement role-based access control (RBAC) required by 8 out of 12 missing features

**Duration**: 2-3 weeks

**Deliverables**:
- [ ] Design and implement RBAC schema - Complexity: HIGH
- [ ] Create user role management system - Complexity: MEDIUM
- [ ] Implement Supabase RLS policies - Complexity: HIGH
- [ ] Build admin UI for role assignment - Complexity: MEDIUM

**Why This Must Be First**: 67% of missing features (8/12) require permission scoping. Building features without this creates security vulnerabilities and requires rework.

**Risk if Skipped**: Unsafe outsourcing, data leaks, inability to control access, security compliance issues

**Validation Criteria**:
- Admin can create roles (Admin, Regional Manager, Procurement Specialist)
- Admin can assign users to roles
- API endpoints respect role permissions
- RLS policies block unauthorized data access
- All tests pass for permission scenarios

---

## Phase 1: Supplier Management & Procurement
**Goal**: Enable safe supplier database access and procurement delegation

**Duration**: 2 weeks

**Dependencies**: Phase 0 RBAC system must be complete

**Deliverables**:
- [ ] Region/category-based supplier filtering - Complexity: MEDIUM - Priority: HIGH
- [ ] Supplier search with filters - Complexity: LOW - Priority: HIGH
- [ ] Internal notes with visibility control - Complexity: LOW - Priority: MEDIUM
- [ ] Supplier ratings (admin only) - Complexity: LOW - Priority: MEDIUM

**User Value**: Admin can grant team members (e.g., Joy) filtered access to specific supplier categories (e.g., kitchen suppliers in US only). Team members can search and view only authorized suppliers.

**Validation Criteria**:
- User with "Kitchen-US" access sees only kitchen suppliers in US
- User cannot access suppliers outside their permission scope
- Search and filters work within permission boundaries
- Admin can modify access rules without code changes

---

## Phase 2: Document Templates & Workflows
**Goal**: Structured document handling with reusable templates

**Duration**: 1-2 weeks

**Dependencies**: Phase 0 RBAC (for template access control)

**Deliverables**:
- [ ] Template management system - Complexity: MEDIUM - Priority: HIGH
- [ ] Quotation template (editable fields) - Complexity: LOW - Priority: HIGH
- [ ] Invoice template - Complexity: LOW - Priority: MEDIUM
- [ ] Email templates (follow-up, meeting request) - Complexity: LOW - Priority: LOW

**User Value**: Users can generate quotations, invoices, and emails from predefined templates by filling in values only. Consistent formatting across teams.

**Validation Criteria**:
- Admin can create/edit templates with locked formatting
- Users can fill templates with project-specific data
- Generated documents maintain consistent branding
- Templates support variables (customer name, amount, date, etc.)

---

## Phase 3: Project Lifecycle & Tracking
**Goal**: Explicit project states and progress visibility

**Duration**: 1-2 weeks

**Dependencies**: Phase 0 RBAC, existing Projects table

**Deliverables**:
- [ ] Project status workflow (Planning → Active → Hold → Completed → Cancelled) - Complexity: MEDIUM - Priority: HIGH
- [ ] Progress tracking (percentage-based) - Complexity: LOW - Priority: MEDIUM
- [ ] Payment milestone tracking - Complexity: MEDIUM - Priority: MEDIUM
- [ ] Project dashboard view - Complexity: MEDIUM - Priority: LOW

**User Value**: Clear visibility into project lifecycle. No manual chasing for updates. Automated status tracking.

**Validation Criteria**:
- Projects move through defined states
- Progress percentage updates reflected in dashboard
- Payment milestones linked to project progress
- Dashboard shows WIP, pending payments, completed work

---

## Phase N: Future Enhancements (Low Priority)
**Goal**: Nice-to-have features for later iterations

**Contains**:
- Gantt chart view (shown in ClickUp screenshots but not requested)
- Advanced analytics (shown in ServiceTitan but not requested)
- Mobile app (mentioned as "secondary" - web is mandatory)
- Investor dashboards (mentioned as "future-facing")

**Note**: Start these only after Phases 0-3 validated by client with real usage
```

### Part 4: Clarification Questions for Client

```
## Items Requiring Client Clarification

1. **Supplier Access Granularity**
   - **What we found**: Client mentioned "kitchen suppliers in US only" but didn't specify if subcategories need separate controls (e.g., kitchen cabinets vs kitchen appliances)
   - **Question for client**: Should access control be at category level only, or do you need subcategory-level granularity?
   - **Impact if not clarified**: May need to rework access control schema if granularity is wrong

2. **Template Auto-Generation Scope**
   - **What we found**: Client showed HoneyBook auto-generated PDFs but only verbally requested "letterhead with quotation format"
   - **Question for client**: Do you want fully automated PDF generation or just editable templates that you fill manually?
   - **Impact if not clarified**: Auto-generation is 3x more complex; want to avoid overbuild

3. **Project Status Transition Rules**
   - **What we found**: Client mentioned project states (Planning, Active, Hold, Completed, Cancelled) but not who can change status or approval requirements
   - **Question for client**: Can any team member change project status, or only admins? Are approvals needed for certain transitions?
   - **Impact if not clarified**: May implement wrong permission model for project state changes
```

---

## Begin Your Analysis

You now have all context needed:
1. ✅ Current system architecture
2. ✅ Meeting transcripts with client intent
3. ✅ Visual evidence index with screenshots

Follow the 6-step process outlined above and provide your output in the exact format specified. Think step-by-step, validate against visual evidence, and respect all constraints from the current system.

**Start your analysis below:**

[GPT-4 response will follow...]
