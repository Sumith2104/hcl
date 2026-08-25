import { Skill, SkillPrerequisite, RoleSkillRequirement, Resource, AssessmentQuiz } from './schema';

export const SEED_SKILLS: Skill[] = [
  // Math & Theory
  { id: 'math_linear_algebra', name: 'Linear Algebra', category: 'math_theory', description: 'Vectors, matrices, eigenvalues, matrix decompositions (SVD, PCA).', aliases: ['matrix math', 'vectors', 'linear-algebra'], difficulty_base: 'beginner' },
  { id: 'math_calculus', name: 'Multivariate Calculus', category: 'math_theory', description: 'Gradients, partial derivatives, chain rule, optimization foundations.', aliases: ['calculus', 'derivatives', 'gradient-descent'], difficulty_base: 'beginner' },
  { id: 'math_statistics', name: 'Probability & Statistics', category: 'math_theory', description: 'Probability distributions, hypothesis testing, Bayes theorem, p-values, variance.', aliases: ['stats', 'probability', 'inferential statistics'], difficulty_base: 'beginner' },
  
  // Programming & Core
  { id: 'prog_python', name: 'Python Programming', category: 'programming', description: 'Core Python, OOP, decorators, generators, type hints, async programming.', aliases: ['python', 'py', 'python3'], difficulty_base: 'beginner' },
  { id: 'prog_data_structures', name: 'Data Structures & Algorithms', category: 'programming', description: 'Trees, graphs, dynamic programming, algorithmic complexity, sorting.', aliases: ['dsa', 'algorithms', 'data structures'], difficulty_base: 'intermediate' },
  { id: 'prog_typescript', name: 'TypeScript & JavaScript', category: 'programming', description: 'Modern TypeScript, ESNext, static typing, interfaces, async/await.', aliases: ['ts', 'js', 'javascript', 'typescript'], difficulty_base: 'beginner' },
  
  // Data & Systems
  { id: 'data_sql', name: 'SQL & Database Architecture', category: 'systems_data', description: 'Relational DBs, complex joins, indexing, normalization, transaction isolation.', aliases: ['sql', 'postgres', 'postgresql', 'relational-database'], difficulty_base: 'beginner' },
  { id: 'data_pandas_numpy', name: 'Data Wrangling (Pandas & NumPy)', category: 'systems_data', description: 'Vectorized computing, exploratory data analysis, data cleaning, aggregation.', aliases: ['pandas', 'numpy', 'eda', 'data cleaning'], difficulty_base: 'beginner' },
  { id: 'data_vector_dbs', name: 'Vector Databases & Retrieval', category: 'systems_data', description: 'Vector embeddings, pgvector, similarity search (HNSW, Cosine), hybrid search.', aliases: ['vector db', 'pgvector', 'pinecone', 'milvus', 'chroma'], difficulty_base: 'intermediate' },
  
  // Web & Fullstack
  { id: 'web_react_next', name: 'React & Next.js Framework', category: 'programming', description: 'Server Components, App Router, hooks, state management, SSR/SSG.', aliases: ['react', 'next.js', 'nextjs', 'react.js'], difficulty_base: 'intermediate' },
  { id: 'web_backend_apis', name: 'Backend API Engineering (REST & GraphQL)', category: 'programming', description: 'FastAPI, Express/Next API routes, authentication (JWT/OAuth), rate limiting, OpenAPI.', aliases: ['fastapi', 'rest api', 'backend', 'api design'], difficulty_base: 'intermediate' },
  
  // AI & Machine Learning
  { id: 'ai_ml_foundations', name: 'Classical Machine Learning', category: 'ai_ml', description: 'Supervised & unsupervised learning, regression, decision trees, random forests, XGBoost, cross-validation.', aliases: ['ml', 'machine learning', 'scikit-learn', 'classical ml'], difficulty_base: 'intermediate' },
  { id: 'ai_deep_learning', name: 'Deep Learning & Neural Networks', category: 'ai_ml', description: 'Backpropagation, loss functions, PyTorch, CNNs, regularization, learning rate scheduling.', aliases: ['deep learning', 'pytorch', 'neural networks', 'ann', 'dl'], difficulty_base: 'intermediate' },
  { id: 'ai_transformers_nlp', name: 'Transformers & NLP Architecture', category: 'ai_ml', description: 'Attention mechanisms, self-attention, BERT, GPT architecture, tokenization, HuggingFace.', aliases: ['nlp', 'transformers', 'attention', 'huggingface', 'bert'], difficulty_base: 'advanced' },
  { id: 'ai_llm_engineering', name: 'LLM Application Engineering & RAG', category: 'ai_ml', description: 'Retrieval Augmented Generation (RAG), prompt engineering, tool calling, langchain/custom orchestrators.', aliases: ['rag', 'prompt engineering', 'llm apps', 'generative ai', 'bedrock apps'], difficulty_base: 'advanced' },
  { id: 'ai_finetuning_evals', name: 'LLM Fine-Tuning & Evaluation', category: 'ai_ml', description: 'LoRA, QLoRA, RLHF, rubric-based evaluation, benchmark datasets, guardrails.', aliases: ['finetuning', 'lora', 'evals', 'llm evaluation', 'qlora'], difficulty_base: 'advanced' },
  { id: 'ai_computer_vision', name: 'Computer Vision & Multi-Modal AI', category: 'ai_ml', description: 'Object detection (YOLO), vision transformers (ViT), image segmentation, CLIP.', aliases: ['computer vision', 'cv', 'yolo', 'vit', 'multimodal'], difficulty_base: 'advanced' },
  
  // DevOps & Cloud Engineering
  { id: 'devops_docker_containers', name: 'Docker & Containerization', category: 'engineering_devops', description: 'Multi-stage Dockerfiles, container optimization, docker-compose, networking.', aliases: ['docker', 'containers', 'dockerfile'], difficulty_base: 'beginner' },
  { id: 'devops_aws_cloud', name: 'AWS Cloud Architecture & ECS', category: 'engineering_devops', description: 'ECS Fargate, ALB, S3, RDS, Secrets Manager, IAM least-privilege, CloudWatch.', aliases: ['aws', 'cloud', 'ecs', 'fargate', 'iam', 's3'], difficulty_base: 'intermediate' },
  { id: 'devops_cicd_terraform', name: 'CI/CD & Infrastructure as Code (Terraform)', category: 'engineering_devops', description: 'GitHub Actions pipelines, Terraform modules, state management, automated deployment.', aliases: ['terraform', 'iac', 'cicd', 'github actions', 'devops'], difficulty_base: 'advanced' },
  { id: 'devops_mlops', name: 'MLOps & Model Serving', category: 'engineering_devops', description: 'Model registries, Triton/TorchServe, batch inference, drift detection, monitoring.', aliases: ['mlops', 'model deployment', 'model serving', 'triton'], difficulty_base: 'advanced' },
  
  // Security
  { id: 'sec_app_cloud_security', name: 'Application & Cloud Security', category: 'security', description: 'JWT verification, OWASP top 10, prompt injection defenses, KMS encryption, zero-trust.', aliases: ['security', 'appsec', 'cloud security', 'owasp', 'jwt'], difficulty_base: 'intermediate' }
];

