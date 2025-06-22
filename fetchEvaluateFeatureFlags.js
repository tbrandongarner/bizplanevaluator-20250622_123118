const LaunchDarkly = require('launchdarkly-node-server-sdk');

class FeatureFlagService {
  constructor() {
    const sdkKey = process.env.LAUNCHDARKLY_SDK_KEY;
    if (!sdkKey) {
      throw new Error('LAUNCHDARKLY_SDK_KEY is not set');
    }
    this.client = LaunchDarkly.init(sdkKey);
    this.ready = this.client.waitForInitialization();
  }

  async variation(user, flagKey, defaultValue = false) {
    await this.ready;
    return this.client.variation(flagKey, user, defaultValue);
  }

  async variations(user, flagKeys, defaults = {}) {
    await this.ready;
    const variationPromises = flagKeys.map(key => {
      const dv = Object.prototype.hasOwnProperty.call(defaults, key) ? defaults[key] : false;
      return this.client.variation(key, user, dv).then(value => ({ key, value }));
    });
    const resolved = await Promise.all(variationPromises);
    const results = {};
    for (const { key, value } of resolved) {
      results[key] = value;
    }
    return results;
  }

  close() {
    return this.client.close();
  }
}

const featureFlagService = new FeatureFlagService();

async function fetchEvaluateFeatureFlags({ userId, attributes = {}, flagKeys = [], defaults = {} }) {
  if (!userId) {
    throw new Error('userId is required');
  }
  if (!Array.isArray(flagKeys) || flagKeys.length === 0) {
    throw new Error('flagKeys must be a non-empty array');
  }
  const user = { ...attributes, key: userId };
  return featureFlagService.variations(user, flagKeys, defaults);
}

module.exports = { fetchEvaluateFeatureFlags, featureFlagService };