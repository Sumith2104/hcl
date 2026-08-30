import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ==================== SKILLS ====================
const skills = [
  // Programming
  { name: 'JavaScript', category: 'Programming', description: 'Core web programming language for interactive web applications' },
  { name: 'TypeScript', category: 'Programming', description: 'Typed superset of JavaScript for large-scale applications' },
  { name: 'Python', category: 'Programming', description: 'Versatile programming language for web, data science, and AI' },
  { name: 'React', category: 'Programming', description: 'Popular JavaScript library for building user interfaces' },
  { name: 'Next.js', category: 'Programming', description: 'Full-stack React framework with server-side rendering' },
  { name: 'Node.js', category: 'Programming', description: 'JavaScript runtime for server-side applications' },
  { name: 'HTML/CSS', category: 'Programming', description: 'Fundamental web technologies for structure and styling' },
  { name: 'SQL', category: 'Programming', description: 'Language for managing and querying relational databases' },
  { name: 'Go', category: 'Programming', description: 'Compiled language for scalable and concurrent systems' },
  { name: 'Rust', category: 'Programming', description: 'Systems programming language focused on safety and performance' },

  // Math & Statistics
  { name: 'Statistics', category: 'Math', description: 'Collection, analysis, interpretation of data' },
  { name: 'Linear Algebra', category: 'Math', description: 'Mathematical operations on vectors and matrices' },
  { name: 'Calculus', category: 'Math', description: 'Study of continuous change and derivatives' },
  { name: 'Probability', category: 'Math', description: 'Mathematical framework for quantifying uncertainty' },

  // AI/ML
  { name: 'Machine Learning', category: 'AI/ML', description: 'Algorithms that learn patterns from data to make predictions' },
  { name: 'Deep Learning', category: 'AI/ML', description: 'Neural networks with multiple layers for complex pattern recognition' },
  { name: 'Neural Networks', category: 'AI/ML', description: 'Computational models inspired by biological neural networks' },
  { name: 'NLP', category: 'AI/ML', description: 'Natural Language Processing for understanding human language' },
  { name: 'Computer Vision', category: 'AI/ML', description: 'Enabling computers to interpret visual information from the world' },
  { name: 'Reinforcement Learning', category: 'AI/ML', description: 'Learning through interaction with an environment' },
  { name: 'Transformers', category: 'AI/ML', description: 'Attention-based architecture for sequence processing' },
  { name: 'CNN', category: 'AI/ML', description: 'Convolutional Neural Networks for image and spatial data' },
  { name: 'RNN', category: 'AI/ML', description: 'Recurrent Neural Networks for sequential data' },
  { name: 'MLOps', category: 'AI/ML', description: 'Practices for deploying and maintaining ML models in production' },
  { name: 'Prompt Engineering', category: 'AI/ML', description: 'Crafting effective prompts for large language models' },
  { name: 'LLM Fundamentals', category: 'AI/ML', description: 'Understanding how large language models work' },
  { name: 'RAG', category: 'AI/ML', description: 'Retrieval-Augmented Generation for grounded AI responses' },
  { name: 'AI Agents', category: 'AI/ML', description: 'Building autonomous AI systems that can use tools and plan' },

  // Data
  { name: 'Data Analysis', category: 'Data', description: 'Examining data to extract insights and patterns' },
  { name: 'Data Visualization', category: 'Data', description: 'Creating visual representations of data' },
  { name: 'Pandas', category: 'Data', description: 'Python library for data manipulation and analysis' },
  { name: 'NumPy', category: 'Data', description: 'Python library for numerical computing' },
  { name: 'ETL', category: 'Data', description: 'Extract, Transform, Load processes for data pipelines' },
  { name: 'Data Warehousing', category: 'Data', description: 'Centralized repository for structured data analysis' },

  // DevOps
  { name: 'Docker', category: 'DevOps', description: 'Containerization platform for consistent environments' },
  { name: 'Kubernetes', category: 'DevOps', description: 'Container orchestration for automated deployment and scaling' },
  { name: 'CI/CD', category: 'DevOps', description: 'Continuous Integration and Continuous Deployment pipelines' },
  { name: 'AWS', category: 'DevOps', description: 'Amazon Web Services cloud computing platform' },
  { name: 'Linux', category: 'DevOps', description: 'Open-source operating system for servers and development' },
  { name: 'Git', category: 'DevOps', description: 'Distributed version control system' },
  { name: 'Terraform', category: 'DevOps', description: 'Infrastructure as Code tool for cloud provisioning' },
  { name: 'Monitoring', category: 'DevOps', description: 'Observability tools for tracking system health and performance' },

  // Security
  { name: 'Network Security', category: 'Security', description: 'Protecting network infrastructure from threats' },
  { name: 'Cryptography', category: 'Security', description: 'Techniques for secure communication and data protection' },
  { name: 'Application Security', category: 'Security', description: 'Securing software applications from vulnerabilities' },
  { name: 'Penetration Testing', category: 'Security', description: 'Authorized simulated attacks to find security weaknesses' },

  // Architecture
  { name: 'System Design', category: 'Architecture', description: 'Designing scalable and maintainable software systems' },
  { name: 'API Design', category: 'Architecture', description: 'Designing effective and consistent API interfaces' },
  { name: 'Microservices', category: 'Architecture', description: 'Architectural style for building distributed systems' },
  { name: 'REST APIs', category: 'Architecture', description: 'Representational State Transfer API design principles' },
  { name: 'GraphQL', category: 'Architecture', description: 'Query language for APIs that enables flexible data fetching' },

  // Frontend specific
  { name: 'Tailwind CSS', category: 'Frontend', description: 'Utility-first CSS framework for rapid UI development' },
  { name: 'State Management', category: 'Frontend', description: 'Managing application state in frontend frameworks' },
  { name: 'Responsive Design', category: 'Frontend', description: 'Designing interfaces that work across different screen sizes' },
  { name: 'Web Performance', category: 'Frontend', description: 'Optimizing web applications for speed and efficiency' },
  { name: 'Accessibility', category: 'Frontend', description: 'Making web applications usable for people with disabilities' },

  // Backend specific
  { name: 'Database Design', category: 'Backend', description: 'Designing efficient and normalized database schemas' },
  { name: 'Authentication', category: 'Backend', description: 'Implementing secure user authentication and authorization' },
  { name: 'Caching', category: 'Backend', description: 'Strategies for improving performance through data caching' },
  { name: 'Message Queues', category: 'Backend', description: 'Asynchronous communication between distributed systems' },
]

