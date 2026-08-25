export interface BedrockModelConfig {
  id: string;
  name: string;
  provider: 'Anthropic' | 'Amazon' | 'Mistral' | 'Meta';
  tier: 'fast_structured' | 'balanced' | 'high_reasoning';
  contextWindow: number;
  inputCostPer1k: number;  // in USD
  outputCostPer1k: number; // in USD
  description: string;
}

export const BEDROCK_MODELS: Record<string, BedrockModelConfig> = {
  'anthropic.claude-3-5-sonnet-20241022-v2:0': {
    id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    name: 'Anthropic Claude 3.5 Sonnet v2',
    provider: 'Anthropic',
    tier: 'high_reasoning',
    contextWindow: 200000,
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
    description: 'Premier model for complex learning graph reasoning, prerequisite synthesis, and tutoring.'
  },
  'anthropic.claude-3-haiku-20240307-v1:0': {
    id: 'anthropic.claude-3-haiku-20240307-v1:0',
    name: 'Anthropic Claude 3 Haiku',
    provider: 'Anthropic',
    tier: 'fast_structured',
    contextWindow: 200000,
    inputCostPer1k: 0.00025,
    outputCostPer1k: 0.00125,
    description: 'Ultra-fast and cost-efficient for profile extraction and conversational onboarding.'
  },
  'amazon.nova-lite-v1:0': {
    id: 'amazon.nova-lite-v1:0',
    name: 'Amazon Nova Lite',
    provider: 'Amazon',
    tier: 'fast_structured',
    contextWindow: 300000,
    inputCostPer1k: 0.00006,
    outputCostPer1k: 0.00024,
    description: 'Next-gen lightning fast Amazon native foundation model on AWS Bedrock.'
  },
  'amazon.nova-pro-v1:0': {
    id: 'amazon.nova-pro-v1:0',
    name: 'Amazon Nova Pro',
    provider: 'Amazon',
    tier: 'high_reasoning',
    contextWindow: 300000,
    inputCostPer1k: 0.0008,
    outputCostPer1k: 0.0032,
    description: 'Highly capable multimodal model for deep roadmap structuring and adaptive reasoning.'
  },
  'amazon.titan-text-express-v1': {
    id: 'amazon.titan-text-express-v1',
    name: 'Amazon Titan Text Express',
    provider: 'Amazon',
    tier: 'balanced',
    contextWindow: 8000,
    inputCostPer1k: 0.0002,
    outputCostPer1k: 0.0006,
    description: 'General purpose text generation optimized for high-throughput AWS deployments.'
  },
  'meta.llama3-70b-instruct-v1:0': {
    id: 'meta.llama3-70b-instruct-v1:0',
    name: 'Meta Llama 3 70B Instruct',
    provider: 'Meta',
    tier: 'high_reasoning',
    contextWindow: 8192,
    inputCostPer1k: 0.00265,
    outputCostPer1k: 0.0035,
    description: 'Open-weights powerhouse on Bedrock for explainable recommendation rationale.'
  }
};

export const DEFAULT_BEDROCK_MODEL = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
export const EXTRACTION_BEDROCK_MODEL = 'anthropic.claude-3-haiku-20240307-v1:0';