export const SEED_PREREQUISITES: SkillPrerequisite[] = [
  // Math -> ML
  { id: 'pr_1', skill_id: 'ai_ml_foundations', prerequisite_skill_id: 'prog_python', importance: 'critical' },
  { id: 'pr_2', skill_id: 'ai_ml_foundations', prerequisite_skill_id: 'math_linear_algebra', importance: 'critical' },
  { id: 'pr_3', skill_id: 'ai_ml_foundations', prerequisite_skill_id: 'math_statistics', importance: 'critical' },
  { id: 'pr_4', skill_id: 'ai_ml_foundations', prerequisite_skill_id: 'data_pandas_numpy', importance: 'critical' },
  
  // ML -> Deep Learning
  { id: 'pr_5', skill_id: 'ai_deep_learning', prerequisite_skill_id: 'ai_ml_foundations', importance: 'critical' },
  { id: 'pr_6', skill_id: 'ai_deep_learning', prerequisite_skill_id: 'math_calculus', importance: 'critical' },
  
  // DL -> Transformers & NLP
  { id: 'pr_7', skill_id: 'ai_transformers_nlp', prerequisite_skill_id: 'ai_deep_learning', importance: 'critical' },
  
  // Transformers -> LLM Engineering / RAG
  { id: 'pr_8', skill_id: 'ai_llm_engineering', prerequisite_skill_id: 'ai_transformers_nlp', importance: 'critical' },
  { id: 'pr_9', skill_id: 'ai_llm_engineering', prerequisite_skill_id: 'data_vector_dbs', importance: 'recommended' },
  { id: 'pr_10', skill_id: 'ai_llm_engineering', prerequisite_skill_id: 'web_backend_apis', importance: 'recommended' },
  
  // LLM App -> Fine-tuning
  { id: 'pr_11', skill_id: 'ai_finetuning_evals', prerequisite_skill_id: 'ai_llm_engineering', importance: 'critical' },
  
  // DL -> Computer Vision
  { id: 'pr_12', skill_id: 'ai_computer_vision', prerequisite_skill_id: 'ai_deep_learning', importance: 'critical' },
  
  // Web & Backend
  { id: 'pr_13', skill_id: 'web_react_next', prerequisite_skill_id: 'prog_typescript', importance: 'critical' },
  { id: 'pr_14', skill_id: 'web_backend_apis', prerequisite_skill_id: 'data_sql', importance: 'recommended' },
  
  // Cloud & DevOps
  { id: 'pr_15', skill_id: 'devops_aws_cloud', prerequisite_skill_id: 'devops_docker_containers', importance: 'critical' },
  { id: 'pr_16', skill_id: 'devops_cicd_terraform', prerequisite_skill_id: 'devops_aws_cloud', importance: 'critical' },
  { id: 'pr_17', skill_id: 'devops_mlops', prerequisite_skill_id: 'ai_deep_learning', importance: 'critical' },
  { id: 'pr_18', skill_id: 'devops_mlops', prerequisite_skill_id: 'devops_docker_containers', importance: 'critical' },
  { id: 'pr_19', skill_id: 'devops_mlops', prerequisite_skill_id: 'devops_aws_cloud', importance: 'recommended' }
];