// ==================== PREREQUISITES ====================
// Format: [skill, requires, importance]
const prerequisites: [string, string, string][] = [
  // Programming prerequisites
  ['JavaScript', 'HTML/CSS', 'required'],
  ['TypeScript', 'JavaScript', 'required'],
  ['React', 'JavaScript', 'required'],
  ['React', 'HTML/CSS', 'recommended'],
  ['Next.js', 'React', 'required'],
  ['Next.js', 'Node.js', 'recommended'],
  ['Node.js', 'JavaScript', 'required'],
  ['Go', 'Programming', 'recommended'],
  ['Rust', 'Programming', 'recommended'],

  // Math prerequisites
  ['Statistics', 'Calculus', 'recommended'],
  ['Linear Algebra', 'Calculus', 'recommended'],
  ['Probability', 'Statistics', 'recommended'],
  ['Machine Learning', 'Statistics', 'required'],
  ['Machine Learning', 'Linear Algebra', 'required'],
  ['Machine Learning', 'Python', 'required'],
  ['Machine Learning', 'Probability', 'recommended'],

  // Deep Learning prerequisites
  ['Deep Learning', 'Machine Learning', 'required'],
  ['Deep Learning', 'Neural Networks', 'required'],
  ['Neural Networks', 'Machine Learning', 'required'],
  ['Neural Networks', 'Linear Algebra', 'required'],
  ['CNN', 'Deep Learning', 'required'],
  ['CNN', 'Computer Vision', 'recommended'],
  ['RNN', 'Deep Learning', 'required'],
  ['RNN', 'NLP', 'recommended'],
  ['Transformers', 'Deep Learning', 'required'],
  ['Transformers', 'NLP', 'recommended'],
  ['Reinforcement Learning', 'Machine Learning', 'required'],
  ['Reinforcement Learning', 'Deep Learning', 'recommended'],

  // MLOps
  ['MLOps', 'Machine Learning', 'required'],
  ['MLOps', 'Docker', 'required'],
  ['MLOps', 'CI/CD', 'recommended'],

  // AI Agent prerequisites
  ['Prompt Engineering', 'LLM Fundamentals', 'required'],
  ['RAG', 'LLM Fundamentals', 'required'],
  ['RAG', 'NLP', 'recommended'],
  ['AI Agents', 'LLM Fundamentals', 'required'],
  ['AI Agents', 'Prompt Engineering', 'required'],
  ['LLM Fundamentals', 'Machine Learning', 'required'],
  ['LLM Fundamentals', 'Deep Learning', 'recommended'],

  // Data
  ['Data Analysis', 'Statistics', 'required'],
  ['Data Analysis', 'Python', 'required'],
  ['Pandas', 'Python', 'required'],
  ['NumPy', 'Python', 'required'],
  ['Data Visualization', 'Data Analysis', 'required'],
  ['ETL', 'SQL', 'required'],
  ['ETL', 'Python', 'recommended'],
  ['Data Warehousing', 'SQL', 'required'],
  ['Data Warehousing', 'ETL', 'recommended'],

  // DevOps
  ['Docker', 'Linux', 'required'],
  ['Kubernetes', 'Docker', 'required'],
  ['CI/CD', 'Git', 'required'],
  ['CI/CD', 'Docker', 'recommended'],
  ['AWS', 'Linux', 'required'],
  ['AWS', 'Networking', 'recommended'],
  ['Terraform', 'AWS', 'recommended'],
  ['Terraform', 'Docker', 'recommended'],
  ['Monitoring', 'Docker', 'recommended'],
  ['Monitoring', 'Linux', 'recommended'],

  // Security
  ['Network Security', 'Linux', 'required'],
  ['Network Security', 'Networking', 'required'],
  ['Cryptography', 'Math', 'recommended'],
  ['Application Security', 'Authentication', 'required'],
  ['Penetration Testing', 'Network Security', 'required'],
  ['Penetration Testing', 'Application Security', 'required'],

  // Architecture
  ['System Design', 'Database Design', 'required'],
  ['System Design', 'API Design', 'required'],
  ['System Design', 'Caching', 'recommended'],
  ['Microservices', 'System Design', 'required'],
  ['Microservices', 'Docker', 'recommended'],
  ['REST APIs', 'API Design', 'required'],
  ['REST APIs', 'Authentication', 'recommended'],
  ['GraphQL', 'API Design', 'required'],
  ['GraphQL', 'REST APIs', 'recommended'],

  // Frontend
  ['Tailwind CSS', 'HTML/CSS', 'required'],
  ['State Management', 'React', 'required'],
  ['Responsive Design', 'HTML/CSS', 'required'],
  ['Web Performance', 'JavaScript', 'required'],
  ['Accessibility', 'HTML/CSS', 'required'],

  // Backend
  ['Database Design', 'SQL', 'required'],
  ['Authentication', 'Backend', 'required'],
  ['Caching', 'Backend', 'required'],
  ['Message Queues', 'Backend', 'recommended'],
]

