import crypto from 'crypto';

export interface GLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GLMResponse {
  reply: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  latencyMs: number;
  success: boolean;
  error?: string;
}

class GLMClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.GLM_API_KEY || '6075a7ea22f945469fd133198524d326.D9dUZXCcKgCDJ0Vq';
    this.model = process.env.GLM_MODEL || 'glm-5.3';
    this.baseUrl = process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
  }

  /**
   * Generates a signed JWT authentication token for Zhipu AI BigModel PaaS
   */
  private generateJWT(expSeconds: number = 3600): string {
    try {
      if (!this.apiKey || !this.apiKey.includes('.')) {
        return this.apiKey;
      }
      const [id, secret] = this.apiKey.split('.');
      const now = Date.now();
      const header = { alg: 'HS256', sign_type: 'SIGN' };
      const payload = {
        api_key: id,
        exp: now + expSeconds * 1000,
        timestamp: now
      };

      const base64Url = (obj: any) =>
        Buffer.from(JSON.stringify(obj))
          .toString('base64')
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_');

      const tokenHeader = base64Url(header);
      const tokenPayload = base64Url(payload);
      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${tokenHeader}.${tokenPayload}`)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      return `${tokenHeader}.${tokenPayload}.${signature}`;
    } catch {
      return this.apiKey;
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  public getModelName(): string {
    return this.model;
  }

  /**
   * Invoke GLM models for natural conversational reasoning with agentic fallback
   */
  public async invokeChat(
    messages: GLMMessage[],
    systemPrompt?: string,
    temperature: number = 0.7
  ): Promise<GLMResponse> {
    const startTime = Date.now();
    const token = this.generateJWT();

    const formattedMessages: GLMMessage[] = [];
    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt });
    }
    formattedMessages.push(...messages);

    // Agentic Model Priority: Flagship reasoning -> Turbo agentic -> Air lightweight -> Base
    const modelsToTry = [
      this.model,          // glm-5.3 (flagship reasoning)
      'glm-5-turbo',       // glm-5-turbo (fast agentic tool execution)
      'glm-4.5-air',       // glm-4.5-air (cost-efficient agentic)
      'glm-5',             // glm-5
      'glm-4.5'            // glm-4.5
    ];

    let lastError = '';

    for (const modelName of modelsToTry) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: formattedMessages,
            temperature,
            top_p: 0.9,
            stream: false
          })
        });

        const data = await response.json();
        const latencyMs = Date.now() - startTime;

        if (response.ok && data.choices && data.choices[0]?.message?.content) {
          return {
            reply: data.choices[0].message.content.trim(),
            model: modelName,
            usage: data.usage,
            latencyMs,
            success: true
          };
        }

        if (data.error) {
          lastError = data.error.message || `Code ${data.error.code}`;
          if (data.error.code === '1113') {
            // Quota exhausted on account
            continue;
          }
        }
      } catch (err) {
        lastError = (err as Error).message;
      }
    }

    return {
      reply: '',
      model: this.model,
      latencyMs: Date.now() - startTime,
      success: false,
      error: `GLM_QUOTA_EXHAUSTED: Account balance is 0 on open.bigmodel.cn (Code 1113: ${lastError || '余额不足'}). Please top up credits on the Zhipu BigModel platform to activate live streaming.`
    };
  }
}

export const glm = new GLMClient();
