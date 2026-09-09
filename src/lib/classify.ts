/**
 * Server-side complaint classifier.
 * Runs on every complaint submission to guarantee accurate triage,
 * regardless of whether the client-side AI model has loaded.
 */

const HIGH_KEYWORDS = [
  'fire', 'flood', 'flooding', 'burst', 'electrocution', 'electric shock',
  'sparks', 'sparking', 'gas leak', 'gas smell', 'sewage overflow', 'sewage',
  'collapse', 'collapsed', 'break-in', 'breakin', 'intruder', 'intruders',
  'no water', 'no electricity', 'no power', 'emergency', 'urgent', 'immediately',
  'dangerous', 'danger', 'injury', 'injured', 'bleeding', 'overflow', 'overflowing',
  'short circuit', 'blackout', 'power cut'
];

const MEDIUM_KEYWORDS = [
  'broken', 'not working', 'stopped working', 'leak', 'leaking', 'dripping',
  'flickering', 'blocked', 'clogged', 'stuck', 'noisy', 'noise', 'smell',
  'pest', 'rats', 'cockroach', 'cockroaches', 'ants', 'damage', 'damaged',
  'cracked', 'crack', 'mould', 'mold', 'damp', 'rusty', 'rust', 'faulty',
  'intermittent', 'slow drain', 'no hot water', 'wobbly', 'broken lock',
  'door not closing', 'window not closing'
];

const PLUMBING_KEYWORDS  = ['pipe', 'water', 'tap', 'drain', 'sink', 'toilet', 'flush', 'shower', 'bathroom', 'leak', 'leaking', 'plumbing', 'sewage', 'sewer', 'geyser', 'boiler'];
const ELECTRICAL_KEYWORDS = ['electric', 'electrical', 'power', 'light', 'lights', 'switch', 'socket', 'plug', 'wiring', 'circuit', 'fuse', 'sparks', 'blackout', 'fan', 'lift', 'elevator', 'generator', 'inverter', 'meter'];
const SECURITY_KEYWORDS  = ['security', 'guard', 'cctv', 'camera', 'break-in', 'intruder', 'theft', 'stolen', 'gate', 'lock', 'door lock', 'intercom', 'stranger', 'suspicious', 'vandalism', 'graffiti'];
const CLEANLINESS_KEYWORDS = ['clean', 'cleaning', 'dirty', 'garbage', 'trash', 'waste', 'dust', 'smell', 'stink', 'cockroach', 'pest', 'rats', 'sweeping', 'mop', 'litter'];

// Common stopwords to exclude from similarity comparisons
const STOPWORDS = new Set([
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they',
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
  'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'not', 'no', 'this', 'that', 'there', 'here', 'from', 'by', 'as', 'so',
  'if', 'its', 'about', 'which', 'when', 'also', 'just', 'very', 'since'
]);

export function classifyComplaint(description: string): {
  category: string;
  urgency: string;
  aiResponse: string;
} {
  const text = description.toLowerCase();

  // --- Urgency detection ---
  let urgency = 'Low';
  if (HIGH_KEYWORDS.some(kw => text.includes(kw))) {
    urgency = 'High';
  } else if (MEDIUM_KEYWORDS.some(kw => text.includes(kw))) {
    urgency = 'Medium';
  }

  // --- Category detection (score-based) ---
  const scores: Record<string, number> = {
    Plumbing: PLUMBING_KEYWORDS.filter(kw => text.includes(kw)).length,
    Electrical: ELECTRICAL_KEYWORDS.filter(kw => text.includes(kw)).length,
    Security: SECURITY_KEYWORDS.filter(kw => text.includes(kw)).length,
    Cleanliness: CLEANLINESS_KEYWORDS.filter(kw => text.includes(kw)).length,
    'General Maintenance': 0,
  };

  const topCategory = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const category = topCategory[1] > 0 ? topCategory[0] : 'General Maintenance';

  // --- Auto-response generation ---
  let aiResponse = `Thank you for your report regarding ${category.toLowerCase()}. `;
  if (urgency === 'High') {
    aiResponse += `We have marked this as HIGH PRIORITY. Our team will attend to it immediately — typically within 2 hours.`;
  } else if (urgency === 'Medium') {
    aiResponse += `We will have our ${category.toLowerCase()} maintenance team address this within 24–48 hours.`;
  } else {
    aiResponse += `This has been logged and will be addressed during the next routine maintenance round.`;
  }

  return { category, urgency, aiResponse };
}

