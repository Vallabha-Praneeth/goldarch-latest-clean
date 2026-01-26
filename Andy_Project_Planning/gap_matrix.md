# Gap Matrix — Intent × Current System

This document maps **client intent** (`intent_contract.md`) against the **current framework** (`current_system.md`).
It is a decision-grade artifact used to control scope, planning, and AI-assisted design.

**Legend**
- ✅ = Already supported
- ⚠️ = Partially supported (extension/enforcement needed)
- ❌ = Not supported (gap)
- 🔒 = Non-negotiable constraint applies

---

## 1. Core Intent — Single Source of Truth

| Aspect | Intent | Current System | Gap |
|------|--------|----------------|-----|
| Centralized data | Replace WhatsApp / Excel / Email | Data exists across Projects, Deals, Docs | ⚠️ |
| Controlled expansion | Start simple, expand later | Parallel implementations exist | ⚠️ |
| Outsourcing readiness | Safe delegation | No permission enforcement | ❌ |
| Visibility without follow-up | Dashboards, status views | Partial views only | ⚠️ |

**Summary:** Can act as source of truth, but enforcement layers are missing.

---

## 2. Access & Control 🔒

| Aspect | Intent | Current System | Gap |
|------|--------|----------------|-----|
| Private by default | Required | Auth permissive | ❌ |
| Role-based access | Required | Not enforced | ❌ |
| Region/category scoping | Required | Not implemented | ❌ |
| Action permissions | View / send / rate | Not implemented | ❌ |

**Summary:** Largest structural gap. Outsourcing is unsafe without this.

---

## 3. Supplier & Procurement

| Aspect | Intent | Current System | Gap |
|------|--------|----------------|-----|
| Master supplier DB | Required | Exists | ⚠️ |
| Categorization | Category → Subcategory | Partial | ⚠️ |
| Geo/capability filters | Required | Missing | ❌ |
| Controlled visibility | Required | Missing | ❌ |
| Supplier ratings | Required | Partial | ⚠️ |
| Internal notes | Required | No scoping | ❌ |

**Summary:** Data exists, governance does not.

---

## 4. Quotations, Documents & Templates

| Aspect | Intent | Current System | Gap |
|------|--------|----------------|-----|
| Structured uploads | Required | Upload exists | ⚠️ |
| Workflow-based docs | Required | Ad-hoc | ❌ |
| Reusable templates | Required | Conceptual only | ❌ |
| Auto-generation | Desired | Not implemented | ❌ |
| Locked formats | Required | Not implemented | ❌ |

**Summary:** Workflow gap, not storage gap.

---

## 5. Project Lifecycle

| Aspect | Intent | Current System | Gap |
|------|--------|----------------|-----|
| Explicit statuses | Required | Implicit | ❌ |
| Progress tracking | % based | Missing | ❌ |
| Payment linkage | Required | Partial | ⚠️ |
| Unified project view | Required | Scattered | ⚠️ |

**Summary:** Projects exist but are not lifecycle-aware.

---

## 6. Reporting & Dashboards

| Aspect | Intent | Current System | Gap |
|------|--------|----------------|-----|
| High-level dashboards | Required | Missing | ❌ |
| No manual chasing | Required | Manual today | ❌ |
| Investor views | Required | Missing | ❌ |

**Summary:** Dashboards largely absent.

---

## 7. Phased Execution 🔒

| Aspect | Intent | Current System | Gap |
|------|--------|----------------|-----|
| Phase 1 (dummy data) | Required | Supported | ✅ |
| Phase 2 (real data) | Required | Supported | ✅ |
| Schema freeze | Required | Not enforced | ❌ |

**Summary:** Technically feasible, process discipline missing.

---

## 8. Technology References

| Aspect | Intent | Current System | Gap |
|------|--------|----------------|-----|
| Reference only | Required | Tool clones exist | ⚠️ |
| No parity requirement | Required | Overbuild risk | ⚠️ |

**Summary:** Planning discipline gap.

---

## 9. URL / Access

| Aspect | Intent | Current System | Gap |
|------|--------|----------------|-----|
| Web access | Mandatory | Exists | ✅ |
| Signup + test | Required | Partial | ⚠️ |
| Mobile later | Secondary | Not started | ✅ |

**Summary:** Web-first alignment is correct.

---

# Executive Summary

### Critical Gaps (Fix First)
- Access & control (roles, scoping, permissions)
- Supplier visibility governance
- Project lifecycle enforcement
- Dashboards and reporting

### Structural Gaps (Phase 1–2)
- Document workflows & templates
- Procurement delegation controls
- Schema freeze enforcement

### Already Aligned
- Web-first platform
- Phased execution feasibility
- Core data entities

---

## Usage Rule
Any planning (human or AI) must:
- Address only ❌ and ⚠️ items
- Preserve all ✅ items
- Respect constraints from `current_system.md`
