/**
 * Persistence ICP definition — the ground truth for LLM relevance scoring.
 * Edit this to retune what the scraper considers a high-value event.
 */
export const PERSISTENCE_ICP = `
Persistence sells into the Tech & AI-native ecosystem, with a strong tilt toward voice AI.

Ideal event attendees / decision-makers (higher score the more of these show up):
- Founders & operators at tech/AI-native companies: seed-to-Series-C founders,
  Heads of Ops / CX / Support, and technical owners (CTO, VP Engineering).
- Investors: VCs & angels focused on AI, voice, and vertical SaaS.
- The voice / AI ecosystem broadly: builders working on voice agents, conversational AI, LLM apps.
- Agencies, BPOs & call-center consultants; integration & GTM partners.
- Founders building adjacent AI products.
- Community & amplifiers: AI/founder Slack & Discord groups, accelerators (YC, Antler, etc.),
  operator communities (Pavilion, RevGenius), voice-AI meetups, and vocal builders/creators
  on LinkedIn / X.

Scoring guidance:
- 85-100: directly AI / voice-AI / founder-operator events, hackathons, AI investor mixers,
  accelerator demo days, technical AI meetups.
- 60-84: broader startup / tech / SaaS / developer events likely to contain the ICP.
- 30-59: general tech-adjacent or business events with only partial overlap.
- 0-29: unrelated (consumer, arts, generic networking, non-tech).

Category must be one of: AI, tech, founder, investor, community, other.
`.trim();
