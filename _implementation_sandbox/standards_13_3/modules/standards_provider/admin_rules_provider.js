const path = require('path');
const {
  loadRules,
  findJurisdictionId,
  findRule,
} = require('../admin_rules/rules_store');

class AdminRulesProvider {
  constructor(options = {}) {
    const defaultPath = path.join(__dirname, '..', 'admin_rules', 'rules_seed.json');
    this.rulesPath = options.rulesPath || defaultPath;
    this.rulesData = loadRules(this.rulesPath);
  }

  getJurisdiction(location) {
    const match = findJurisdictionId(this.rulesData, location || {});
    return {
      state: match.state,
      city: location.city || null,
      county: location.county || null,
      jurisdictionId: match.jurisdictionId,
      confidence: match.confidence,
    };
  }

  checkCompliance({ jurisdictionId, itemCategory, attributes }) {
    const rule = findRule(this.rulesData, jurisdictionId, itemCategory);

    if (!rule) {
      return {
        allowed: true,
        allowedOptions: [],
        rationale: 'No admin rule found; manual verification required.',
        trace: {
          sourceType: 'admin_rule',
          ruleId: null,
          ruleVersion: null,
          updatedAt: null,
          updatedBy: null,
        },
        citations: [],
      };
    }

    const material = (attributes?.material || '').toLowerCase();
    const disallowed = (rule.disallowedOptions || []).map((v) => v.toLowerCase());
    const allowed = material ? !disallowed.includes(material) : true;

    return {
      allowed,
      allowedOptions: rule.allowedOptions || [],
      rationale: rule.rationale,
      trace: {
        sourceType: 'admin_rule',
        ruleId: rule.id,
        ruleVersion: rule.version,
        updatedAt: rule.updatedAt,
        updatedBy: rule.updatedBy,
      },
      citations: rule.citations || [],
    };
  }
}

module.exports = { AdminRulesProvider };
