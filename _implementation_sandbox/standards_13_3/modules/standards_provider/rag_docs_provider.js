class RagDocsProvider {
  getJurisdiction(location) {
    return {
      state: location?.state || 'unknown',
      city: location?.city || null,
      county: location?.county || null,
      jurisdictionId: 'doc-stub',
      confidence: 0.2,
    };
  }

  checkCompliance({ jurisdictionId, itemCategory }) {
    return {
      allowed: true,
      allowedOptions: [],
      rationale: `Doc-backed provider is a stub; no real standards data for ${jurisdictionId}/${itemCategory}.`,
      trace: {
        sourceType: 'doc_stub',
        ruleId: null,
        ruleVersion: null,
        updatedAt: null,
        updatedBy: null,
      },
      citations: [],
    };
  }
}

module.exports = { RagDocsProvider };
