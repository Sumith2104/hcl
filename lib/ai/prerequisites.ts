import { fluxbase } from '../db/fluxbase';
import { SkillGapItem } from './skill_gap';

export interface OrderedPhase {
  phaseNumber: number;
  phaseTitle: string;
  skills: SkillGapItem[];
  estimatedHours: number;
  milestone: string;
  milestoneProject: string;
}

export class PrerequisiteOrderingEngine {
  public async orderAndPhaseSkills(
    skillGaps: SkillGapItem[],
    availableHoursPerWeek: number = 14,
    targetDurationWeeks: number = 16
  ): Promise<OrderedPhase[]> {
    const allPrereqs = await fluxbase.getPrerequisites();
    const allSkills = await fluxbase.getAllSkills();
    const skillMap = new Map(allSkills.map(s => [s.id, s]));

    // Step 1: Expand prerequisite closure if any prerequisite is completely missing
    const neededSkillIds = new Set<string>(skillGaps.map(g => g.skillId));
    const skillItemMap = new Map<string, SkillGapItem>(skillGaps.map(g => [g.skillId, g]));

    let addedNew = true;
    while (addedNew) {
      addedNew = false;
      for (const skillId of Array.from(neededSkillIds)) {
        const directPrereqs = allPrereqs.filter(p => p.skill_id === skillId && p.importance === 'critical');
        for (const p of directPrereqs) {
          if (!neededSkillIds.has(p.prerequisite_skill_id)) {
            neededSkillIds.add(p.prerequisite_skill_id);
            const skill = skillMap.get(p.prerequisite_skill_id);
            if (skill) {
              skillItemMap.set(p.prerequisite_skill_id, {
                skillId: skill.id,
                skillName: skill.name,
                category: skill.category,
                currentLevel: 'none',
                requiredLevel: 'intermediate',
                gapType: 'missing',
                importance: 'must_have',
                sequenceWeight: 0
              });
              addedNew = true;
            }
          }
        }
      }
    }

    // Step 2: Build Adjacency List and In-Degree Map for Topological Sort
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    for (const skillId of neededSkillIds) {
      graph.set(skillId, []);
      inDegree.set(skillId, 0);
    }

    for (const p of allPrereqs) {
      if (neededSkillIds.has(p.skill_id) && neededSkillIds.has(p.prerequisite_skill_id)) {
        // Edge goes from prerequisite -> dependent skill
        graph.get(p.prerequisite_skill_id)!.push(p.skill_id);
        inDegree.set(p.skill_id, (inDegree.get(p.skill_id) || 0) + 1);
      }
    }

    // Step 3: Kahn's Algorithm (Topological Sort with Cycle Detection)
    const queue: string[] = [];
    inDegree.forEach((deg, id) => {
      if (deg === 0) queue.push(id);
    });

    const orderedIds: string[] = [];
    while (queue.length > 0) {
      // Prioritize foundational categories
      queue.sort((a, b) => {
        const itemA = skillItemMap.get(a);
        const itemB = skillItemMap.get(b);
        const catWeight = { math_theory: 1, programming: 2, systems_data: 3, ai_ml: 4, engineering_devops: 5, security: 6 };
        const wA = itemA ? catWeight[itemA.category] || 9 : 9;
        const wB = itemB ? catWeight[itemB.category] || 9 : 9;
        return wA - wB;
      });

      const current = queue.shift()!;
      orderedIds.push(current);

      for (const neighbor of graph.get(current) || []) {
        inDegree.set(neighbor, (inDegree.get(neighbor) || 1) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    // If there were cycles, append remaining skills gracefully
    if (orderedIds.length < neededSkillIds.size) {
      for (const id of neededSkillIds) {
        if (!orderedIds.includes(id)) {
          orderedIds.push(id);
        }
      }
    }

    const orderedItems: SkillGapItem[] = orderedIds
      .map(id => skillItemMap.get(id))
      .filter((item): item is SkillGapItem => Boolean(item));

    // Step 4: Chunk into Structured Learning Phases
    const phases: OrderedPhase[] = [];
    const totalSkills = orderedItems.length;

    if (totalSkills <= 3) {
      phases.push({
        phaseNumber: 1,
        phaseTitle: 'Foundations & Core Implementation',
        skills: orderedItems,
        estimatedHours: Math.min(40, totalSkills * 12),
        milestone: 'Complete end-to-end hands-on exercises for all core skills.',
        milestoneProject: 'Portfolio implementation with verifiable unit tests.'
      });
    } else {
      const itemsPerPhase = Math.ceil(totalSkills / 3);
      const p1Items = orderedItems.slice(0, itemsPerPhase);
      const p2Items = orderedItems.slice(itemsPerPhase, itemsPerPhase * 2);
      const p3Items = orderedItems.slice(itemsPerPhase * 2);

      phases.push({
        phaseNumber: 1,
        phaseTitle: 'Phase 1: Foundations & Prerequisites',
        skills: p1Items,
        estimatedHours: p1Items.length * 14,
        milestone: 'Master mathematical & programming prerequisites with benchmark exercises.',
        milestoneProject: 'Foundational algorithmic pipeline with test coverage.'
      });

      phases.push({
        phaseNumber: 2,
        phaseTitle: 'Phase 2: Core Engineering & Architecture',
        skills: p2Items,
        estimatedHours: p2Items.length * 16,
        milestone: 'Build end-to-end models and interactive system components.',
        milestoneProject: 'Production-ready model service with REST API and vector indexing.'
      });

      if (p3Items.length > 0) {
        phases.push({
          phaseNumber: 3,
          phaseTitle: 'Phase 3: Production Specialization & Capstone',
          skills: p3Items,
          estimatedHours: p3Items.length * 18,
          milestone: 'Deploy automated evaluation and production cloud infrastructure.',
          milestoneProject: 'Full-stack AI SaaS deployed with AWS Bedrock, CI/CD, and Observability.'
        });
      }
    }

    return phases;
  }
}

export const prerequisiteEngine = new PrerequisiteOrderingEngine();
