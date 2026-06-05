import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const analyzeSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().default("image/jpeg"),
});

export const analyzeFoodImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => analyzeSchema.parse(input))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert nutritionist specializing in Indian and South Indian cuisine. Analyze the food image and return ONLY a valid JSON object with no markdown formatting, no code blocks, and no extra text.

The JSON must have this exact structure:
{
  "food_name": "Name of the dish (be specific, e.g., 'Masala Dosa', 'Chicken Biryani', 'Idli Sambar')",
  "confidence": 0.0-1.0,
  "cuisine_type": "indian_north|indian_south|indian_west|indian_east|fusion|other",
  "serving_size": "description like '1 plate (2 dosas)" or '1 bowl (~300g)'",
  "nutrition_per_serving": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fats_g": number,
    "fiber_g": number,
    "sugar_g": number,
    "sodium_mg": number
  },
  "micronutrients": {
    "iron_mg": number,
    "calcium_mg": number,
    "vitamin_c_mg": number,
    "vitamin_a_mcg": number
  },
  "health_tags": ["high_protein", "low_carb", "vegetarian", "spicy", etc.],
  "ingredients": ["ingredient 1", "ingredient 2"],
  "description": "Brief 1-2 sentence description of the dish and its nutritional profile"
}

Important notes:
- Focus on accurately identifying Indian and South Indian dishes (Idli, Dosa, Biryani, Pongal, Appam, Paratha, Dal, Rajma, Sambar, Rasam, etc.)
- Provide realistic nutrition values based on standard serving sizes
- If the dish is unclear, make your best guess and set confidence below 0.7
- Return ONLY the JSON, no other text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this food image and return the nutrition information as JSON." },
              { type: "image_url", image_url: { url: `data:${data.mimeType};base64,${data.imageBase64}` } },
            ],
          },
        ],
        max_tokens: 2048,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI gateway error: ${response.status} - ${text}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    // Try to extract JSON from the response
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      const match = jsonStr.match(/```(?:json)?\n?([\s\S]*?)```/);
      if (match) jsonStr = match[1].trim();
    }

    try {
      const analysis = JSON.parse(jsonStr);
      return { analysis };
    } catch {
      // Fallback: try to find JSON object in the text
      const braceStart = jsonStr.indexOf("{");
      const braceEnd = jsonStr.lastIndexOf("}");
      if (braceStart >= 0 && braceEnd > braceStart) {
        const analysis = JSON.parse(jsonStr.slice(braceStart, braceEnd + 1));
        return { analysis };
      }
      throw new Error("Could not parse AI response as JSON");
    }
  });