// ==================== ROLE REQUIREMENTS ====================
// Format: [role, skill, requiredLevel, importance]
const roleRequirements: [string, string, string, string][] = [
  // Frontend Developer
  ['Frontend Developer', 'HTML/CSS', 'advanced', 'critical'],
  ['Frontend Developer', 'JavaScript', 'advanced', 'critical'],
  ['Frontend Developer', 'TypeScript', 'intermediate', 'high'],
  ['Frontend Developer', 'React', 'intermediate', 'critical'],
  ['Frontend Developer', 'Tailwind CSS', 'intermediate', 'high'],
  ['Frontend Developer', 'Responsive Design', 'intermediate', 'high'],
  ['Frontend Developer', 'State Management', 'intermediate', 'high'],
  ['Frontend Developer', 'Web Performance', 'beginner', 'medium'],
  ['Frontend Developer', 'Accessibility', 'beginner', 'medium'],
  ['Frontend Developer', 'Git', 'intermediate', 'high'],

  // Backend Developer
  ['Backend Developer', 'Python', 'intermediate', 'critical'],
  ['Backend Developer', 'Node.js', 'intermediate', 'high'],
  ['Backend Developer', 'SQL', 'intermediate', 'critical'],
  ['Backend Developer', 'Database Design', 'intermediate', 'high'],
  ['Backend Developer', 'REST APIs', 'intermediate', 'critical'],
  ['Backend Developer', 'Authentication', 'intermediate', 'high'],
  ['Backend Developer', 'Docker', 'beginner', 'medium'],
  ['Backend Developer', 'Git', 'intermediate', 'high'],
  ['Backend Developer', 'Caching', 'beginner', 'medium'],
  ['Backend Developer', 'Linux', 'beginner', 'medium'],

  // Full Stack Developer
  ['Full Stack Developer', 'JavaScript', 'advanced', 'critical'],
  ['Full Stack Developer', 'TypeScript', 'intermediate', 'critical'],
  ['Full Stack Developer', 'React', 'intermediate', 'critical'],
  ['Full Stack Developer', 'Next.js', 'intermediate', 'high'],
  ['Full Stack Developer', 'Node.js', 'intermediate', 'high'],
  ['Full Stack Developer', 'SQL', 'intermediate', 'critical'],
  ['Full Stack Developer', 'REST APIs', 'intermediate', 'high'],
  ['Full Stack Developer', 'Database Design', 'beginner', 'high'],
  ['Full Stack Developer', 'Docker', 'beginner', 'medium'],
  ['Full Stack Developer', 'Git', 'intermediate', 'high'],
  ['Full Stack Developer', 'Tailwind CSS', 'intermediate', 'high'],

  // Data Analyst
  ['Data Analyst', 'Statistics', 'intermediate', 'critical'],
  ['Data Analyst', 'Python', 'intermediate', 'critical'],
  ['Data Analyst', 'SQL', 'intermediate', 'critical'],
  ['Data Analyst', 'Data Analysis', 'intermediate', 'critical'],
  ['Data Analyst', 'Data Visualization', 'intermediate', 'critical'],
  ['Data Analyst', 'Pandas', 'intermediate', 'high'],
  ['Data Analyst', 'Excel', 'intermediate', 'high'],
  ['Data Analyst', 'Probability', 'beginner', 'medium'],

  // Data Scientist
  ['Data Scientist', 'Python', 'advanced', 'critical'],
  ['Data Scientist', 'Statistics', 'advanced', 'critical'],
  ['Data Scientist', 'Machine Learning', 'intermediate', 'critical'],
  ['Data Scientist', 'SQL', 'intermediate', 'high'],
  ['Data Scientist', 'Data Analysis', 'intermediate', 'critical'],
  ['Data Scientist', 'Data Visualization', 'intermediate', 'high'],
  ['Data Scientist', 'Pandas', 'intermediate', 'high'],
  ['Data Scientist', 'NumPy', 'intermediate', 'high'],
  ['Data Scientist', 'Linear Algebra', 'beginner', 'medium'],
  ['Data Scientist', 'Probability', 'intermediate', 'high'],

  // Machine Learning Engineer
  ['Machine Learning Engineer', 'Python', 'advanced', 'critical'],
  ['Machine Learning Engineer', 'Machine Learning', 'advanced', 'critical'],
  ['Machine Learning Engineer', 'Deep Learning', 'intermediate', 'critical'],
  ['Machine Learning Engineer', 'Statistics', 'intermediate', 'critical'],
  ['Machine Learning Engineer', 'Linear Algebra', 'intermediate', 'high'],
  ['Machine Learning Engineer', 'MLOps', 'beginner', 'high'],
  ['Machine Learning Engineer', 'Docker', 'beginner', 'high'],
  ['Machine Learning Engineer', 'SQL', 'beginner', 'medium'],
  ['Machine Learning Engineer', 'NumPy', 'intermediate', 'high'],
  ['Machine Learning Engineer', 'Pandas', 'intermediate', 'high'],

  // AI Engineer
  ['AI Engineer', 'Python', 'advanced', 'critical'],
  ['AI Engineer', 'Machine Learning', 'intermediate', 'critical'],
  ['AI Engineer', 'LLM Fundamentals', 'intermediate', 'critical'],
  ['AI Engineer', 'Prompt Engineering', 'intermediate', 'critical'],
  ['AI Engineer', 'RAG', 'intermediate', 'high'],
  ['AI Engineer', 'AI Agents', 'beginner', 'high'],
  ['AI Engineer', 'NLP', 'beginner', 'high'],
  ['AI Engineer', 'API Design', 'beginner', 'high'],
  ['AI Engineer', 'Docker', 'beginner', 'medium'],
  ['AI Engineer', 'REST APIs', 'intermediate', 'high'],

  // DevOps Engineer
  ['DevOps Engineer', 'Linux', 'advanced', 'critical'],
  ['DevOps Engineer', 'Docker', 'advanced', 'critical'],
  ['DevOps Engineer', 'Kubernetes', 'intermediate', 'high'],
  ['DevOps Engineer', 'CI/CD', 'intermediate', 'critical'],
  ['DevOps Engineer', 'AWS', 'intermediate', 'critical'],
  ['DevOps Engineer', 'Terraform', 'beginner', 'high'],
  ['DevOps Engineer', 'Monitoring', 'intermediate', 'high'],
  ['DevOps Engineer', 'Git', 'advanced', 'high'],
  ['DevOps Engineer', 'Python', 'beginner', 'medium'],
  ['DevOps Engineer', 'SQL', 'beginner', 'medium'],

  // Cybersecurity Analyst
  ['Cybersecurity Analyst', 'Network Security', 'intermediate', 'critical'],
  ['Cybersecurity Analyst', 'Linux', 'intermediate', 'critical'],
  ['Cybersecurity Analyst', 'Cryptography', 'beginner', 'high'],
  ['Cybersecurity Analyst', 'Application Security', 'beginner', 'high'],
  ['Cybersecurity Analyst', 'Penetration Testing', 'beginner', 'high'],
  ['Cybersecurity Analyst', 'Python', 'beginner', 'medium'],
  ['Cybersecurity Analyst', 'SQL', 'beginner', 'medium'],
]

