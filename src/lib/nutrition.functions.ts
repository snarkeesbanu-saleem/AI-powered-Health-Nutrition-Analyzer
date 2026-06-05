import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getTodaySummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().split("T")[0];

    const { data: foodLogs } = await supabase
      .from("food_logs")
      .select("calories, protein, carbs, fats, fiber, sugar, sodium")
      .eq("user_id", userId)
      .eq("logged_at", today);

    const { data: waterLogs } = await supabase
      .from("water_intake")
      .select("amount_ml")
      .eq("user_id", userId)
      .eq("logged_at", today);

    const { data: weightEntry } = await supabase
      .from("weight_history")
      .select("weight_kg")
      .eq("user_id", userId)
      .eq("logged_at", today)
      .maybeSingle();

    const totals = (foodLogs || []).reduce(
      (acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (log.protein || 0),
        carbs: acc.carbs + (log.carbs || 0),
        fats: acc.fats + (log.fats || 0),
        fiber: acc.fiber + (log.fiber || 0),
        sugar: acc.sugar + (log.sugar || 0),
        sodium: acc.sodium + (log.sodium || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, sodium: 0 }
    );

    const waterTotal = (waterLogs || []).reduce((sum, w) => sum + (w.amount_ml || 0), 0);

    return { totals, water_ml: waterTotal, weight_kg: weightEntry?.weight_kg ?? null };
  });

export const getFoodLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number; offset?: number }) =>
    z.object({ limit: z.number().optional(), offset: z.number().optional() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: logs, error } = await supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (error) throw error;
    return { logs: logs || [] };
  });

const foodLogSchema = z.object({
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  food_name: z.string().min(1),
  image_url: z.string().optional(),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fats: z.number().min(0),
  fiber: z.number().min(0).optional(),
  sugar: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  vitamins: z.record(z.string(), z.number()).optional(),
  minerals: z.record(z.string(), z.number()).optional(),
  notes: z.string().optional(),
});

export const addFoodLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => foodLogSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: log, error } = await supabase
      .from("food_logs")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return { log };
  });

export const deleteFoodLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("food_logs")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
    return { success: true };
  });

export const addWaterIntake = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { amount_ml: number }) =>
    z.object({ amount_ml: z.number().min(1).max(5000) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: entry, error } = await supabase
      .from("water_intake")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return { entry };
  });

export const addWeightEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { weight_kg: number }) =>
    z.object({ weight_kg: z.number().min(1).max(300) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: entry, error } = await supabase
      .from("weight_history")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return { entry };
  });

export const getWeightHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("weight_history")
      .select("weight_kg, logged_at, created_at")
      .eq("user_id", userId)
      .order("logged_at", { ascending: true });
    if (error) throw error;
    return { history: data || [] };
  });