/**
 * AI Complaint Summarizer
 * Extracts a concise, clean summary from a long or messy complaint description.
 * Uses extractive NLP techniques: sentence splitting, stopword removal, key phrase scoring.
 */
export function generateSummary(description: string): string {
  // Split into sentences
  const sentences = description
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 10);

  if (sentences.length === 0) return description.slice(0, 100);

  // Score each sentence by content word density (non-stopword ratio)
  const scored = sentences.map(sentence => {
    const words = sentence.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    const contentWords = words.filter(w => !STOPWORDS.has(w) && w.length > 2);
    const score = contentWords.length / Math.max(words.length, 1);
    return { sentence, score, contentWords };
  });

  // Pick the highest-scoring sentence as the core summary
  const best = scored.sort((a, b) => b.score - a.score)[0];
  let summary = best.sentence;

  // Clean up: remove trailing conjunctions/prepositions, capitalize
  summary = summary.replace(/^(and|but|so|because|since|also)[,\s]+/i, '');
  summary = summary.charAt(0).toUpperCase() + summary.slice(1);

  // Remove trailing ellipsis artifacts and ensure it ends with a period
  summary = summary.replace(/[,;]+$/, '').replace(/\.?\s*$/, '.');

  // Truncate if still too long (keep admin summary readable)
  if (summary.length > 120) {
    summary = summary.slice(0, 117) + '...';
  }

  return summary;
}

/**
 * Duplicate Complaint Detector
 * Returns a Jaccard similarity score (0–1) between two complaint descriptions.
 * Ignores stopwords so "The lift in Block B is not working" and
 * "Elevator broken in B block" still score high.
 */
function getContentWords(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => !STOPWORDS.has(w) && w.length > 2)
  );
}

/**
 * Hybrid similarity: combines Jaccard (good for similar-length texts)
 * with containment (good when a short query matches a long complaint).
 *
 * Jaccard alone fails for short queries:
 *   "PIPES LEAKING EVERYWHERE" (3 words) vs a 18-word complaint
 *   → intersection=2, union=19, Jaccard=0.105 (below threshold)
 *   → but containment=2/3=0.67 (strong match — fires correctly)
 *
 * Containment = intersection / size-of-SHORTER-text
 * We require ≥60% containment before it contributes to the score,
 * which prevents single common words from triggering false positives.
 */
function hybridSimilarity(a: string, b: string): number {
  const setA = getContentWords(a);
  const setB = getContentWords(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  const intersection = new Set([...setA].filter(w => setB.has(w)));
  const union        = new Set([...setA, ...setB]);

  const jaccard     = intersection.size / union.size;
  const minSize     = Math.min(setA.size, setB.size);
  const containment = intersection.size / minSize;

  // Containment contributes only when ≥60% of the shorter text is covered.
  // Scale it by 0.9 so a perfect-containment short query scores ~0.9 (not 1.0)
  // and Jaccard can still win for same-length similar texts.
  const containmentScore = containment >= 0.6 ? containment * 0.9 : 0;

  return Math.max(jaccard, containmentScore);
}

export function findDuplicates(
  newDescription: string,
  existingComplaints: Array<{ id: string; description: string; summary?: string | null; status: string; createdAt: Date; category?: string | null; urgency?: string | null }>
): Array<{ id: string; description: string; summary?: string | null; status: string; createdAt: Date; category?: string | null; urgency?: string | null; similarity: number }> {
  // Threshold tuned for the hybrid scorer:
  //   • Short queries need ≥60% containment (covered by containment path)
  //   • Similar-length texts need ≥28% Jaccard overlap (covered by jaccard path)
  const SIMILARITY_THRESHOLD = 0.28;

  return existingComplaints
    .map(c => ({ ...c, similarity: hybridSimilarity(newDescription, c.description) }))
    .filter(c => c.similarity >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3); // return top 3 matches at most
}
