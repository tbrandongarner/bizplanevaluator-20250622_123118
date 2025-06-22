const { performance } = require('perf_hooks')
const pino = require('pino')

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined
})

function requestTimeLogger(req, res, next) {
  const startTime = performance.now()
  let hasFinished = false

  function logRequest(event) {
    const duration = (performance.now() - startTime).toFixed(3)
    const timestamp = new Date().toISOString()
    const { method } = req
    const url = req.originalUrl || req.url
    const status = res.statusCode
    const forwardedFor = req.headers['x-forwarded-for']
    const ip = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : req.ip || req.socket.remoteAddress || '-'
    logger.info(
      { timestamp, ip, method, url, status, duration, event },
      `${timestamp} | ${ip} | ${method} ${url} | ${status} | ${duration} ms${event === 'close' ? ' | aborted' : ''}`
    )
  }

  res.once('finish', () => {
    hasFinished = true
    logRequest('finish')
  })

  res.once('close', () => {
    if (!hasFinished) {
      logRequest('close')
    }
  })

  next()
}

module.exports = requestTimeLogger