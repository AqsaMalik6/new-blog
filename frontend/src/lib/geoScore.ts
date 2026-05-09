export interface GEOCluster {
  name: string;
  icon: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface GEOAnalysis {
  citabilityIndex: number;
  contextWeight: "LOW" | "MODERATE" | "HIGH" | "VERY HIGH";
  contextWeightColor: string;
  contextWeightNote: string;
  clusters: GEOCluster[];
  optimizationRoadmap: string[];
  retrievalIntentAnchors: string[];
}

export function analyzeGEO(content: string, title: string, keywords: string[]): GEOAnalysis {
  const wordCount = content.split(/\s+/).length;
  const contentLower = content.toLowerCase();

  // --- Cluster Scores ---

  // 1. FAQ Coverage (0-10): Does it have FAQ with Q&A pairs?
  const faqHeading = contentLower.includes("frequently asked questions") || contentLower.includes("## faq");
  const qCount = (content.match(/\*\*Q:/gi) || content.match(/^Q:/gim) || []).length;
  const faqScore = faqHeading ? Math.min(10, 5 + qCount) : qCount > 0 ? 4 : 2;

  // 2. User Intent (0-10): Does the intro answer what the user wants?
  const hasDirectAnswer = contentLower.includes(" is a ") || contentLower.includes(" refers to ") || contentLower.includes(" are ");
  const hasIntro = wordCount > 200;
  const userIntentScore = hasDirectAnswer && hasIntro ? 8 : hasIntro ? 6 : 4;

  // 3. Styling / Recommendations (0-10): Lists, tips, how-to
  const bulletCount = (content.match(/^[-*]\s/gm) || []).length;
  const stylingScore = bulletCount >= 5 ? 9 : bulletCount >= 3 ? 7 : bulletCount >= 1 ? 5 : 3;

  // 4. Occasion Context (0-10): Mentions use cases or occasions
  const occasionWords = ["occasion", "event", "wedding", "casual", "formal", "summer", "winter", "party", "office", "daily"];
  const occasionCount = occasionWords.filter(w => contentLower.includes(w)).length;
  const occasionScore = Math.min(10, 5 + occasionCount);

  // 5. Expert Depth (0-10): Does it have expert insights, specific facts, data?
  const hasPrices = /rs\.?\s?\d+|pkr\s?\d+|\$\d+/i.test(content);
  const hasProductCode = /[A-Z0-9]{6,}/g.test(content);
  const hasSpecificFacts = hasPrices || hasProductCode;
  const expertScore = hasSpecificFacts ? 8 : wordCount > 1000 ? 7 : 5;

  // 6. Comparative Weight (0-10): Does it compare to alternatives?
  const compareWords = ["compared to", "vs", "versus", "better than", "alternative", "unlike", "similar to"];
  const compareCount = compareWords.filter(w => contentLower.includes(w)).length;
  const compareScore = compareCount >= 2 ? 9 : compareCount === 1 ? 7 : 5;

  // 7. RAG Compatibility (0-10): Is content chunked, structured, easy for AI to extract?
  const h2Count = (content.match(/^## /gm) || []).length;
  const ragScore = h2Count >= 4 ? 9 : h2Count >= 2 ? 7 : h2Count >= 1 ? 5 : 3;

  // 8. Contextual Grounding (0-10): Real-world details, brand mentions
  const brandKeywords = keywords.slice(0, 3);
  const brandMentions = brandKeywords.reduce((acc, kw) => acc + (contentLower.split(kw.toLowerCase()).length - 1), 0);
  const groundingScore = Math.min(10, 4 + brandMentions);

  // 9. Entity Linking (0-10): Named entities clearly defined
  const entityPatterns = [" is a ", " is the ", " refers to ", " defined as ", " known as "];
  const entityCount = entityPatterns.reduce((acc, p) => acc + (contentLower.split(p).length - 1), 0);
  const entityScore = Math.min(10, 4 + entityCount * 2);

  const clusters: GEOCluster[] = [
    { name: "FAQ Coverage", icon: "❓", score: faqScore, maxScore: 10, description: faqScore >= 8 ? "FAQ section is comprehensive and well-structured." : "FAQ section present but could use more targeted questions." },
    { name: "User Intent", icon: "🎯", score: userIntentScore, maxScore: 10, description: userIntentScore >= 8 ? "Blog addresses user intent clearly." : "Content addresses user intent but some sections could be more direct." },
    { name: "Styling Recs", icon: "✨", score: stylingScore, maxScore: 10, description: stylingScore >= 8 ? "Styling recommendations are clear and visual." : "More specific styling examples with product images would help." },
    { name: "Occasion Context", icon: "🎀", score: occasionScore, maxScore: 10, description: occasionScore >= 8 ? "Covers occasions well." : "Could be more specific about formal event types." },
    { name: "Expert Depth", icon: "⚖️", score: expertScore, maxScore: 10, description: expertScore >= 8 ? "Expert insights and specific facts are prominent." : "Include more specific product details and expert insights." },
    { name: "Comparative Weight", icon: "🔮", score: compareScore, maxScore: 10, description: compareScore >= 8 ? "Strong comparisons to alternatives." : "Comparison to standard options could be more detailed." },
    { name: "RAG Compatibility", icon: "💬", score: ragScore, maxScore: 10, description: ragScore >= 8 ? "Content is well-chunked for AI retrieval." : "Breaking content into more sections improves AI extraction." },
    { name: "Contextual Grounding", icon: "🌐", score: groundingScore, maxScore: 10, description: groundingScore >= 8 ? "Real-world context is strong." : "Could be more specific and detailed with brand context." },
    { name: "Entity Linking", icon: "🔗", score: entityScore, maxScore: 10, description: entityScore >= 8 ? "Entity relationships are clear." : "Entity definitions could be more prominent throughout." },
  ];

  const totalScore = clusters.reduce((acc, c) => acc + c.score, 0);
  const maxTotal = clusters.reduce((acc, c) => acc + c.maxScore, 0);
  const citabilityIndex = Math.round((totalScore / maxTotal) * 100);

  let contextWeight: GEOAnalysis["contextWeight"];
  let contextWeightColor: string;
  let contextWeightNote: string;

  if (citabilityIndex >= 80) {
    contextWeight = "HIGH";
    contextWeightColor = "#22c55e";
    contextWeightNote = "Content is highly citable by AI engines with strong factual grounding.";
  } else if (citabilityIndex >= 65) {
    contextWeight = "MODERATE";
    contextWeightColor = "#eab308";
    contextWeightNote = "Content is primarily promotional and may be considered citable, but could benefit from more expert insights and factual information.";
  } else if (citabilityIndex >= 50) {
    contextWeight = "LOW";
    contextWeightColor = "#f97316";
    contextWeightNote = "Content needs significant improvement to be cited by AI engines.";
  } else {
    contextWeight = "LOW";
    contextWeightColor = "#ef4444";
    contextWeightNote = "Content is unlikely to be cited by AI engines without major restructuring.";
  }

  // Generate optimization roadmap from failing clusters
  const roadmap: string[] = [];
  const sortedClusters = [...clusters].sort((a, b) => a.score - b.score);
  sortedClusters.slice(0, 5).forEach(c => {
    if (c.score < 8) {
      roadmap.push(c.description);
    }
  });

  // Retrieval intent anchors = top keywords
  const retrievalIntentAnchors = keywords.slice(0, 5);

  return {
    citabilityIndex,
    contextWeight,
    contextWeightColor,
    contextWeightNote,
    clusters,
    optimizationRoadmap: roadmap,
    retrievalIntentAnchors,
  };
}
