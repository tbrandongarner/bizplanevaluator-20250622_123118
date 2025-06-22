const Joi = require('joi')
const { orchestrateAnalysis } = require('../services/openAiAnalysisOrchestrator')
const { getMarketCompetitorData } = require('../services/marketCompetitorPipeline')
const { runFinancialModels } = require('../services/runFinancialModels')
const { ValidationError, ServiceError } = require('../errors')

const financialInputsSchema = Joi.object({
  initialInvestment: Joi.number().min(0).required(),
  monthlyRevenue: Joi.number().min(0).required(),
  monthlyExpenses: Joi.number().min(0).required(),
  projectionYears: Joi.number().integer().min(1).max(10).required()
})

const ideaSchema = Joi.object({
  id: Joi.string().uuid().required(),
  name: Joi.string().min(1).required(),
  industry: Joi.string().min(1).required(),
  description: Joi.string().allow('').optional(),
  financialInputs: financialInputsSchema.required()
}).required()

const aiSectionsSchema = Joi.object({
  summary: Joi.string().required(),
  swot: Joi.array().items(Joi.string()).required(),
  recommendations: Joi.array().items(Joi.string()).required()
}).required()

async function buildFinancialPlan(idea) {
  const { error: validationError, value } = ideaSchema.validate(idea, { abortEarly: false })
  if (validationError) {
    throw new ValidationError('Invalid idea payload', validationError.details)
  }

  const aiPromise = orchestrateAnalysis(value)
  const marketPromise = getMarketCompetitorData(value.industry)
  const financialsPromise = runFinancialModels(value.financialInputs)

  const [aiResult, marketResult, financesResult] = await Promise.allSettled([
    aiPromise,
    marketPromise,
    financialsPromise
  ])

  if (aiResult.status === 'rejected') {
    throw new ServiceError('AI analysis failed', aiResult.reason)
  }
  if (marketResult.status === 'rejected') {
    throw new ServiceError('Market data fetch failed', marketResult.reason)
  }
  if (financesResult.status === 'rejected') {
    throw new ServiceError('Financial projection failed', financesResult.reason)
  }

  const aiSectionsRaw = aiResult.value
  const market = marketResult.value
  const financials = financesResult.value

  const { error: aiSectionsError, value: aiSections } = aiSectionsSchema.validate(aiSectionsRaw, { abortEarly: false })
  if (aiSectionsError) {
    throw new ServiceError('Invalid AI sections format', aiSectionsError.details)
  }

  return {
    executiveSummary: aiSections.summary,
    marketAnalysis: market,
    swot: aiSections.swot,
    projections: financials,
    recommendations: aiSections.recommendations
  }
}

module.exports = buildFinancialPlan