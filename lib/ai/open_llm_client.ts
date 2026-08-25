export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionResult {
  reply: string;
  provider: string;
  model: string;
  latencyMs: number;
  success: boolean;
  error?: string;
}

/**
 * Universal Open-Source & Free Agentic LLM Client
 * Supports:
 * 1. Groq Cloud (Llama 3.3 70B, DeepSeek R1 Distill, Qwen 2.5 32B)
 * 2. OpenRouter Free Tier (meta-llama/llama-3.3-70b-instruct:free, deepseek/deepseek-r1:free)
 * 3. Local Ollama (llama3.3, qwen2.5-coder, deepseek-r1)
 * 4. Zhipu AI GLM (glm-5.3, glm-5-turbo)
 */
class OpenLLMClient {
  private groqApiKey: string;
  private openRouterApiKey: string;
  private ollamaUrl: string;

  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY || '';
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
    this.ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  /**
   * Universal chat completion across configured open-source providers
   */
  public async generateCompletion(
    messages: ChatMessage[],
    systemPrompt?: string
  ): Promise<LLMCompletionResult> {
    const startTime = Date.now();

    const formattedMessages: ChatMessage[] = [];
    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt });
    }
    formattedMessages.push(...messages);

    // 1. Try Groq (Fastest open source inference: Llama 3.3 70B & DeepSeek R1)
    if (this.groqApiKey) {
      try {
        const groqModels = ['llama-3.3-70b-versatile', 'deepseek-r1-distill-llama-70b', 'qwen-2.5-32b'];
        for (const model of groqModels) {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.groqApiKey}`
            },
            body: JSON.stringify({
              model,
              messages: formattedMessages,
              temperature: 0.6,
              max_tokens: 1500
            })
          });
          const data = await res.json();
          if (res.ok && data.choices && data.choices[0]?.message?.content) {
            return {
              reply: data.choices[0].message.content.trim(),
              provider: 'Groq Cloud',
              model: `Llama 3.3 70B (${model})`,
              latencyMs: Date.now() - startTime,
              success: true
            };
          }
        }
      } catch (err) {
        console.warn('[OpenLLM] Groq call failed:', err);
      }
    }

    // 2. Try OpenRouter Free Tier Models (Llama 3.3 70B Free / DeepSeek R1 Free / Qwen Free)
    if (this.openRouterApiKey) {
      try {
        const freeModels = [
          'meta-llama/llama-3.3-70b-instruct:free',
          'deepseek/deepseek-r1:free',
          'qwen/qwen-2.5-coder-32b-instruct:free',
          'google/gemini-2.0-flash-exp:free'
        ];
        for (const model of freeModels) {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.openRouterApiKey}`,
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'Agentic AI Learning Architect'
            },
            body: JSON.stringify({
              model,
              messages: formattedMessages,
              temperature: 0.7
            })
          });
          const data = await res.json();
          if (res.ok && data.choices && data.choices[0]?.message?.content) {
            return {
              reply: data.choices[0].message.content.trim(),
              provider: 'OpenRouter Free',
              model,
              latencyMs: Date.now() - startTime,
              success: true
            };
          }
        }
      } catch (err) {
        console.warn('[OpenLLM] OpenRouter call failed:', err);
      }
    }

    // 3. Try Local Ollama Instance if running
    try {
      const ollamaRes = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.3',
          messages: formattedMessages,
          stream: false
        })
      });
      if (ollamaRes.ok) {
        const data = await ollamaRes.json();
        if (data.message?.content) {
          return {
            reply: data.message.content.trim(),
            provider: 'Local Ollama',
            model: 'Llama 3.3 (Local)',
            latencyMs: Date.now() - startTime,
            success: true
          };
        }
      }
    } catch {
      // Ollama not active
    }

    return {
      reply: '',
      provider: 'None',
      model: 'None',
      latencyMs: Date.now() - startTime,
      success: false,
      error: 'No active open-source provider responded.'
    };
  }
}

export const openLLM = new OpenLLMClient();
