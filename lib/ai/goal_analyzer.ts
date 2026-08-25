import { bedrock } from '../aws/bedrock';
import { costGuard } from './cost_guard';
import { fluxbase } from '../db/fluxbase';
import { LearnerProfile, ExperienceLevel, LearningStyle } from '../db/schema';
import { EXTRACTION_BEDROCK_MODEL } from '../aws/models';

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
  "target_goal": "String, target career role (e.g. AI Engineer, Machine Learning Engineer, Full Stack Developer, Data Scientist, etc.)",
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

    const response = await bedrock.invokeJSON<ExtractedProfileData>(prompt, {
      modelId: EXTRACTION_BEDROCK_MODEL,
      temperature: 0.1,
      userId
    });

    await costGuard.logUsage({
      userId,
      endpoint: 'onboarding/extract-profile',
      model: response.modelId,
      provider: response.provider,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      estimatedCostUsd: response.costUsd,
      latencyMs: response.latencyMs
    });

    return response.result;
  }

  public async mapToLearnerProfile(
    extracted: ExtractedProfileData,
    userId: string
  ): Promise<LearnerProfile> {
    const profile: LearnerProfile = {
      id: `prof_${Date.now()}`,
      user_id: userId,
      target_goal: extracted.target_goal,
      experience_level: extracted.experience_level,
      available_hours_per_week: extracted.available_hours_per_week || 14,
      preferred_learning_style: extracted.preferred_learning_style || 'hands-on',
      interests: extracted.interests || ['AI', 'Engineering'],
      target_duration_weeks: extracted.target_duration_weeks || 16,
      current_skills_raw: extracted.current_skills.map(s => `${s.skill} (${s.level})`),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await fluxbase.saveProfile(profile);
    return profile;
  }
}

export const goalAnalyzer = new GoalAnalyzer();