export const SEED_ROLE_REQUIREMENTS: RoleSkillRequirement[] = [
  // 1. AI Application Engineer
  { id: 'role_ai_1', target_role: 'AI Engineer', skill_id: 'prog_python', required_level: 'advanced', importance: 'must_have', sequence_weight: 1 },
  { id: 'role_ai_2', target_role: 'AI Engineer', skill_id: 'data_pandas_numpy', required_level: 'intermediate', importance: 'must_have', sequence_weight: 2 },
  { id: 'role_ai_3', target_role: 'AI Engineer', skill_id: 'ai_ml_foundations', required_level: 'intermediate', importance: 'must_have', sequence_weight: 3 },
  { id: 'role_ai_4', target_role: 'AI Engineer', skill_id: 'ai_deep_learning', required_level: 'intermediate', importance: 'must_have', sequence_weight: 4 },
  { id: 'role_ai_5', target_role: 'AI Engineer', skill_id: 'ai_transformers_nlp', required_level: 'advanced', importance: 'must_have', sequence_weight: 5 },
  { id: 'role_ai_6', target_role: 'AI Engineer', skill_id: 'data_vector_dbs', required_level: 'advanced', importance: 'must_have', sequence_weight: 6 },
  { id: 'role_ai_7', target_role: 'AI Engineer', skill_id: 'ai_llm_engineering', required_level: 'advanced', importance: 'must_have', sequence_weight: 7 },
  { id: 'role_ai_8', target_role: 'AI Engineer', skill_id: 'web_backend_apis', required_level: 'intermediate', importance: 'core', sequence_weight: 8 },
  { id: 'role_ai_9', target_role: 'AI Engineer', skill_id: 'devops_docker_containers', required_level: 'intermediate', importance: 'core', sequence_weight: 9 },
  { id: 'role_ai_10', target_role: 'AI Engineer', skill_id: 'ai_finetuning_evals', required_level: 'intermediate', importance: 'core', sequence_weight: 10 },
  
  // 2. Machine Learning Engineer
  { id: 'role_ml_1', target_role: 'Machine Learning Engineer', skill_id: 'prog_python', required_level: 'advanced', importance: 'must_have', sequence_weight: 1 },
  { id: 'role_ml_2', target_role: 'Machine Learning Engineer', skill_id: 'math_linear_algebra', required_level: 'intermediate', importance: 'must_have', sequence_weight: 2 },
  { id: 'role_ml_3', target_role: 'Machine Learning Engineer', skill_id: 'math_statistics', required_level: 'intermediate', importance: 'must_have', sequence_weight: 3 },
  { id: 'role_ml_4', target_role: 'Machine Learning Engineer', skill_id: 'data_pandas_numpy', required_level: 'advanced', importance: 'must_have', sequence_weight: 4 },
  { id: 'role_ml_5', target_role: 'Machine Learning Engineer', skill_id: 'ai_ml_foundations', required_level: 'advanced', importance: 'must_have', sequence_weight: 5 },
  { id: 'role_ml_6', target_role: 'Machine Learning Engineer', skill_id: 'ai_deep_learning', required_level: 'advanced', importance: 'must_have', sequence_weight: 6 },
  { id: 'role_ml_7', target_role: 'Machine Learning Engineer', skill_id: 'devops_docker_containers', required_level: 'intermediate', importance: 'core', sequence_weight: 7 },
  { id: 'role_ml_8', target_role: 'Machine Learning Engineer', skill_id: 'devops_mlops', required_level: 'advanced', importance: 'must_have', sequence_weight: 8 },
  { id: 'role_ml_9', target_role: 'Machine Learning Engineer', skill_id: 'devops_aws_cloud', required_level: 'intermediate', importance: 'core', sequence_weight: 9 },

  // 3. Backend Developer
  { id: 'role_be_1', target_role: 'Backend Developer', skill_id: 'prog_python', required_level: 'advanced', importance: 'must_have', sequence_weight: 1 },
  { id: 'role_be_2', target_role: 'Backend Developer', skill_id: 'data_sql', required_level: 'advanced', importance: 'must_have', sequence_weight: 2 },
  { id: 'role_be_3', target_role: 'Backend Developer', skill_id: 'web_backend_apis', required_level: 'advanced', importance: 'must_have', sequence_weight: 3 },
  { id: 'role_be_4', target_role: 'Backend Developer', skill_id: 'devops_docker_containers', required_level: 'intermediate', importance: 'must_have', sequence_weight: 4 },
  { id: 'role_be_5', target_role: 'Backend Developer', skill_id: 'sec_app_cloud_security', required_level: 'intermediate', importance: 'core', sequence_weight: 5 },

  // 4. Frontend Developer
  { id: 'role_fe_1', target_role: 'Frontend Developer', skill_id: 'prog_typescript', required_level: 'advanced', importance: 'must_have', sequence_weight: 1 },
  { id: 'role_fe_2', target_role: 'Frontend Developer', skill_id: 'web_react_next', required_level: 'advanced', importance: 'must_have', sequence_weight: 2 },
  { id: 'role_fe_3', target_role: 'Frontend Developer', skill_id: 'web_backend_apis', required_level: 'beginner', importance: 'core', sequence_weight: 3 },

  // 5. Full Stack Web Developer
  { id: 'role_fs_1', target_role: 'Full Stack Developer', skill_id: 'prog_typescript', required_level: 'advanced', importance: 'must_have', sequence_weight: 1 },
  { id: 'role_fs_2', target_role: 'Full Stack Developer', skill_id: 'web_react_next', required_level: 'advanced', importance: 'must_have', sequence_weight: 2 },
  { id: 'role_fs_3', target_role: 'Full Stack Developer', skill_id: 'data_sql', required_level: 'intermediate', importance: 'must_have', sequence_weight: 3 },
  { id: 'role_fs_4', target_role: 'Full Stack Developer', skill_id: 'web_backend_apis', required_level: 'advanced', importance: 'must_have', sequence_weight: 4 },
  { id: 'role_fs_5', target_role: 'Full Stack Developer', skill_id: 'devops_docker_containers', required_level: 'intermediate', importance: 'core', sequence_weight: 5 },
  { id: 'role_fs_6', target_role: 'Full Stack Developer', skill_id: 'sec_app_cloud_security', required_level: 'intermediate', importance: 'core', sequence_weight: 6 },

  // 6. Cloud & DevOps Architect
  { id: 'role_do_1', target_role: 'DevOps Engineer', skill_id: 'prog_python', required_level: 'intermediate', importance: 'must_have', sequence_weight: 1 },
  { id: 'role_do_2', target_role: 'DevOps Engineer', skill_id: 'devops_docker_containers', required_level: 'advanced', importance: 'must_have', sequence_weight: 2 },
  { id: 'role_do_3', target_role: 'DevOps Engineer', skill_id: 'devops_aws_cloud', required_level: 'advanced', importance: 'must_have', sequence_weight: 3 },
  { id: 'role_do_4', target_role: 'DevOps Engineer', skill_id: 'devops_cicd_terraform', required_level: 'advanced', importance: 'must_have', sequence_weight: 4 },
  { id: 'role_do_5', target_role: 'DevOps Engineer', skill_id: 'sec_app_cloud_security', required_level: 'advanced', importance: 'must_have', sequence_weight: 5 },

  // 7. Data Scientist
  { id: 'role_ds_1', target_role: 'Data Scientist', skill_id: 'prog_python', required_level: 'advanced', importance: 'must_have', sequence_weight: 1 },
  { id: 'role_ds_2', target_role: 'Data Scientist', skill_id: 'math_statistics', required_level: 'advanced', importance: 'must_have', sequence_weight: 2 },
  { id: 'role_ds_3', target_role: 'Data Scientist', skill_id: 'data_sql', required_level: 'advanced', importance: 'must_have', sequence_weight: 3 },
  { id: 'role_ds_4', target_role: 'Data Scientist', skill_id: 'data_pandas_numpy', required_level: 'advanced', importance: 'must_have', sequence_weight: 4 },
  { id: 'role_ds_5', target_role: 'Data Scientist', skill_id: 'ai_ml_foundations', required_level: 'advanced', importance: 'must_have', sequence_weight: 5 },
  { id: 'role_ds_6', target_role: 'Data Scientist', skill_id: 'ai_deep_learning', required_level: 'intermediate', importance: 'core', sequence_weight: 6 },

  // 8. DSA in Python
  { id: 'role_dsa_1', target_role: 'DSA in Python', skill_id: 'prog_python', required_level: 'advanced', importance: 'must_have', sequence_weight: 1 },
  { id: 'role_dsa_2', target_role: 'DSA in Python', skill_id: 'prog_data_structures', required_level: 'advanced', importance: 'must_have', sequence_weight: 2 },

  // 9. Prompt Engineer
  { id: 'role_pe_1', target_role: 'Prompt Engineer', skill_id: 'prog_python', required_level: 'intermediate', importance: 'core', sequence_weight: 1 },
  { id: 'role_pe_2', target_role: 'Prompt Engineer', skill_id: 'ai_transformers_nlp', required_level: 'advanced', importance: 'must_have', sequence_weight: 2 },
  { id: 'role_pe_3', target_role: 'Prompt Engineer', skill_id: 'ai_llm_engineering', required_level: 'advanced', importance: 'must_have', sequence_weight: 3 }
];

