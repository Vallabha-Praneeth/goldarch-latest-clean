const { AdminRulesProvider } = require('../standards_provider/admin_rules_provider');
const { CacheWrapper } = require('../caching/redis_cache');

const DEFAULT_DISCLAIMER =
  'Informational/approximate only. Verify with a licensed professional and local authority having jurisdiction.';

class ComplianceGate {
  constructor(options = {}) {
    this.provider = options.provider || new AdminRulesProvider(options.providerOptions);
    this.cache = options.cache || new CacheWrapper({ ttlSeconds: options.ttlSeconds || 120 });
  }

  async check(input) {
    const jurisdiction = this.provider.getJurisdiction(input.location || {});
    const cacheKey = this.cache.buildKey(
      jurisdiction.jurisdictionId,
      input.itemCategory,
      input.attributes
    );

    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return {
        jurisdiction,
        result: cached,
        informational: true,
      };
    }

    const result = this.provider.checkCompliance({
      jurisdictionId: jurisdiction.jurisdictionId,
      itemCategory: input.itemCategory,
      attributes: input.attributes,
    });

    const payload = {
      ...result,
      disclaimer: DEFAULT_DISCLAIMER,
    };

    await this.cache.set(cacheKey, payload);

    return {
      jurisdiction,
      result: payload,
      informational: true,
    };
  }
}

module.exports = { ComplianceGate };
