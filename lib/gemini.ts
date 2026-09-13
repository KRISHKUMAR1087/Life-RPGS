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

  try {
    const prompt = `You are the LifeQuest RPG AI Dungeon Master. 
Evaluate this quest created by the hero and output strictly valid JSON with no markdown backticks or commentary.

Quest Title: "${cleanTitle}"
Category: "${category}"
Description (max 75 chars): "${cleanDescription}"

Assign appropriate game rewards based on physical/mental effort and consistency:
- xp: integer from 15 to 130
- gold: integer from 5 to 55
- difficulty: one of ["easy", "medium", "hard", "epic"]
- attribute: one of ["strength", "intellect", "vitality", "charisma", "dexterity"] matching the primary nature of the task
- badge: a creative 2-3 word RPG title/badge for this feat (e.g. "Iron Will", "Mind Master", "Endurance King")
- rationale: a punchy explanation under 12 words

Output JSON schema:
{
  "xp": 35,
  "gold": 15,
  "difficulty": "medium",
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
    return {
      xp: Number(parsed.xp) || 30,
      gold: Number(parsed.gold) || 15,
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
    let xp = 35;
    let gold = 15;

    if (textLen < 20) {
      difficulty = 'easy';
      xp = 20;
      gold = 10;
    } else if (textLen > 60 || /marathon|intense|master|build|exam|heavy/i.test(cleanTitle)) {
      difficulty = 'hard';
      xp = 60;
      gold = 25;
    }

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