// ==================== RESOURCES ====================
const resources = [
  // Programming
  { title: 'MDN Web Docs', description: 'Comprehensive documentation for web technologies including HTML, CSS, and JavaScript', url: 'https://developer.mozilla.org', type: 'article', difficulty: 'beginner', estimatedHours: 20, qualityScore: 0.95, skills: ['HTML/CSS', 'JavaScript'] },
  { title: 'JavaScript: The Good Parts', description: 'Essential guide to JavaScript best practices and patterns', url: 'https://example.com/js-good-parts', type: 'book', difficulty: 'intermediate', estimatedHours: 15, qualityScore: 0.9, skills: ['JavaScript'] },
  { title: 'TypeScript Handbook', description: 'Official TypeScript handbook covering all language features', url: 'https://www.typescriptlang.org/docs/handbook/', type: 'article', difficulty: 'intermediate', estimatedHours: 12, qualityScore: 0.92, skills: ['TypeScript'] },
  { title: 'Python Crash Course', description: 'Hands-on project-based introduction to Python programming', url: 'https://example.com/python-crash', type: 'book', difficulty: 'beginner', estimatedHours: 25, qualityScore: 0.88, skills: ['Python'] },
  { title: 'React Official Tutorial', description: 'Interactive tutorial to learn React fundamentals with hands-on exercises', url: 'https://react.dev/learn', type: 'tutorial', difficulty: 'beginner', estimatedHours: 10, qualityScore: 0.95, skills: ['React', 'JavaScript'] },
  { title: 'Next.js Documentation', description: 'Official Next.js docs with guides and API reference', url: 'https://nextjs.org/docs', type: 'article', difficulty: 'intermediate', estimatedHours: 15, qualityScore: 0.93, skills: ['Next.js', 'React'] },
  { title: 'Node.js Official Docs', description: 'Comprehensive Node.js documentation and guides', url: 'https://nodejs.org/docs', type: 'article', difficulty: 'intermediate', estimatedHours: 12, qualityScore: 0.9, skills: ['Node.js', 'JavaScript'] },

  // Math
  { title: 'Khan Academy: Statistics', description: 'Free comprehensive statistics course with practice exercises', url: 'https://www.khanacademy.org/math/statistics-probability', type: 'course', difficulty: 'beginner', estimatedHours: 20, qualityScore: 0.9, skills: ['Statistics'] },
  { title: '3Blue1Brown: Essence of Linear Algebra', description: 'Visual, intuitive approach to linear algebra concepts', url: 'https://www.3blue1brown.com/topics/linear-algebra', type: 'video', difficulty: 'beginner', estimatedHours: 5, qualityScore: 0.97, skills: ['Linear Algebra'] },
  { title: 'Khan Academy: Calculus', description: 'Complete calculus course from basics to advanced topics', url: 'https://www.khanacademy.org/math/calculus-1', type: 'course', difficulty: 'beginner', estimatedHours: 30, qualityScore: 0.9, skills: ['Calculus'] },
  { title: 'MIT OpenCourseWare: Probability', description: 'University-level probability theory course', url: 'https://ocw.mit.edu/courses/mathematics/', type: 'course', difficulty: 'intermediate', estimatedHours: 40, qualityScore: 0.93, skills: ['Probability', 'Statistics'] },

  // AI/ML
  { title: 'Andrew Ng Machine Learning Specialization', description: 'Stanford course covering supervised and unsupervised learning', url: 'https://www.coursera.org/specializations/machine-learning-introduction', type: 'course', difficulty: 'beginner', estimatedHours: 60, qualityScore: 0.95, skills: ['Machine Learning', 'Python'] },
  { title: 'Fast.ai Practical Deep Learning', description: 'Top-down approach to deep learning with practical projects', url: 'https://course.fast.ai/', type: 'course', difficulty: 'intermediate', estimatedHours: 40, qualityScore: 0.94, skills: ['Deep Learning', 'Python'] },
  { title: 'Neural Networks and Deep Learning', description: 'Michael Nielsen free online book on neural networks', url: 'https://neuralnetworksanddeeplearning.com/', type: 'book', difficulty: 'intermediate', estimatedHours: 25, qualityScore: 0.92, skills: ['Neural Networks', 'Machine Learning'] },
  { title: 'Stanford CS231n: CNNs for Visual Recognition', description: 'Computer vision course covering convolutional neural networks', url: 'https://cs231n.stanford.edu/', type: 'course', difficulty: 'advanced', estimatedHours: 50, qualityScore: 0.96, skills: ['CNN', 'Computer Vision', 'Deep Learning'] },
  { title: 'Hugging Face NLP Course', description: 'Free course on modern NLP with Transformers', url: 'https://huggingface.co/learn/nlp-course', type: 'course', difficulty: 'intermediate', estimatedHours: 30, qualityScore: 0.94, skills: ['NLP', 'Transformers', 'Deep Learning'] },
  { title: 'Spinning Up in RL', description: 'OpenAI introduction to reinforcement learning', url: 'https://spinningup.openai.com/', type: 'tutorial', difficulty: 'advanced', estimatedHours: 35, qualityScore: 0.93, skills: ['Reinforcement Learning', 'Deep Learning'] },
  { title: 'MLOps Specialization', description: 'Coursera specialization on deploying ML systems', url: 'https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops', type: 'course', difficulty: 'intermediate', estimatedHours: 40, qualityScore: 0.91, skills: ['MLOps', 'Docker', 'CI/CD'] },
  { title: 'Learn Prompt Engineering', description: 'Comprehensive guide to crafting effective prompts for LLMs', url: 'https://learnprompting.org/', type: 'tutorial', difficulty: 'beginner', estimatedHours: 10, qualityScore: 0.9, skills: ['Prompt Engineering'] },
  { title: 'Andrej Karpathy: Neural Networks: Zero to Hero', description: 'Building neural networks from scratch in code', url: 'https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ', type: 'video', difficulty: 'intermediate', estimatedHours: 20, qualityScore: 0.97, skills: ['Neural Networks', 'Deep Learning', 'Machine Learning'] },

  // Data
  { title: 'Python for Data Analysis', description: 'Wes McKinney guide to pandas and NumPy for data analysis', url: 'https://example.com/python-data-analysis', type: 'book', difficulty: 'intermediate', estimatedHours: 20, qualityScore: 0.9, skills: ['Pandas', 'NumPy', 'Python'] },
  { title: 'Data Visualization with Matplotlib', description: 'Comprehensive guide to creating visualizations in Python', url: 'https://matplotlib.org/stable/tutorials/', type: 'tutorial', difficulty: 'beginner', estimatedHours: 10, qualityScore: 0.88, skills: ['Data Visualization', 'Python'] },

  // DevOps
  { title: 'Docker Official Getting Started', description: 'Hands-on Docker tutorial from container basics to multi-container apps', url: 'https://docs.docker.com/get-started/', type: 'tutorial', difficulty: 'beginner', estimatedHours: 10, qualityScore: 0.95, skills: ['Docker'] },
  { title: 'Kubernetes Fundamentals', description: 'Linux Foundation course on container orchestration fundamentals', url: 'https://training.linuxfoundation.org/resources/free-resources/', type: 'course', difficulty: 'intermediate', estimatedHours: 25, qualityScore: 0.91, skills: ['Kubernetes', 'Docker'] },
  { title: 'GitHub Actions Documentation', description: 'Official docs for building CI/CD pipelines with GitHub Actions', url: 'https://docs.github.com/en/actions', type: 'article', difficulty: 'beginner', estimatedHours: 8, qualityScore: 0.92, skills: ['CI/CD', 'Git'] },
  { title: 'AWS Cloud Practitioner', description: 'Foundational AWS cloud concepts and services', url: 'https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/', type: 'course', difficulty: 'beginner', estimatedHours: 15, qualityScore: 0.93, skills: ['AWS'] },
  { title: 'Terraform Up and Running', description: 'Practical guide to infrastructure as code with Terraform', url: 'https://example.com/terraform-up-and-running', type: 'book', difficulty: 'intermediate', estimatedHours: 20, qualityScore: 0.9, skills: ['Terraform', 'AWS'] },

  // Security
  { title: 'CompTIA Security+ Certification', description: 'Industry-standard cybersecurity certification preparation', url: 'https://www.comptia.org/certifications/security', type: 'course', difficulty: 'intermediate', estimatedHours: 40, qualityScore: 0.91, skills: ['Network Security', 'Cryptography'] },
  { title: 'OWASP Top 10', description: 'Most critical web application security risks and mitigations', url: 'https://owasp.org/www-project-top-ten/', type: 'article', difficulty: 'intermediate', estimatedHours: 5, qualityScore: 0.95, skills: ['Application Security'] },

  // Architecture
  { title: 'Designing Data-Intensive Applications', description: 'Martin Kleppmann guide to building reliable, scalable distributed systems', url: 'https://example.com/data-intensive-apps', type: 'book', difficulty: 'advanced', estimatedHours: 30, qualityScore: 0.97, skills: ['System Design', 'Database Design', 'Caching'] },

  // Frontend
  { title: 'Tailwind CSS Documentation', description: 'Official Tailwind CSS docs with utility class reference', url: 'https://tailwindcss.com/docs', type: 'article', difficulty: 'beginner', estimatedHours: 8, qualityScore: 0.94, skills: ['Tailwind CSS', 'HTML/CSS'] },
  { title: 'Web.dev Performance', description: 'Google resource for web performance optimization', url: 'https://web.dev/performance/', type: 'article', difficulty: 'intermediate', estimatedHours: 10, qualityScore: 0.92, skills: ['Web Performance', 'JavaScript'] },
]

