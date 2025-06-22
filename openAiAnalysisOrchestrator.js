const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const logger = require('./loggermiddleware');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

const TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'analysisPrompt.md');

function loadTemplate() {
  const templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  return Handlebars.compile(templateContent);
}

function buildPrompt({ industry, market, revenueModel }) {
  const template = loadTemplate();
  return template({ industry, market, revenueModel });
}

function parseSections(content) {
  const sections = {};
  const sectionRegex = /^###\s*(.+)/gm;
  let match;
  let lastIndex = 0;
  let lastSection = 'overview';

  while ((match = sectionRegex.exec(content)) !== null) {
    const sectionName = match[1].trim().toLowerCase().replace(/\s+/g, '_');
    const sectionStart = match.index + match[0].length;
    if (lastIndex === 0) {
      const initial = content.slice(0, match.index).trim();
      if (initial) sections[lastSection] = initial;
    } else {
      const sectionContent = content.slice(lastIndex, match.index).trim();
      sections[lastSection] = sectionContent;
    }
    lastSection = sectionName;
    lastIndex = sectionStart;
  }

  const remaining = content.slice(lastIndex).trim();
  if (remaining) {
    sections[lastSection] = remaining;
  }

  return sections;
}

async function orchestrateAnalysis({ industry, market, revenueModel }) {
  try {
    const prompt = buildPrompt({ industry, market, revenueModel });
    const response = await openai.createCompletion({
      model: 'gpt-4',
      prompt,
      max_tokens: 1500,
      temperature: 0.7
    });

    const text = response.data.choices?.[0]?.text || '';
    const analysis = parseSections(text);
    return analysis;
  } catch (error) {
    logger.error('openAiAnalysisOrchestrator error:', error);
    throw error;
  }
}

module.exports = {
  orchestrateAnalysis
};