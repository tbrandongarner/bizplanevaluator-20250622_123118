const axios = require('axios')
const axiosRetry = require('axios-retry')
const cache = require('../utils/cache')
const { normalizeIndustryStats } = require('../utils/normalizer')

const CACHE_TTL = 3600 // seconds
const DEFAULT_TIMEOUT = 5000 // milliseconds

const axiosInstance = axios.create({ timeout: DEFAULT_TIMEOUT })
axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: error =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED'
})

const inFlightRequests = new Map()

function sanitizeIndustry(industry) {
  return industry
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
}

async function fetchCrunchbase(industry) {
  const url = process.env.CRUNCHBASE_API_URL
  const apiKey = process.env.CRUNCHBASE_API_KEY
  try {
    const response = await axiosInstance.get(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      params: { query: industry }
    })
    return response.data
  } catch (err) {
    throw new Error(`Crunchbase fetch error: ${err.message}`)
  }
}

async function fetchStatista(industry) {
  const url = process.env.STATISTA_API_URL
  const apiKey = process.env.STATISTA_API_KEY
  try {
    const response = await axiosInstance.get(url, {
      headers: { 'x-api-key': apiKey },
      params: { search: industry }
    })
    return response.data
  } catch (err) {
    throw new Error(`Statista fetch error: ${err.message}`)
  }
}

async function getMarketCompetitorData(industry) {
  if (!industry || typeof industry !== 'string') {
    throw new Error('Industry parameter must be a nonempty string')
  }
  const sanitized = sanitizeIndustry(industry)
  const key = `industryStats:${sanitized}`

  const cached = await cache.get(key)
  if (cached) {
    return cached
  }

  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)
  }

  const promise = (async () => {
    try {
      const [cbData, statData] = await Promise.all([
        fetchCrunchbase(industry),
        fetchStatista(industry)
      ])
      const normalized = normalizeIndustryStats(cbData, statData)
      await cache.set(key, normalized, CACHE_TTL)
      return normalized
    } finally {
      inFlightRequests.delete(key)
    }
  })()

  inFlightRequests.set(key, promise)
  return promise
}

module.exports = {
  getMarketCompetitorData
}