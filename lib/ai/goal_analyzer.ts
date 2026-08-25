import { bedrock } from '../aws/bedrock';
import { costGuard } from './cost_guard';
import { fluxbase } from '../db/fluxbase';
import { LearnerProfile, ExperienceLevel, LearningStyle } from '../db/schema';
import { EXTRACTION_BEDROCK_MODEL } from '../aws/models';
import { agenticEngine } from './agent_executor';

export interface ExtractedProfileData {
  target_goal: string;
  experience_level: ExperienceLevel;
  available_hours_per_week: number;
  target_duration_weeks: number;
  preferred_learning_style: LearningStyle;
  interests: string[];
  current_skills: Array<{
    skill: string;
    level: ExperienceLevel;
  }>;
  confidence_assessment: number;
  summary: string;
}

export class GoalAnalyzer {
  public async analyzeConversation(
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    userId: string = 'usr_demo_101'
  ): Promise<ExtractedProfileData> {
    await costGuard.checkBudget(userId);

    // If live AWS credentials available, invoke AWS Bedrock with JSON schema
    if (bedrock.isLiveConfigured()) {
      const formattedTranscript = conversationHistory
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n');

      const prompt = `You are the Learner Profiling Engine of an AI-powered Personalized Learning Platform.
Analyze the following onboarding conversation transcript between a learner and the AI assistant:

--- CONVERSATION TRANSCRIPT ---
${formattedTranscript}
--- END TRANSCRIPT ---

Extract the learner's profile strictly according to this JSON structure:
{
  "target_goal": "String, target career role (e.g. Machine Learning Engineer, AI Engineer, Full Stack Developer, Data Scientist, etc.)",
  "experience_level": "beginner | intermediate | advanced | expert",
  "available_hours_per_week": number (e.g. 10 to 25),
  "target_duration_weeks": number (e.g. 8 to 24),
  "preferred_learning_style": "hands-on | visual | reading | structured",
  "interests": ["list of string interests or technologies"],
  "current_skills": [
    { "skill": "canonical skill name", "level": "beginner | intermediate | advanced | expert" }
  ],
  "confidence_assessment": number between 0.5 and 1.0,
  "summary": "Brief 1-2 sentence profile summary"
}`;

      try {
        const response = await bedrock.invokeJSON<ExtractedProfileData>(prompt, {
          modelId: EXTRACTION_BEDROCK_MODEL,
          temperature: 0.1,
          userId
        });

        await costGuard.logUsage({
          userId,
          endpoint: 'onboarding/extract',
          model: response.modelId,
          provider: response.provider,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          estimatedCostUsd: response.costUsd,
          latencyMs: response.latencyMs
        });

        return response.result;
      } catch (err) {
        console.warn('Bedrock extraction failed, executing Agentic Engine fallback:', (err as Error).message);
      }
    }

    // Agentic Engine with live Fluxbase database queries
    const agenticRes = await agenticEngine.executeOnboardingAgent(conversationHistory, userId);
    return agenticRes.extractedProfile;
  }

  public toLearnerProfile(
    userId: string,
    extractedData: ExtractedProfileData
  ): LearnerProfile {
    const rawSkills = extractedData.current_skills.map(
      s => `${s.skill} (${s.level})`
    );

    return {
      id: `prof_${userId}`,
      user_id: userId,
      target_goal: extractedData.target_goal,
      experience_level: extractedData.experience_level,
      available_hours_per_week: extractedData.available_hours_per_week,
      preferred_learning_style: extractedData.preferred_learning_style,
      interests: extractedData.interests,
      target_duration_weeks: extractedData.target_duration_weeks,
      current_skills_raw: rawSkills,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

export const goalAnalyzer = new GoalAnalyzer();
