// server/llm.js
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');

const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_PROVIDER = process.env.DEFAULT_LLM_PROVIDER || 'anthropic';
const DEFAULT_MODELS = {
  anthropic: 'claude-haiku-5-5',
  openai: 'gpt-4o',
};

// Note: current Claude models reject the `temperature` parameter, so it is not sent.
async function callAnthropic({ model, system, messages, maxTokens }) {
  const response = await anthropicClient.messages.create({
    model,
    max_tokens: maxTokens,
    system: system || undefined,
    messages,
  });

  return {
    text: response.content[0].text,
    model: response.model,
    provider: 'anthropic',
    usage: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      total: response.usage.input_tokens + response.usage.output_tokens,
    },
    finished: response.stop_reason === 'end_turn',
  };
}

async function callOpenAI({ model, system, messages, temperature, maxTokens }) {
  const apiMessages = [];
  if (system) apiMessages.push({ role: 'system', content: system });
  apiMessages.push(...messages);

  const completion = await openaiClient.chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages: apiMessages,
  });

  const choice = completion.choices[0];
  return {
    text: choice.message.content,
    model: completion.model,
    provider: 'openai',
    usage: {
      input: completion.usage.prompt_tokens,
      output: completion.usage.completion_tokens,
      total: completion.usage.total_tokens,
    },
    finished: choice.finish_reason === 'stop',
  };
}

async function generateResponse({
  provider = DEFAULT_PROVIDER,
  model,
  system,
  messages,
  temperature = 0.7,
  maxTokens = 1024,
}) {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages must be a non-empty array');
  }

  const selectedModel = model || DEFAULT_MODELS[provider];
  const options = {
    model: selectedModel,
    system,
    messages,
    temperature: Math.max(0, Math.min(provider === 'openai' ? 2 : 1, temperature)),
    maxTokens: Math.min(maxTokens, 4096),
  };

  switch (provider) {
    case 'anthropic':
      return await callAnthropic(options);
    case 'openai':
      return await callOpenAI(options);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

module.exports = { generateResponse };