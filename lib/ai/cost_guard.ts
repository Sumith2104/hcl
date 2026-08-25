import { fluxbase } from '../db/fluxbase';

export class BudgetExceededError extends Error {
  constructor(userId: string, currentSpend: number, limit: number) {
    super(`Monthly LLM spend of $${currentSpend.toFixed(3)} exceeded allowed budget ceiling of $${limit.toFixed(2)} for user ${userId}.`);
    this.name = 'BudgetExceededError';
  }
}

export class CostGuard {
  private monthlyBudgetUsd: number;

  constructor(monthlyBudgetUsd: number = 10.00) {
    this.monthlyBudgetUsd = monthlyBudgetUsd;
  }

  public async checkBudget(userId: string): Promise<void> {
    const { totalUsd } = await fluxbase.getMonthlySpend(userId);
    if (totalUsd >= this.monthlyBudgetUsd) {
      throw new BudgetExceededError(userId, totalUsd, this.monthlyBudgetUsd);
    }
  }

  public async logUsage(params: {
    userId: string;
    endpoint: string;
    model: string;
    provider: 'aws_bedrock' | 'simulated_bedrock';
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
    latencyMs: number;
  }) {
    return await fluxbase.logLLMUsage({
      user_id: params.userId,
      endpoint: params.endpoint,
      model: params.model,
      provider: params.provider,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      estimated_cost_usd: params.estimatedCostUsd,
      latency_ms: params.latencyMs
    });
  }

  public getBudgetLimit(): number {
    return this.monthlyBudgetUsd;
  }
}

export const costGuard = new CostGuard(10.00);