export const SEED_RESOURCES: Resource[] = [
  {
    id: 'res_py_1',
    title: 'Python for Software Engineering & Modern Data Science',
    description: 'Deep dive into Python 3 idioms, data structures, generators, decorators, and typing.',
    url: 'https://docs.python.org/3/tutorial/',
    platform: 'Official Python Docs & Exercises',
    type: 'documentation',
    difficulty: 'beginner',
    estimated_hours: 12,
    quality_score: 0.95,
    tags: ['python', 'basics', 'oop'],
    skill_ids: ['prog_python'],
    is_free: true
  },
  {
    id: 'res_stats_1',
    title: 'Statistical Thinking for Machine Learning Practitioners',
    description: 'Master probability distributions, hypothesis testing, Bayesian inference, and p-value interpretations.',
    url: 'https://ocw.mit.edu/courses/mathematics/18-05-introduction-to-probability-and-statistics-spring-2014/',
    platform: 'MIT OpenCourseWare',
    type: 'course',
    difficulty: 'beginner',
    estimated_hours: 18,
    quality_score: 0.94,
    tags: ['statistics', 'probability', 'math'],
    skill_ids: ['math_statistics'],
    is_free: true
  },
  {
    id: 'res_lin_1',
    title: 'Linear Algebra for Deep Learning & Computer Vision',
    description: 'Gilbert Strang’s famous linear algebra course covering vector spaces, transformations, and SVD.',
    url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/',
    platform: 'MIT OCW',
    type: 'video_series',
    difficulty: 'intermediate',
    estimated_hours: 15,
    quality_score: 0.97,
    tags: ['linear algebra', 'matrices', 'svd'],
    skill_ids: ['math_linear_algebra'],
    is_free: true
  },
  {
    id: 'res_pandas_1',
    title: 'Practical Data Wrangling with Pandas & NumPy',
    description: 'Hands-on dataset manipulation, grouping, pivot tables, memory optimization, and cleaning.',
    url: 'https://pandas.pydata.org/docs/user_guide/index.html',
    platform: 'PyData Practical Guide',
    type: 'interactive_project',
    difficulty: 'beginner',
    estimated_hours: 10,
    quality_score: 0.92,
    tags: ['pandas', 'numpy', 'data wrangling'],
    skill_ids: ['data_pandas_numpy'],
    is_free: true
  },
  {
    id: 'res_ml_1',
    title: 'Stanford CS229: Machine Learning Foundations & Algorithms',
    description: 'End-to-end mathematical rigor of supervised and unsupervised machine learning algorithms.',
    url: 'https://cs229.stanford.edu/',
    platform: 'Stanford University',
    type: 'course',
    difficulty: 'intermediate',
    estimated_hours: 24,
    quality_score: 0.98,
    tags: ['machine learning', 'algorithms', 'cs229'],
    skill_ids: ['ai_ml_foundations'],
    is_free: true
  },
  {
    id: 'res_ml_proj_1',
    title: 'End-to-End Predictive Analytics Pipeline Project',
    description: 'Build and validate a real-world customer churn prediction pipeline with Scikit-Learn & cross-validation.',
    url: 'https://github.com/scikit-learn/scikit-learn',
    platform: 'Interactive Project Sandbox',
    type: 'interactive_project',
    difficulty: 'intermediate',
    estimated_hours: 8,
    quality_score: 0.91,
    tags: ['project', 'scikit-learn', 'portfolio'],
    skill_ids: ['ai_ml_foundations'],
    is_free: true
  },
  {
    id: 'res_dl_1',
    title: 'PyTorch Deep Learning Zero to Mastery',
    description: 'Build neural networks from scratch, compute graph gradients, and train custom PyTorch models.',
    url: 'https://pytorch.org/tutorials/',
    platform: 'PyTorch Official Learning Lab',
    type: 'course',
    difficulty: 'intermediate',
    estimated_hours: 20,
    quality_score: 0.96,
    tags: ['pytorch', 'deep learning', 'neural networks'],
    skill_ids: ['ai_deep_learning'],
    is_free: true
  },
  {
    id: 'res_transformers_1',
    title: 'HuggingFace NLP Course: Transformers in Depth',
    description: 'Self-attention, BERT, GPT tokenizers, pipelines, dataset streaming, and fine-tuning with Accelerate.',
    url: 'https://huggingface.co/learn/nlp-course',
    platform: 'HuggingFace',
    type: 'course',
    difficulty: 'advanced',
    estimated_hours: 18,
    quality_score: 0.98,
    tags: ['transformers', 'nlp', 'huggingface'],
    skill_ids: ['ai_transformers_nlp'],
    is_free: true
  },
  {
    id: 'res_rag_1',
    title: 'Production RAG Systems & Vector Search Architecture',
    description: 'Build production-ready RAG with hybrid retrieval, re-ranking, chunking strategies, and pgvector.',
    url: 'https://aws.amazon.com/bedrock/knowledge-bases/',
    platform: 'AWS Bedrock AI Architecture Lab',
    type: 'interactive_project',
    difficulty: 'advanced',
    estimated_hours: 16,
    quality_score: 0.97,
    tags: ['rag', 'vector dbs', 'aws bedrock', 'llm'],
    skill_ids: ['ai_llm_engineering', 'data_vector_dbs'],
    is_free: true
  },
  {
    id: 'res_eval_1',
    title: 'LLM Fine-Tuning (LoRA) & Golden-Set Evaluation Benchmarking',
    description: 'Parameter-efficient fine-tuning with PEFT/LoRA and automated LLM-as-a-judge rubric scoring.',
    url: 'https://docs.anthropic.com/en/docs/build-with-claude/eval-tool',
    platform: 'AI Systems Engineering Guide',
    type: 'documentation',
    difficulty: 'advanced',
    estimated_hours: 14,
    quality_score: 0.94,
    tags: ['finetuning', 'lora', 'evaluation'],
    skill_ids: ['ai_finetuning_evals'],
    is_free: true
  },
  {
    id: 'res_docker_1',
    title: 'Docker Mastery: Production Containers for Developers',
    description: 'Docker multi-stage builds, Alpine optimizations, caching layers, and secure container runtimes.',
    url: 'https://docs.docker.com/get-started/',
    platform: 'Docker Documentation',
    type: 'interactive_project',
    difficulty: 'beginner',
    estimated_hours: 8,
    quality_score: 0.93,
    tags: ['docker', 'devops', 'containers'],
    skill_ids: ['devops_docker_containers'],
    is_free: true
  },
  {
    id: 'res_aws_1',
    title: 'AWS Cloud Architecture for High-Scale Applications',
    description: 'Deploying containerized services on ECS Fargate behind ALB with RDS PostgreSQL and Secrets Manager.',
    url: 'https://aws.amazon.com/ecs/',
    platform: 'AWS Hands-On Tutorials',
    type: 'course',
    difficulty: 'intermediate',
    estimated_hours: 14,
    quality_score: 0.95,
    tags: ['aws', 'ecs', 'fargate', 'cloud'],
    skill_ids: ['devops_aws_cloud'],
    is_free: true
  },
  {
    id: 'res_mlops_1',
    title: 'Full Stack MLOps: CI/CD, Model Registry & Real-Time Serving',
    description: 'Deploying PyTorch models with Triton, monitoring feature drift, and automated retraining pipelines.',
    url: 'https://madewithml.com/',
    platform: 'Made With ML (Goku Mohandas)',
    type: 'course',
    difficulty: 'advanced',
    estimated_hours: 22,
    quality_score: 0.99,
    tags: ['mlops', 'production ml', 'serving'],
    skill_ids: ['devops_mlops'],
    is_free: true
  },
  {
    id: 'res_react_1',
    title: 'Next.js 14/15 App Router Full Mastery',
    description: 'Master React Server Components, Server Actions, streaming SSR, and edge middleware.',
    url: 'https://nextjs.org/learn',
    platform: 'Next.js Learning Platform',
    type: 'course',
    difficulty: 'intermediate',
    estimated_hours: 15,
    quality_score: 0.96,
    tags: ['react', 'nextjs', 'typescript'],
    skill_ids: ['web_react_next', 'prog_typescript'],
    is_free: true
  },
  {
    id: 'res_sql_1',
    title: 'High-Performance PostgreSQL & Vector Indexing',
    description: 'Indexing algorithms (B-Tree, GIN, HNSW, IVFFlat), query execution plans, and locking semantics.',
    url: 'https://use-the-index-luke.com/',
    platform: 'Database Engineering Guides',
    type: 'documentation',
    difficulty: 'intermediate',
    estimated_hours: 10,
    quality_score: 0.95,
    tags: ['sql', 'postgres', 'indexing'],
    skill_ids: ['data_sql', 'data_vector_dbs'],
    is_free: true
  }
];

