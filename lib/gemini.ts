// Gemini 3.6 Flash AI Quest Evaluation Engine for LifeQuest RPG

export type AIEvaluationResult = {
  xp: number;
  gold: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'epic';
  attribute: 'strength' | 'intellect' | 'vitality' | 'charisma' | 'dexterity';
  badge: string;
  rationale: string;
};

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  '';

export async function evaluateQuestAI(
  title: string,
  category: string = 'strength',
  description: string = ''
): Promise<AIEvaluationResult> {
  // Enforce 75 character limit on description
  const cleanDescription = description.trim().slice(0, 75);
  const cleanTitle = title.trim();

  // If in browser, invoke our Next.js edge API route to keep GEMINI_API_KEY secure on server
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/ai-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cleanTitle,
          category,
          description: cleanDescription,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json && typeof json.xp === 'number') {
          return json as AIEvaluationResult;
        }
      }
    } catch (e) {
      console.warn('Failed calling /api/ai-evaluate from client, trying fallback...', e);
    }
  }

  try {
    const prompt = `You are the LifeQuest RPG AI Dungeon Master. 
Evaluate this quest created by the hero and output strictly valid JSON with no markdown backticks or commentary.

Quest Title: "${cleanTitle}"
Category: "${category}"
Description (max 75 chars): "${cleanDescription}"

Assign appropriate game rewards based on physical/mental effort and consistency:
- xp: integer from 15 to 130
- gold: calculate exactly as floor(xp / 50) with a minimum of 1 (1 gold per 50 XP crossed)
- difficulty: one of ["easy", "medium", "hard", "epic"]
- attribute: one of ["strength", "intellect", "vitality", "charisma", "dexterity"] matching the primary nature of the task
- badge: a creative 2-3 word RPG title/badge for this feat (e.g. "Iron Will", "Mind Master", "Endurance King")
- rationale: a punchy explanation under 12 words

Output JSON schema:
{
  "xp": 50,
  "gold": 1,
  "difficulty": "easy",
  "attribute": "strength",
  "badge": "Morning Warrior",
  "rationale": "Solid morning momentum builder."
}`;

    // Call official Gemini API model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) throw new Error('No candidate content from Gemini');

    const parsed: AIEvaluationResult = JSON.parse(candidate.trim());
    const finalXp = Number(parsed.xp) || 30;
    // 1 gold per 50 XP crossed
    const calculatedGold = Math.max(1, Math.floor(finalXp / 50));

    return {
      xp: finalXp,
      gold: calculatedGold,
      difficulty: (['easy', 'medium', 'hard', 'epic'].includes(parsed.difficulty)
        ? parsed.difficulty
        : 'medium') as 'easy' | 'medium' | 'hard' | 'epic',
      attribute: (['strength', 'intellect', 'vitality', 'charisma', 'dexterity'].includes(
        parsed.attribute
      )
        ? parsed.attribute
        : category) as 'strength' | 'intellect' | 'vitality' | 'charisma' | 'dexterity',
      badge: parsed.badge || 'Hero Task',
      rationale: parsed.rationale || 'AI calibrated reward based on task effort.',
    };
  } catch (error) {
    console.warn('Gemini AI evaluation fallback:', error);
    // Intelligent heuristic fallback
    const textLen = (cleanTitle + ' ' + cleanDescription).length;
    let difficulty: 'easy' | 'medium' | 'hard' | 'epic' = 'medium';
    let xp = 50;

    if (textLen < 20) {
      difficulty = 'easy';
      xp = 35;
    } else if (textLen > 60 || /marathon|intense|master|build|exam|heavy/i.test(cleanTitle)) {
      difficulty = 'hard';
      xp = 100;
    }

    const gold = Math.max(1, Math.floor(xp / 50));

    return {
      xp,
      gold,
      difficulty,
      attribute: (category as any) || 'strength',
      badge: 'Challenger',
      rationale: 'Calibrated RPG reward for quest effort.',
    };
  }
}
