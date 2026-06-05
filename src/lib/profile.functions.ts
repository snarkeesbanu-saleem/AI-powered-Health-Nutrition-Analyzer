import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const profileSchema = z.object({
  username: z.string().min(2).max(50).optional(),
  age: z.number().min(1).max(120).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  weight_kg: z.number().min(1).max(300).optional(),
  height_cm: z.number().min(50).max(250).optional(),
  fitness_goal: z.enum(["lose", "maintain", "gain"]).optional(),
  activity_level: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).optional(),
  target_weight_kg: z.number().min(1).max(300).optional(),
});

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }
    return { profile: data };
  });

export const upsertProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => profileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) {
      const { data: profile, error } = await supabase
        .from("profiles")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      return { profile };
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return { profile };
  });