export const SEED_QUIZZES: AssessmentQuiz[] = [
  {
    id: 'quiz_python',
    skill_id: 'prog_python',
    skill_name: 'Python Programming',
    questions: [
      {
        id: 'q1_py',
        question: 'What is the primary computational advantage of using Python generators over standard lists for large sequences?',
        options: [
          'Generators execute multithreaded by default',
          'Generators evaluate lazily and yield elements on-demand, consuming O(1) memory',
          'Generators compile Python code to native C machine code',
          'Generators automatically serialize data to disk'
        ],
        correct_index: 1,
        explanation: 'Generators yield items one at a time with lazy evaluation, avoiding loading the entire collection into RAM.'
      },
      {
        id: 'q2_py',
        question: 'In Python async/await (asyncio), what occurs when an `await` expression is executed?',
        options: [
          'The entire OS thread is blocked until IO completes',
          'A new daemon thread is spawned for the coroutine',
          'Control is yielded back to the event loop so other tasks can run while waiting for IO',
          'The interpreter performs a garbage collection cycle'
        ],
        correct_index: 2,
        explanation: '`await` yields control back to the asyncio event loop, allowing cooperative multitasking during asynchronous IO.'
      }
    ]
  },
  {
    id: 'quiz_ml',
    skill_id: 'ai_ml_foundations',
    skill_name: 'Classical Machine Learning',
    questions: [
      {
        id: 'q1_ml',
        question: 'When a model exhibits very low training error but significantly higher validation error, it is suffering from:',
        options: [
          'High bias (Underfitting)',
          'High variance (Overfitting)',
          'Vanishing gradient problem',
          'Data drift'
        ],
        correct_index: 1,
        explanation: 'A large gap between low train error and high validation error indicates the model memorized training noise (overfitting / high variance).'
      },
      {
        id: 'q2_ml',
        question: 'Why is L1 regularization (Lasso) capable of performing feature selection compared to L2 (Ridge)?',
        options: [
          'L1 penalizes the square of coefficients',
          'L1 loss surface has sharp diamond vertices along axes, driving irrelevant weights strictly to zero',
          'L1 requires fewer training iterations',
          'L1 is only applicable to linear classification'
        ],
        correct_index: 1,
        explanation: 'The geometry of L1 penalty creates sparse solutions by pushing non-essential feature coefficients exactly to 0.'
      }
    ]
  },
  {
    id: 'quiz_dl',
    skill_id: 'ai_deep_learning',
    skill_name: 'Deep Learning & Neural Networks',
    questions: [
      {
        id: 'q1_dl',
        question: 'What is the key mechanism in Residual Networks (ResNets) that enables training extremely deep networks (100+ layers)?',
        options: [
          'Max pooling layers that reduce image dimensions',
          'Skip connections (identity shortcuts) that allow gradients to flow directly without vanishing',
          'Batch normalization applied only at the final layer',
          'Using Sigmoid activation functions throughout'
        ],
        correct_index: 1,
        explanation: 'Skip connections allow the identity mapping f(x) + x, providing direct pathways for backpropagation gradients to flow without vanishing.'
      }
    ]
  },
  {
    id: 'quiz_transformers',
    skill_id: 'ai_transformers_nlp',
    skill_name: 'Transformers & NLP Architecture',
    questions: [
      {
        id: 'q1_tf',
        question: 'In Scaled Dot-Product Attention, what is the purpose of dividing the Q·Kᵀ matrix by √dₖ?',
        options: [
          'To reduce computational complexity from O(N²) to O(N)',
          'To prevent the dot products from growing excessively large for large dimensions, which would cause softmax gradients to vanish',
          'To enforce causality in autoregressive models',
          'To normalize tokens against word frequency'
        ],
        correct_index: 1,
        explanation: 'Scaling by √dₖ keeps the variance of dot products around 1, preventing softmax from entering regions with tiny gradients.'
      }
    ]
  }
];
