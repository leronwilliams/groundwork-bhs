/**
 * Semantic cache layer for the Groundwork AI Advisor.
 * Uses OpenAI text-embedding-3-small to embed questions,
 * then performs cosine similarity search against AdvisorCache.
 * 
 * Cache hit (similarity >= 0.92): return cached answer instantly — no Claude call
 * Cache miss: call Claude, stream response, then store embedding + answer
 * 
 * Cost: text-embedding-3-small = $0.02/million tokens → negligible
 */

import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000), // safety trim
  })
  return response.data[0].embedding
}

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Search the AdvisorCache for a semantically similar question.
 * Returns the cached answer if similarity >= threshold.
 */
export async function findSimilarQuestion(
  embedding: number[],
  threshold = 0.92
): Promise<{ id: string; answer: string; hitCount: number } | null> {
  try {
    const { prisma } = await import('@/lib/db')

    // Load all cached entries (practical for small cache; can be optimized with pgvector later)
    const entries = await prisma.advisorCache.findMany({
      select: { id: true, answer: true, hitCount: true, embedding: true },
      orderBy: { hitCount: 'desc' },
      take: 500,
    })

    let bestMatch: { id: string; answer: string; hitCount: number } | null = null
    let bestScore = 0

    for (const entry of entries) {
      if (!entry.embedding) continue
      let storedEmbedding: number[]
      try {
        storedEmbedding = typeof entry.embedding === 'string'
          ? JSON.parse(entry.embedding)
          : entry.embedding as number[]
      } catch {
        continue
      }
      const score = cosineSimilarity(embedding, storedEmbedding)
      if (score > bestScore && score >= threshold) {
        bestScore = score
        bestMatch = { id: entry.id, answer: entry.answer, hitCount: entry.hitCount }
      }
    }

    return bestMatch
  } catch (err) {
    console.error('Embedding search error:', err)
    return null
  }
}

/**
 * Store a question/answer pair with its embedding in AdvisorCache.
 */
export async function cacheAnswer(
  question: string,
  answer: string,
  embedding: number[],
  category?: string
): Promise<void> {
  try {
    const { prisma } = await import('@/lib/db')
    await prisma.advisorCache.create({
      data: {
        question,
        answer,
        embedding: JSON.stringify(embedding),
        category: category || null,
      },
    })
  } catch (err) {
    console.error('Cache store error:', err)
  }
}

/**
 * Increment hit count for a cached entry and update lastHitAt.
 */
export async function incrementCacheHit(id: string): Promise<void> {
  try {
    const { prisma } = await import('@/lib/db')
    await prisma.advisorCache.update({
      where: { id },
      data: {
        hitCount: { increment: 1 },
        lastHitAt: new Date(),
      },
    })
  } catch {
    // Non-critical
  }
}
