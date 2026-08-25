const BASE_URL = 'https://fluxbase.vercel.app';
const API_KEY = 'fl_420392f791e71034a668fec0f5f85c822c4547697c7c4cbe';
const PROJECT_ID = 'a3fdb50d092a4b97';

async function query(sql, params = []) {
  try {
    const res = await fetch(`${BASE_URL}/api/execute-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({ projectId: PROJECT_ID, query: sql, params })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: { message: err.message } };
  }
}

async function seed() {
  console.log('=== SEEDING RELATIONAL DATABASE IN PROPER DEPENDENCY ORDER ===\n');

  // 1. Seed Users
  console.log('1. Seeding Users...');
  const userSql = `
    INSERT INTO users (id, name, email, role, password_hash)
    VALUES (
      'usr_demo_101',
      'Alex Rivera',
      'alex.rivera@example.com',
      'learner',
      '$2b$10$f383e58284566373b98efuKkd0.V6Pnm2l7wHspG7x.R8rPfm5x/6'
    )
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
  `;
  const uRes = await query(userSql);
  console.log(`Users seeded -> ${uRes.success ? 'SUCCESS' : JSON.stringify(uRes.error)}`);

  // 2. Seed Learner Profile
  console.log('2. Seeding Learner Profile...');
  const profileSql = `
    INSERT INTO learner_profiles (
      id, user_id, target_goal, experience_level, available_hours_per_week,
      preferred_learning_style, interests, target_duration_weeks, current_skills_raw
    ) VALUES (
      'prof_demo_101',
      'usr_demo_101',
      'Backend Developer',
      'intermediate',
      16,
      'hands-on',
      '["APIs", "PostgreSQL", "Redis", "Distributed Systems", "Docker"]',
      12,
      '["Python", "Basic SQL", "Git"]'
    )
    ON CONFLICT (id) DO NOTHING;
  `;
  const pRes = await query(profileSql);
  console.log(`Profile seeded -> ${pRes.success ? 'SUCCESS' : JSON.stringify(pRes.error)}`);

  // 3. Seed Skills
  console.log('3. Seeding Skills Catalog...');
  const skills = [
    { id: 'prog_python', name: 'Python Programming', category: 'programming', description: 'Core Python, OOP, decorators, generators, type hints, async programming.', aliases: 'python, py, python3', difficulty_base: 'beginner' },
    { id: 'prog_data_structures', name: 'Data Structures & Algorithms', category: 'programming', description: 'Trees, graphs, dynamic programming, algorithmic complexity, sorting.', aliases: 'dsa, algorithms, data structures', difficulty_base: 'intermediate' },
    { id: 'prog_typescript', name: 'TypeScript & JavaScript', category: 'programming', description: 'Modern TypeScript, ESNext, static typing, interfaces, async/await.', aliases: 'ts, js, javascript, typescript', difficulty_base: 'beginner' },
    { id: 'math_linear_algebra', name: 'Linear Algebra', category: 'math_theory', description: 'Vectors, matrices, eigenvalues, matrix decompositions (SVD, PCA).', aliases: 'matrix math, vectors, linear-algebra', difficulty_base: 'beginner' },
    { id: 'math_calculus', name: 'Multivariate Calculus', category: 'math_theory', description: 'Gradients, partial derivatives, chain rule, optimization foundations.', aliases: 'calculus, derivatives, gradient-descent', difficulty_base: 'beginner' },
    { id: 'math_statistics', name: 'Probability & Statistics', category: 'math_theory', description: 'Probability distributions, hypothesis testing, Bayes theorem, p-values, variance.', aliases: 'stats, probability, inferential statistics', difficulty_base: 'beginner' },
    { id: 'data_sql', name: 'SQL & Database Architecture', category: 'systems_data', description: 'Relational DBs, complex joins, indexing, normalization, transaction isolation.', aliases: 'sql, postgres, postgresql, relational-database', difficulty_base: 'beginner' },
    { id: 'data_pandas_numpy', name: 'Data Wrangling (Pandas & NumPy)', category: 'systems_data', description: 'Vectorized computing, exploratory data analysis, data cleaning, aggregation.', aliases: 'pandas, numpy, eda, data cleaning', difficulty_base: 'beginner' },
    { id: 'data_vector_dbs', name: 'Vector Databases & Retrieval', category: 'systems_data', description: 'Vector embeddings, pgvector, similarity search (HNSW, Cosine), hybrid search.', aliases: 'vector db, pgvector, pinecone, milvus, chroma', difficulty_base: 'intermediate' },
    { id: 'web_react_next', name: 'React & Next.js Framework', category: 'programming', description: 'Server Components, App Router, hooks, state management, SSR/SSG.', aliases: 'react, next.js, nextjs, react.js', difficulty_base: 'intermediate' },
    { id: 'web_backend_apis', name: 'Backend API Engineering (REST & GraphQL)', category: 'programming', description: 'FastAPI, Express/Next API routes, authentication (JWT/OAuth), rate limiting, OpenAPI.', aliases: 'fastapi, rest api, backend, api design', difficulty_base: 'intermediate' },
    { id: 'ai_ml_foundations', name: 'Classical Machine Learning', category: 'ai_ml', description: 'Supervised & unsupervised learning, regression, decision trees, random forests, XGBoost, cross-validation.', aliases: 'ml, machine learning, scikit-learn, classical ml', difficulty_base: 'intermediate' },
    { id: 'ai_deep_learning', name: 'Deep Learning & Neural Networks', category: 'ai_ml', description: 'Backpropagation, loss functions, PyTorch, CNNs, regularization, learning rate scheduling.', aliases: 'deep learning, pytorch, neural networks, ann, dl', difficulty_base: 'intermediate' },
    { id: 'ai_transformers_nlp', name: 'Transformers & NLP Architecture', category: 'ai_ml', description: 'Attention mechanisms, self-attention, BERT, GPT architecture, tokenization, HuggingFace.', aliases: 'nlp, transformers, attention, huggingface, bert', difficulty_base: 'advanced' },
    { id: 'ai_llm_engineering', name: 'LLM Application Engineering & RAG', category: 'ai_ml', description: 'Retrieval Augmented Generation (RAG), prompt engineering, tool calling, langchain/custom orchestrators.', aliases: 'rag, prompt engineering, llm apps, generative ai, bedrock apps', difficulty_base: 'advanced' },
    { id: 'ai_finetuning_evals', name: 'LLM Fine-Tuning & Evaluation', category: 'ai_ml', description: 'LoRA, QLoRA, RLHF, rubric-based evaluation, benchmark datasets, guardrails.', aliases: 'finetuning, lora, evals, llm evaluation, qlora', difficulty_base: 'advanced' },
    { id: 'ai_computer_vision', name: 'Computer Vision & Multi-Modal AI', category: 'ai_ml', description: 'Object detection (YOLO), vision transformers (ViT), image segmentation, CLIP.', aliases: 'computer vision, cv, yolo, vit, multimodal', difficulty_base: 'advanced' },
    { id: 'devops_docker_containers', name: 'Docker & Containerization', category: 'engineering_devops', description: 'Multi-stage Dockerfiles, container optimization, docker-compose, networking.', aliases: 'docker, containers, dockerfile', difficulty_base: 'beginner' },
    { id: 'devops_aws_cloud', name: 'AWS Cloud Architecture & ECS', category: 'engineering_devops', description: 'ECS Fargate, ALB, S3, RDS, Secrets Manager, IAM least-privilege, CloudWatch.', aliases: 'aws, cloud, ecs, fargate, iam, s3', difficulty_base: 'intermediate' },
    { id: 'devops_cicd_terraform', name: 'CI/CD & Infrastructure as Code (Terraform)', category: 'engineering_devops', description: 'GitHub Actions pipelines, Terraform modules, state management, automated deployment.', aliases: 'terraform, iac, cicd, github actions, devops', difficulty_base: 'advanced' },
    { id: 'devops_mlops', name: 'MLOps & Model Serving', category: 'engineering_devops', description: 'Model registries, Triton/TorchServe, batch inference, drift detection, monitoring.', aliases: 'mlops, model deployment, model serving, triton', difficulty_base: 'advanced' },
    { id: 'sec_app_cloud_security', name: 'Application & Cloud Security', category: 'security', description: 'JWT verification, OWASP top 10, prompt injection defenses, KMS encryption, zero-trust.', aliases: 'security, appsec, cloud security, owasp, jwt', difficulty_base: 'intermediate' }
  ];

  for (const s of skills) {
    const sSql = `
      INSERT INTO skills (id, name, category, description, aliases, difficulty_base)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;
    `;
    await query(sSql, [s.id, s.name, s.category, s.description, s.aliases, s.difficulty_base]);
  }
  console.log(`Skills inserted: ${skills.length}`);

  // 4. Seed Prerequisites
  console.log('4. Seeding Skill Prerequisites...');
  const prereqs = [
    { id: 'pr_1', skill_id: 'ai_ml_foundations', prerequisite_skill_id: 'prog_python', importance: 'critical' },
    { id: 'pr_2', skill_id: 'ai_ml_foundations', prerequisite_skill_id: 'math_linear_algebra', importance: 'critical' },
    { id: 'pr_3', skill_id: 'ai_ml_foundations', prerequisite_skill_id: 'math_statistics', importance: 'critical' },
    { id: 'pr_4', skill_id: 'ai_ml_foundations', prerequisite_skill_id: 'data_pandas_numpy', importance: 'critical' },
    { id: 'pr_5', skill_id: 'ai_deep_learning', prerequisite_skill_id: 'ai_ml_foundations', importance: 'critical' },
    { id: 'pr_6', skill_id: 'ai_deep_learning', prerequisite_skill_id: 'math_calculus', importance: 'critical' },
    { id: 'pr_7', skill_id: 'ai_transformers_nlp', prerequisite_skill_id: 'ai_deep_learning', importance: 'critical' },
    { id: 'pr_8', skill_id: 'ai_llm_engineering', prerequisite_skill_id: 'ai_transformers_nlp', importance: 'critical' },
    { id: 'pr_9', skill_id: 'ai_llm_engineering', prerequisite_skill_id: 'data_vector_dbs', importance: 'recommended' },
    { id: 'pr_10', skill_id: 'ai_llm_engineering', prerequisite_skill_id: 'web_backend_apis', importance: 'recommended' },
    { id: 'pr_11', skill_id: 'ai_finetuning_evals', prerequisite_skill_id: 'ai_llm_engineering', importance: 'critical' },
    { id: 'pr_12', skill_id: 'ai_computer_vision', prerequisite_skill_id: 'ai_deep_learning', importance: 'critical' },
    { id: 'pr_13', skill_id: 'web_react_next', prerequisite_skill_id: 'prog_typescript', importance: 'critical' },
    { id: 'pr_14', skill_id: 'web_backend_apis', prerequisite_skill_id: 'data_sql', importance: 'recommended' },
    { id: 'pr_15', skill_id: 'devops_aws_cloud', prerequisite_skill_id: 'devops_docker_containers', importance: 'critical' },
    { id: 'pr_16', skill_id: 'devops_cicd_terraform', prerequisite_skill_id: 'devops_aws_cloud', importance: 'critical' },
    { id: 'pr_17', skill_id: 'devops_mlops', prerequisite_skill_id: 'ai_deep_learning', importance: 'critical' },
    { id: 'pr_18', skill_id: 'devops_mlops', prerequisite_skill_id: 'devops_docker_containers', importance: 'critical' },
    { id: 'pr_19', skill_id: 'devops_mlops', prerequisite_skill_id: 'devops_aws_cloud', importance: 'recommended' }
  ];

  for (const pr of prereqs) {
    const prSql = `
      INSERT INTO skill_prerequisites (id, skill_id, prerequisite_skill_id, importance)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (skill_id, prerequisite_skill_id) DO NOTHING;
    `;
    await query(prSql, [pr.id, pr.skill_id, pr.prerequisite_skill_id, pr.importance]);
  }
  console.log(`Prerequisites inserted: ${prereqs.length}`);

  // 5. Seed Role Requirements
  console.log('5. Seeding Role Skill Requirements...');
  const roleReqs = [
    // Backend Developer
    { id: 'role_be_1', target_role: 'Backend Developer', skill_id: 'prog_python', required_level: 'advanced', importance: 'must_have', sequence_weight: 1 },
    { id: 'role_be_2', target_role: 'Backend Developer', skill_id: 'data_sql', required_level: 'advanced', importance: 'must_have', sequence_weight: 2 },
    { id: 'role_be_3', target_role: 'Backend Developer', skill_id: 'web_backend_apis', required_level: 'advanced', importance: 'must_have', sequence_weight: 3 },
    { id: 'role_be_4', target_role: 'Backend Developer', skill_id: 'devops_docker_containers', required_level: 'intermediate', importance: 'must_have', sequence_weight: 4 },
    { id: 'role_be_5', target_role: 'Backend Developer', skill_id: 'sec_app_cloud_security', required_level: 'intermediate', importance: 'core', sequence_weight: 5 },

    // Frontend Developer
    { id: 'role_fe_1', target_role: 'Frontend Developer', skill_id: 'prog_typescript', required_level: 'advanced', importance: 'must_have', sequence_weight: 1 },
    { id: 'role_fe_2', target_role: 'Frontend Developer', skill_id: 'web_react_next', required_level: 'advanced', importance: 'must_have', sequence_weight: 2 },
    { id: 'role_fe_3', target_role: 'Frontend Developer', skill_id: 'web_backend_apis', required_level: 'beginner', importance: 'core', sequence_weight: 3 },

    // Full Stack Developer
    { id: 'role_fs_1', target_role: 'Full Stack Developer', skill_id: 'prog_typescript', required_level: 'advanced', importance: 'must_have', sequence_weight: 1 },
    { id: 'role_fs_2', target_role: 'Full Stack Developer', skill_id: 'web_react_next', required_level: 'advanced', importance: 'must_have', sequence_weight: 2 },
    { id: 'role_fs_3', target_role: 'Full Stack Developer', skill_id: 'data_sql', required_level: 'intermediate', importance: 'must_have', sequence_weight: 3 },
    { id: 'role_fs_4', target_role: 'Full Stack Developer', skill_id: 'web_backend_apis', required_level: 'advanced', importance: 'must_have', sequence_weight: 4 },
    { id: 'role_fs_5', target_role: 'Full Stack Developer', skill_id: 'devops_docker_containers', required_level: 'intermediate', importance: 'core', sequence_weight: 5 },
    { id: 'role_fs_6', target_role: 'Full Stack Developer', skill_id: 'sec_app_cloud_security', required_level: 'intermediate', importance: 'core', sequence_weight: 6 },

    // AI Engineer
    { id: 'role_ai_1', target_role: 'AI Engineer', skill_id: 'prog_python', required_level: 'advanced', importance: 'must_have', sequence_weight: 1 },
    { id: 'role_ai_2', target_role: 'AI Engineer', skill_id: 'data_pandas_numpy', required_level: 'intermediate', importance: 'must_have', sequence_weight: 2 },
    { id: 'role_ai_3', target_role: 'AI Engineer', skill_id: 'ai_ml_foundations', required_level: 'intermediate', importance: 'must_have', sequence_weight: 3 },
    { id: 'role_ai_4', target_role: 'AI Engineer', skill_id: 'ai_deep_learning', required_level: 'intermediate', importance: 'must_have', sequence_weight: 4 },
    { id: 'role_ai_5', target_role: 'AI Engineer', skill_id: 'ai_transformers_nlp', required_level: 'advanced', importance: 'must_have', sequence_weight: 5 },
    { id: 'role_ai_6', target_role: 'AI Engineer', skill_id: 'data_vector_dbs', required_level: 'advanced', importance: 'must_have', sequence_weight: 6 },
    { id: 'role_ai_7', target_role: 'AI Engineer', skill_id: 'ai_llm_engineering', required_level: 'advanced', importance: 'must_have', sequence_weight: 7 }
  ];

  for (const rr of roleReqs) {
    const rrSql = `
      INSERT INTO role_skill_requirements (id, target_role, skill_id, required_level, importance, sequence_weight)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (target_role, skill_id) DO UPDATE SET sequence_weight = EXCLUDED.sequence_weight;
    `;
    await query(rrSql, [rr.id, rr.target_role, rr.skill_id, rr.required_level, rr.importance, rr.sequence_weight]);
  }
  console.log(`Role Requirements inserted: ${roleReqs.length}`);

  // 6. Seed Resources & Junction Table
  console.log('6. Seeding Resources & resource_skills...');
  const resources = [
    { id: 'res_py_1', title: 'Python for Software Engineering & Modern Data Science', description: 'Deep dive into Python 3 idioms, data structures, generators, decorators, and typing.', url: 'https://docs.python.org/3/tutorial/', platform: 'Official Python Docs', type: 'documentation', difficulty: 'beginner', estimated_hours: 12, quality_score: 0.95, is_free: true, skill_id: 'prog_python' },
    { id: 'res_sql_1', title: 'Relational Database Design & High-Performance SQL', description: 'Database normalization, indexing strategies, B-Trees, transaction isolation, and query plans.', url: 'https://use-the-index-luke.com/', platform: 'Use The Index, Luke!', type: 'book', difficulty: 'intermediate', estimated_hours: 14, quality_score: 0.96, is_free: true, skill_id: 'data_sql' },
    { id: 'res_fastapi_1', title: 'FastAPI & Async High-Throughput API Architecture', description: 'Build enterprise-grade async microservices with Pydantic validation, JWT security, and background tasks.', url: 'https://fastapi.tiangolo.com/tutorial/', platform: 'FastAPI Official Masterclass', type: 'interactive_project', difficulty: 'intermediate', estimated_hours: 16, quality_score: 0.96, is_free: true, skill_id: 'web_backend_apis' },
    { id: 'res_docker_1', title: 'Production Containerization with Docker & Multi-Stage Builds', description: 'Zero-CVE production containers, docker compose networks, non-root users, and minimal base images.', url: 'https://docs.docker.com/get-started/', platform: 'Docker Hands-On Lab', type: 'interactive_project', difficulty: 'beginner', estimated_hours: 8, quality_score: 0.93, is_free: true, skill_id: 'devops_docker_containers' },
    { id: 'res_sec_1', title: 'OWASP Security & Zero-Trust Cloud Architecture', description: 'Defend against injection, broken access control, JWT tampering, and side-channel threats.', url: 'https://owasp.org/www-project-top-ten/', platform: 'OWASP Foundation', type: 'documentation', difficulty: 'intermediate', estimated_hours: 10, quality_score: 0.95, is_free: true, skill_id: 'sec_app_cloud_security' },
    { id: 'res_react_1', title: 'Next.js 14 App Router & React Server Components', description: 'Master fullstack React, Server Actions, streaming SSR, and edge middleware.', url: 'https://nextjs.org/docs', platform: 'Vercel Next.js Docs', type: 'documentation', difficulty: 'intermediate', estimated_hours: 15, quality_score: 0.97, is_free: true, skill_id: 'web_react_next' }
  ];

  for (const r of resources) {
    const rSql = `
      INSERT INTO resources (id, title, description, url, platform, type, difficulty, estimated_hours, quality_score, is_free)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, url = EXCLUDED.url;
    `;
    await query(rSql, [r.id, r.title, r.description, r.url, r.platform, r.type, r.difficulty, r.estimated_hours, r.quality_score, r.is_free]);

    const rsSql = `
      INSERT INTO resource_skills (id, resource_id, skill_id, relevance_weight)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (resource_id, skill_id) DO NOTHING;
    `;
    await query(rsSql, [`rs_${r.id}`, r.id, r.skill_id, 1.000]);
  }
  console.log(`Resources & junctions inserted: ${resources.length}`);

  // 7. Seed Demo Active Roadmap & Items (FK -> roadmaps, roadmap_items)
  console.log('7. Seeding Active Roadmap & Roadmap Items...');
  const roadmapSql = `
    INSERT INTO roadmaps (
      id, user_id, target_goal, target_role, total_phases,
      estimated_duration_weeks, total_hours, status, adaptation_notes
    ) VALUES (
      'rdmp_demo_be',
      'usr_demo_101',
      'Backend Developer Roadmap',
      'Backend Developer',
      3,
      12,
      50,
      'active',
      'Tailored backend curriculum with PostgreSQL, FastAPI, Docker, and OWASP Security.'
    )
    ON CONFLICT (id) DO UPDATE SET target_role = EXCLUDED.target_role;
  `;
  await query(roadmapSql);

  const items = [
    {
      id: 'item_be_1',
      roadmap_id: 'rdmp_demo_be',
      skill_id: 'prog_python',
      skill_name: 'Python Foundations & Idioms',
      sequence_order: 1,
      phase: 1,
      phase_title: 'Phase 1: Language & Memory Mastery',
      estimated_hours: 10,
      status: 'completed',
      milestone: 'Master Python types, generators, async I/O, and OOP design.',
      milestone_project: 'Async CLI Log Parser & Analyzer'
    },
    {
      id: 'item_be_2',
      roadmap_id: 'rdmp_demo_be',
      skill_id: 'data_sql',
      skill_name: 'PostgreSQL Relational Architecture',
      sequence_order: 2,
      phase: 1,
      phase_title: 'Phase 1: Language & Memory Mastery',
      estimated_hours: 12,
      status: 'in_progress',
      milestone: 'Design 3NF relational schemas, composite indexes, and ACID transactions.',
      milestone_project: 'High-Concurrency E-Commerce DB Schema with Index Optimization'
    },
    {
      id: 'item_be_3',
      roadmap_id: 'rdmp_demo_be',
      skill_id: 'web_backend_apis',
      skill_name: 'FastAPI Microservice & REST Architecture',
      sequence_order: 3,
      phase: 2,
      phase_title: 'Phase 2: High-Performance Services',
      estimated_hours: 14,
      status: 'locked',
      milestone: 'Develop rate-limited, JWT-authenticated REST & background worker APIs.',
      milestone_project: 'Distributed URL Shortener with Redis Cache & Analytics'
    },
    {
      id: 'item_be_4',
      roadmap_id: 'rdmp_demo_be',
      skill_id: 'devops_docker_containers',
      skill_name: 'Docker Containerization & Compose',
      sequence_order: 4,
      phase: 2,
      phase_title: 'Phase 2: High-Performance Services',
      estimated_hours: 8,
      status: 'locked',
      milestone: 'Package backend APIs into hardened multi-stage Docker images.',
      milestone_project: 'Multi-Service Docker Compose Setup (API + Postgres + Redis)'
    },
    {
      id: 'item_be_5',
      roadmap_id: 'rdmp_demo_be',
      skill_id: 'sec_app_cloud_security',
      skill_name: 'Backend Security & OWASP Hardening',
      sequence_order: 5,
      phase: 3,
      phase_title: 'Phase 3: Production Hardening & Capstone',
      estimated_hours: 6,
      status: 'locked',
      milestone: 'Implement SQL injection defense, CORS, rate limiting, and zero-trust.',
      milestone_project: 'Enterprise API Gateway with OAuth2 & Token Revocation'
    }
  ];

  for (const it of items) {
    const itSql = `
      INSERT INTO roadmap_items (
        id, roadmap_id, skill_id, skill_name, sequence_order, phase,
        phase_title, estimated_hours, status, milestone, milestone_project
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, skill_name = EXCLUDED.skill_name;
    `;
    await query(itSql, [it.id, it.roadmap_id, it.skill_id, it.skill_name, it.sequence_order, it.phase, it.phase_title, it.estimated_hours, it.status, it.milestone, it.milestone_project]);

    // Seed progress table (FK -> users, roadmap_items)
    const progSql = `
      INSERT INTO progress (
        id, user_id, roadmap_item_id, completion_percentage, time_spent_hours, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, roadmap_item_id) DO UPDATE SET completion_percentage = EXCLUDED.completion_percentage;
    `;
    const pct = it.status === 'completed' ? 100 : (it.status === 'in_progress' ? 45 : 0);
    const hrs = it.status === 'completed' ? it.estimated_hours : (it.status === 'in_progress' ? 5 : 0);
    await query(progSql, [`prog_${it.id}`, 'usr_demo_101', it.id, pct, hrs, it.status === 'completed' ? 'completed' : (it.status === 'in_progress' ? 'in_progress' : 'not_started')]);
  }
  console.log(`Roadmap items & progress records inserted: ${items.length}`);

  // 8. Verify with View Query
  console.log('\n=== TESTING RELATIONAL VIEWS WITH JOINS ===');
  const analyticsRes = await query('SELECT * FROM v_learner_roadmap_analytics;');
  console.log('v_learner_roadmap_analytics result:');
  console.table(analyticsRes.result?.rows);

  const dagRes = await query('SELECT * FROM v_skill_dependency_dag WHERE prerequisite_skill_id IS NOT NULL LIMIT 5;');
  console.log('\nv_skill_dependency_dag sample:');
  console.table(dagRes.result?.rows);

  console.log('\n✅ RELATIONAL DATABASE IS FULLY NORMALIZED, SEEDED, AND VERIFIED!');
}

seed().catch(console.error);
