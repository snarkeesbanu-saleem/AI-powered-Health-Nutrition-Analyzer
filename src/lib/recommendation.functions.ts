import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    const today = new Date().toISOString().split("T")[0];
    const { data: foodLogs } = await supabase
      .from("food_logs")
      .select("food_name, calories, protein, carbs, fats, logged_at")
      .eq("user_id", userId)
      .gte("logged_at", new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0])
      .order("logged_at", { ascending: false })
      .limit(20);

    const { data: weightHistory } = await supabase
      .from("weight_history")
      .select("weight_kg, logged_at")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(7);

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `You are an expert Indian nutritionist and dietician. Based on the user's profile and recent eating habits, provide personalized dietary recommendations.

User Profile:
${profile ? JSON.stringify({
  age: profile.age,
  gender: profile.gender,
  weight_kg: profile.weight_kg,
  height_cm: profile.height_cm,
  fitness_goal: profile.fitness_goal,
  activity_level: profile.activity_level,
  target_weight_kg: profile.target_weight_kg,
}) : "No profile set yet"}

Recent Food Log (last 7 days, up to 20 entries):
${JSON.stringify(foodLogs || [])}

Recent Weight History (last 7 entries):
${JSON.stringify(weightHistory || [])}

Provide a JSON response with this exact structure:
{
  "summary": "2-3 sentence overview of the user's current diet and progress",
  "daily_targets": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fats_g": number,
    "fiber_g": number,
    "water_ml": number
  },
  "recommendations": [
    {
      "category": "meal_plan|habit|substitution|exercise",
      "title": "Short title",
      "description": "Detailed recommendation with specific Indian/South Indian food suggestions",
      "priority": "high|medium|low"
    }
  ],
  "meal_plan": {
    "breakfast": "Suggested breakfast with Indian options",
    "lunch": "Suggested lunch with Indian options",
    "dinner": "Suggested dinner with Indian options",
    "snacks": ["snack 1", "snack 2"]
  },
  "healthier_alternatives": [
    {
      "current": "Common unhealthy choice",
      "alternative": "Healthier Indian alternative",
      "reason": "Why this is better"
    }
  ]
}

Return ONLY valid JSON, no markdown, no extra text. Focus on practical, culturally relevant Indian and South Indian food recommendations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a nutrition expert. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        max_tokens: 2048,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI gateway error: ${response.status} - ${text}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      const match = jsonStr.match(/```(?:json)?\n?([\s\S]*?)```/);
      if (match) jsonStr = match[1].trim();
    }

    try {
      const recommendations = JSON.parse(jsonStr);
      return { recommendations };
    } catch {
      const braceStart = jsonStr.indexOf("{");
      const braceEnd = jsonStr.lastIndexOf("}");
      if (braceStart >= 0 && braceEnd > braceStart) {
        const recommendations = JSON.parse(jsonStr.slice(braceStart, braceEnd + 1));
        return { recommendations };
      }
      throw new Error("Could not parse AI recommendation response");
    }
  });
