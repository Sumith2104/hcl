export interface GeminiResponse {
  reply: string;
  model: string;
  latencyMs: number;
  success: boolean;
  error?: string;
}

class GeminiClient {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  public async generateContent(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    systemInstruction?: string
  ): Promise<GeminiResponse> {
    const startTime = Date.now();
    if (!this.isConfigured()) {
      return {
        reply: '',
        model: 'gemini-2.0-flash',
        latencyMs: 0,
        success: false,
        error: 'GEMINI_API_KEY not configured'
      };
    }

    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        const body: any = { contents };

        if (systemInstruction) {
          body.systemInstruction = {
            parts: [{ text: systemInstruction }]
          };
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();
        const latencyMs = Date.now() - startTime;

        if (res.ok && data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          return {
            reply: data.candidates[0].content.parts[0].text.trim(),
            model,
            latencyMs,
            success: true
          };
        }

        if (data.error) {
          console.warn(`[Gemini] Model ${model} returned:`, data.error);
        }
      } catch (err) {
        console.warn(`[Gemini] Request failed for ${model}:`, err);
      }
    }

    return {
      reply: '',
      model: 'gemini-2.0-flash',
      latencyMs: Date.now() - startTime,
      success: false,
      error: 'Gemini API call failed'
    };
  }
}

export const gemini = new GeminiClient();
