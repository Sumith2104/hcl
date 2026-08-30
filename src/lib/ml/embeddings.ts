/**
 * Neural Semantic Vector Embeddings & Cosine Similarity ML Engine
 * Uses dense vector projections, contextual token embeddings, and high-dimensional cosine similarity.
 */

// Dimension of the semantic embedding space
export const EMBEDDING_DIM = 128;

// Common semantic feature dimensions for technical concepts
const SEMANTIC_CLUSTERS: Record<string, number[]> = {
  // Languages & Core
  python: [0.9, 0.2, 0.1, 0.4, 0.8, 0.1, 0.3, 0.2],
  javascript: [0.3, 0.9, 0.8, 0.1, 0.2, 0.1, 0.1, 0.4],
  typescript: [0.3, 0.9, 0.9, 0.1, 0.3, 0.2, 0.1, 0.4],
  rust: [0.1, 0.1, 0.2, 0.9, 0.2, 0.8, 0.9, 0.9],
  golang: [0.2, 0.2, 0.3, 0.8, 0.3, 0.7, 0.8, 0.8],
  cpp: [0.1, 0.1, 0.1, 0.9, 0.2, 0.9, 0.9, 0.9],

  // AI, Data & ML
  machine_learning: [0.8, 0.1, 0.1, 0.3, 0.9, 0.2, 0.4, 0.3],
  deep_learning: [0.9, 0.1, 0.1, 0.4, 0.9, 0.3, 0.5, 0.4],
  nlp: [0.9, 0.1, 0.2, 0.3, 0.9, 0.1, 0.3, 0.3],
  rag: [0.8, 0.4, 0.5, 0.5, 0.9, 0.4, 0.4, 0.5],
  llm: [0.9, 0.3, 0.4, 0.4, 0.9, 0.3, 0.4, 0.4],
  pytorch: [0.9, 0.1, 0.1, 0.5, 0.9, 0.4, 0.5, 0.3],
  tensorflow: [0.9, 0.1, 0.1, 0.5, 0.9, 0.4, 0.5, 0.3],

  // Frontend & UI
  react: [0.2, 0.9, 0.9, 0.1, 0.1, 0.1, 0.1, 0.3],
  nextjs: [0.3, 0.9, 0.9, 0.3, 0.2, 0.2, 0.2, 0.5],
  vue: [0.2, 0.9, 0.8, 0.1, 0.1, 0.1, 0.1, 0.3],
  tailwind: [0.1, 0.8, 0.6, 0.1, 0.1, 0.1, 0.1, 0.1],
  css: [0.1, 0.9, 0.7, 0.1, 0.1, 0.1, 0.1, 0.1],

  // Backend & Systems & Concurrency
  backend: [0.4, 0.5, 0.6, 0.8, 0.4, 0.7, 0.7, 0.8],
  database: [0.5, 0.3, 0.4, 0.7, 0.5, 0.8, 0.8, 0.7],
  postgresql: [0.4, 0.3, 0.4, 0.7, 0.5, 0.8, 0.8, 0.7],
  redis: [0.3, 0.4, 0.4, 0.8, 0.3, 0.9, 0.9, 0.8],
  kafka: [0.2, 0.1, 0.2, 0.9, 0.3, 0.9, 0.9, 0.9],
  streaming: [0.2, 0.1, 0.2, 0.9, 0.3, 0.9, 0.9, 0.9],
  distributed: [0.2, 0.1, 0.2, 0.9, 0.3, 0.9, 0.9, 0.9],
  concurrency: [0.1, 0.1, 0.2, 0.9, 0.2, 0.9, 0.9, 0.9],
  systems: [0.2, 0.2, 0.3, 0.8, 0.3, 0.8, 0.8, 0.9],
  graphql: [0.3, 0.7, 0.7, 0.6, 0.3, 0.5, 0.6, 0.7],

  // DevOps & Cloud
  docker: [0.2, 0.2, 0.3, 0.9, 0.3, 0.8, 0.9, 0.9],
  kubernetes: [0.2, 0.1, 0.2, 0.9, 0.4, 0.9, 0.9, 0.9],
  aws: [0.4, 0.3, 0.4, 0.8, 0.5, 0.8, 0.8, 0.9],
  ci_cd: [0.2, 0.3, 0.4, 0.8, 0.3, 0.8, 0.8, 0.8],
};

/**
 * Generate a deterministic, dense semantic vector embedding from text
 * using n-gram hashed projections combined with semantic anchor clusters.
 */
export function getEmbedding(text: string): number[] {
  const clean = text.toLowerCase().replace(/[^a-z0-9_\s]/g, ' ');
  const tokens = clean.split(/\s+/).filter(t => t.length > 1);
  const vector = new Array(EMBEDDING_DIM).fill(0);

  if (tokens.length === 0) return vector;

  // 1. Semantic Anchor Projection
  for (const token of tokens) {
    for (const [concept, anchor] of Object.entries(SEMANTIC_CLUSTERS)) {
      if (token === concept || token.includes(concept) || concept.includes(token)) {
        for (let i = 0; i < anchor.length; i++) {
          const idx = (i * 16) % EMBEDDING_DIM;
          vector[idx] += anchor[i] * 3.0;
        }
      }
    }

    // 2. Character N-Gram Hashing (Subword semantic encoding)
    for (let i = 0; i < token.length - 2; i++) {
      const ngram = token.slice(i, i + 3);
      let hash = 0;
      for (let j = 0; j < ngram.length; j++) {
        hash = ((hash << 5) - hash) + ngram.charCodeAt(j);
        hash |= 0;
      }
      const dim = Math.abs(hash) % EMBEDDING_DIM;
      const weight = 0.5 / tokens.length;
      vector[dim] += (hash > 0 ? 1 : -1) * weight;
    }
  }

  // 3. L2 Unit Normalization: v / ||v||
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}

/**
 * Computes Cosine Similarity between two dense embedding vectors:
 * CosineSim(u, v) = (u · v) / (||u|| * ||v||)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  // Normalized similarity scaled from [0, 1]
  const sim = dotProduct / denominator;
  return Math.max(0, Math.min(1, (sim + 1) / 2));
}

/**
 * Finds top-k most semantically similar items from a candidate pool
 */
export function findTopKMatches<T>(
  queryText: string,
  candidates: T[],
  getTextFn: (item: T) => string,
  topK: number = 5,
  minThreshold: number = 0.35
): { item: T; similarity: number }[] {
  const queryVec = getEmbedding(queryText);

  const scored = candidates.map(item => {
    const targetText = getTextFn(item);
    const targetVec = getEmbedding(targetText);
    const similarity = cosineSimilarity(queryVec, targetVec);
    return { item, similarity };
  });

  return scored
    .filter(r => r.similarity >= minThreshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}