async function main() {
  console.log('Seeding database...')

  // Create skills
  console.log('Creating skills...')
  const skillMap = new Map<string, string>()
  for (const s of skills) {
    const skill = await prisma.skill.upsert({
      where: { name: s.name },
      update: { category: s.category, description: s.description },
      create: s,
    })
    skillMap.set(s.name, skill.id)
  }
  console.log(`Created ${skillMap.size} skills`)

  // Create prerequisites
  console.log('Creating prerequisites...')
  let prereqCount = 0
  for (const [skillName, prereqName, importance] of prerequisites) {
    const skillId = skillMap.get(skillName)
    const prereqId = skillMap.get(prereqName)
    if (!skillId || !prereqId) {
      console.log(`Skipping prerequisite: ${skillName} -> ${prereqName} (skill not found)`)
      continue
    }
    try {
      await prisma.skillPrerequisite.upsert({
        where: { skillId_prerequisiteSkillId: { skillId, prerequisiteSkillId: prereqId } },
        update: { importance },
        create: { skillId, prerequisiteSkillId: prereqId, importance },
      })
      prereqCount++
    } catch (e) {
      console.log(`Error creating prerequisite ${skillName} -> ${prereqName}:`, e)
    }
  }
  console.log(`Created ${prereqCount} prerequisites`)

  // Create role requirements
  console.log('Creating role requirements...')
  let roleCount = 0
  for (const [role, skillName, level, importance] of roleRequirements) {
    const skillId = skillMap.get(skillName)
    if (!skillId) {
      console.log(`Skipping role requirement: ${role} - ${skillName} (skill not found)`)
      continue
    }
    try {
      await prisma.roleSkillRequirement.upsert({
        where: { targetRole_skillId: { targetRole: role, skillId } },
        update: { requiredLevel: level, importance },
        create: { targetRole: role, skillId, requiredLevel: level, importance },
      })
      roleCount++
    } catch (e) {
      console.log(`Error creating role requirement ${role} - ${skillName}:`, e)
    }
  }
  console.log(`Created ${roleCount} role requirements`)

  // Create resources
  console.log('Creating resources...')
  let resourceCount = 0
  for (const r of resources) {
    try {
      const resource = await prisma.resource.create({
        data: {
          title: r.title,
          description: r.description,
          url: r.url,
          type: r.type,
          difficulty: r.difficulty,
          estimatedHours: r.estimatedHours,
          qualityScore: r.qualityScore,
          skills: {
            create: r.skills
              .map(s => skillMap.get(s))
              .filter((id): id is string => !!id)
              .map(skillId => ({ skillId })),
          },
        },
      })
      resourceCount++
    } catch (e) {
      console.log(`Error creating resource ${r.title}:`, e)
    }
  }
  console.log(`Created ${resourceCount} resources`)

  console.log('Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
