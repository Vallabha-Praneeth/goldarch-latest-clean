/**
 * StandardsProvider interface (documentation-only).
 *
 * getJurisdiction(location) -> { state, city?, county?, jurisdictionId, confidence }
 * checkCompliance({ jurisdictionId, itemCategory, attributes }) ->
 * {
 *   allowed,
 *   allowedOptions,
 *   rationale,
 *   trace: { sourceType, ruleId?, ruleVersion?, updatedAt?, updatedBy? },
 *   citations: [{ title, pointer }]
 * }
 */

module.exports = {};
