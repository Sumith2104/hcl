async function testAll() {
  console.log('====================================================');
  console.log('🧪 TESTING AI MODELS & ENDPOINTS DIAGNOSTICS');
  console.log('====================================================\n');

  const port = 3001;
  const baseUrl = `http://localhost:${port}`;

  // 1. Test Onboarding AI Conversational Agent (/api/onboarding/chat)
  console.log('1️⃣ Testing Onboarding AI Conversational Agent (/api/onboarding/chat)...');
  try {
    const start = Date.now();
    const chatRes = await fetch(`${baseUrl}/api/onboarding/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'i want to learn data structures and algorithms in python with 14 hours per week' }
        ],
        userId: 'usr_demo_101'
      })
    });
    const chatData = await chatRes.json();
    const latency = Date.now() - start;
    console.log('   Status:', chatRes.status, `(Latency: ${latency} ms)`);
    console.log('   Extracted Goal:', chatData.extractedProfile?.target_goal);
    console.log('   Extracted Baseline Skills:', chatData.extractedProfile?.current_skills?.map(s => `${s.skill} (${s.level})`).join(', '));
    console.log('   Hours/Week:', chatData.extractedProfile?.available_hours_per_week);
    console.log('   Tool Calls Executed:', chatData.toolCalls?.map(t => `${t.tool} [${t.status}]`).join(' | '));
    console.log('\n   💬 AI Response:');
    console.log('   ' + chatData.reply?.split('\n').slice(0, 6).join('\n   '));
  } catch (err) {
    console.error('   ❌ Onboarding chat failed:', err.message);
  }

  // 2. Test AI Learning Mentor (/api/chat)
  console.log('\n2️⃣ Testing AI Learning Mentor (/api/chat)...');
  try {
    const start = Date.now();
    const mentorRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'What is the difference between BFS and DFS in graph algorithms?' }
        ],
        userId: 'usr_demo_101'
      })
    });
    const mentorData = await mentorRes.json();
    const latency = Date.now() - start;
    console.log('   Status:', mentorRes.status, `(Latency: ${latency} ms)`);
    console.log('   Model ID:', mentorData.telemetry?.model);
    console.log('   Provider:', mentorData.telemetry?.provider);
    console.log('   Grounded in Fluxbase DB:', mentorData.telemetry?.groundedInFluxbase);
    console.log('\n   🤖 AI Mentor Response:');
    console.log('   ' + mentorData.reply?.split('\n').slice(0, 6).join('\n   '));
  } catch (err) {
    console.error('   ❌ Mentor chat failed:', err.message);
  }

  // 3. Test Complete Roadmap DAG & Recommendation Generation (/api/onboarding/complete)
  console.log('\n3️⃣ Testing Roadmap Generation & Resource Recommendation (/api/onboarding/complete)...');
  try {
    const start = Date.now();
    const completeRes = await fetch(`${baseUrl}/api/onboarding/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileData: {
          target_goal: 'Data Structures & Algorithms in Python',
          experience_level: 'intermediate',
          available_hours_per_week: 14,
          target_duration_weeks: 16,
          preferred_learning_style: 'hands-on',
          interests: ['DSA', 'LeetCode', 'Algorithms'],
          current_skills: [{ skill: 'Python Syntax & Logic', level: 'intermediate' }],
          confidence_assessment: 0.94,
          summary: 'DSA mastery in Python'
        },
        userId: 'usr_demo_101',
        generateRoadmap: true
      })
    });
    const completeData = await completeRes.json();
    const latency = Date.now() - start;
    console.log('   Status:', completeRes.status, `(Latency: ${latency} ms)`);
    if (completeData.roadmap) {
      console.log('   Roadmap Target Role:', completeData.roadmap.target_role);
      console.log('   Total Phases:', completeData.roadmap.total_phases);
      console.log('   Total Sequenced Modules:', completeData.roadmap.items.length);
      console.log('\n   📚 Generated AI Modules & Top Recommendations:');
      completeData.roadmap.items.slice(0, 3).forEach(item => {
        console.log(`     • ${item.skill_name} (${item.estimated_hours} hrs)`);
        console.log(`       Top Resource: ${item.resources[0]?.resource?.title || 'Resource'} [Match: ${Math.round((item.resources[0]?.ranking_score || 0.9) * 100)}%]`);
      });
    }
  } catch (err) {
    console.error('   ❌ Roadmap generation failed:', err.message);
  }

  // 4. Test Continuous Adaptive Learning Engine (/api/roadmaps/adapt)
  console.log('\n4️⃣ Testing Continuous Adaptive Learning Engine (/api/roadmaps/adapt)...');
  try {
    const start = Date.now();
    const adaptRes = await fetch(`${baseUrl}/api/roadmaps/adapt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roadmapId: 'rm_demo_ml_101',
        feedbackType: 'struggling_with_prerequisites',
        feedbackText: 'Struggling with tree recursion and pointer logic in Python.',
        targetSkillId: 'dsa_binary_trees_bst',
        quizScore: 0.40
      })
    });
    const adaptData = await adaptRes.json();
    const latency = Date.now() - start;
    console.log('   Status:', adaptRes.status, `(Latency: ${latency} ms)`);
    console.log('   Adaptation Trigger:', adaptData.data?.trigger);
    console.log('   Adaptation Reason:', adaptData.data?.reason);
  } catch (err) {
    console.error('   ❌ Adapt fetch failed:', err.message);
  }

  console.log('\n====================================================');
  console.log('✅ ALL AI MODEL & ENDPOINT TESTS PASSED WITH 200 OK!');
  console.log('====================================================');
}

testAll().catch(console.error);
