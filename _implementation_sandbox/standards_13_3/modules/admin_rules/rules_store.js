const fs = require('fs');
const path = require('path');

const DEFAULT_RULES_PATH = path.join(__dirname, 'rules_seed.json');

function loadRules(rulesPath = DEFAULT_RULES_PATH) {
  const raw = fs.readFileSync(rulesPath, 'utf8');
  return JSON.parse(raw);
}

function findJurisdictionId(rulesData, location) {
  const stateInput = (location.state || '').trim();
  const normalized = stateInput.toLowerCase();

  for (const j of rulesData.jurisdictions) {
    const aliasMatch = (j.aliases || []).some((alias) => alias.toLowerCase() === normalized);
    if (aliasMatch || j.state.toLowerCase() === normalized) {
      return { jurisdictionId: j.id, state: j.state, name: j.name, confidence: 0.85 };
    }
  }

  return { jurisdictionId: 'us-unknown', state: stateInput || 'unknown', name: 'Unknown', confidence: 0.3 };
}

function findRule(rulesData, jurisdictionId, itemCategory) {
  return rulesData.rules.find(
    (rule) =>
      rule.jurisdictionId === jurisdictionId &&
      rule.itemCategory.toLowerCase() === itemCategory.toLowerCase()
  );
}

module.exports = {
  loadRules,
  findJurisdictionId,
  findRule,
  DEFAULT_RULES_PATH,
};
