function normalizeIndustryStats(cbData, statData) {
  return {
    crunchbase: cbData || {},
    statista: statData || {}
  };
}

module.exports = { normalizeIndustryStats };
