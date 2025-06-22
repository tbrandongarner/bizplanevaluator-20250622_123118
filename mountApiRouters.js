const express = require('express')
const businessPlanRouter = require('../routes/businessPlanRoutes')
const marketResearchRouter = require('../routes/marketResearchRoutes')
const financialProjectionRouter = require('../routes/financialProjectionRoutes')
const billingRouter = require('../routes/billingRoutes')

module.exports = function mountApiRouters(app) {
  const apiRouter = express.Router()

  apiRouter.use('/business-plans', businessPlanRouter)
  apiRouter.use('/market-research', marketResearchRouter)
  apiRouter.use('/financial-projections', financialProjectionRouter)
  apiRouter.use('/billing', billingRouter)

  // Catch-all for undefined API routes
  apiRouter.use('*', (req, res) => {
    res.status(404).json({ error: 'API route not found' })
  })

  // Mount versioned API router
  app.use('/api/v1', apiRouter)
}