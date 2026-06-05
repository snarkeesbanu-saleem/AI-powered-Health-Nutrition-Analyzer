import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRecommendations } from "@/lib/recommendation.functions";
import { getProfile } from "@/lib/profile.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Flame, AlertTriangle, Utensils, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const recommendationsQueryOptions = queryOptions({
  queryKey: ["recommendations"],
  queryFn: () => getRecommendations(),
});

const profileQueryOptions = queryOptions({
  queryKey: ["profile"],
  queryFn: () => getProfile(),
});

export const Route = createFileRoute("/_authenticated/recommendations")({
  head: () => ({
    meta: [
      { title: "Recommendations — NutriAI" },
      { name: "description", content: "Personalized AI diet recommendations" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(recommendationsQueryOptions),
      context.queryClient.ensureQueryData(profileQueryOptions),
    ]),
  component: RecommendationsPage,
});

function RecommendationsPage() {
  const { data: recData } = useSuspenseQuery(recommendationsQueryOptions);
  const { data: profileData } = useSuspenseQuery(profileQueryOptions);
  const [refreshing, setRefreshing] = useState(false);
  const recs = recData?.recommendations;
  const profile = profileData?.profile;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await getRecommendations();
      toast.success("Recommendations refreshed!");
    } catch {
      toast.error("Failed to refresh recommendations");
    } finally {
      setRefreshing(false);
    }
  };

  const hasProfile = profile && profile.age && profile.weight_kg && profile.height_cm;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Lora', serif" }}>
            AI Recommendations
          </h1>
          <p className="text-sm text-muted-foreground">
            Personalized diet advice based on your profile and eating habits
          </p>
        </div>
      </div>

      {!hasProfile && (
        <Card className="mb-6 border-yellow-400/20 bg-yellow-400/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-foreground">Complete Your Profile</p>
              <p className="text-xs text-muted-foreground">
                Set your age, weight, height, and goals in the BMI page for more accurate recommendations.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!recs && (
        <Card className="border-border/50 bg-card">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No recommendations yet.</p>
            <p className="text-xs text-muted-foreground">Log some meals and complete your profile to get AI-powered advice.</p>
          </CardContent>
        </Card>
      )}

      {recs && (
        <div className="space-y-6">
          {recs.summary && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm leading-relaxed text-foreground">{recs.summary}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {recs.daily_targets && (
            <Card className="border-border/50 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base" style={{ fontFamily: "'Lora', serif" }}>
                  Daily Targets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <TargetItem label="Calories" value={`${recs.daily_targets.calories} kcal`} icon={<Flame className="h-4 w-4" />} />
                  <TargetItem label="Protein" value={`${recs.daily_targets.protein_g}g`} icon={<Utensils className="h-4 w-4" />} />
                  <TargetItem label="Carbs" value={`${recs.daily_targets.carbs_g}g`} />
                  <TargetItem label="Fats" value={`${recs.daily_targets.fats_g}g`} />
                  <TargetItem label="Fiber" value={`${recs.daily_targets.fiber_g}g`} />
                  <TargetItem label="Water" value={`${recs.daily_targets.water_ml}ml`} />
                </div>
              </CardContent>
            </Card>
          )}

          {recs.recommendations && recs.recommendations.length > 0 && (
            <Card className="border-border/50 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base" style={{ fontFamily: "'Lora', serif" }}>
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recs.recommendations.map((rec: any, i: number) => (
                  <div key={i} className="rounded-lg border border-border/30 bg-secondary/20 p-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                        rec.priority === "high" ? "bg-red-400/10 text-red-400" :
                        rec.priority === "medium" ? "bg-yellow-400/10 text-yellow-400" :
                        "bg-green-400/10 text-green-400"
                      }`}>
                        {rec.priority}
                      </span>
                      <span className="text-[10px] uppercase text-muted-foreground">{rec.category}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-foreground">{rec.title}</p>
                    <p className="text-xs text-muted-foreground">{rec.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {recs.meal_plan && (
            <Card className="border-border/50 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base" style={{ fontFamily: "'Lora', serif" }}>
                  Suggested Meal Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recs.meal_plan.breakfast && (
                  <MealItem label="Breakfast" value={recs.meal_plan.breakfast} />
                )}
                {recs.meal_plan.lunch && (
                  <MealItem label="Lunch" value={recs.meal_plan.lunch} />
                )}
                {recs.meal_plan.dinner && (
                  <MealItem label="Dinner" value={recs.meal_plan.dinner} />
                )}
                {recs.meal_plan.snacks && recs.meal_plan.snacks.length > 0 && (
                  <div className="rounded-lg border border-border/30 bg-secondary/20 p-3">
                    <span className="text-[10px] font-medium uppercase text-muted-foreground">Snacks</span>
                    <ul className="mt-1 list-inside list-disc text-xs text-foreground">
                      {recs.meal_plan.snacks.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {recs.healthier_alternatives && recs.healthier_alternatives.length > 0 && (
            <Card className="border-border/50 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base" style={{ fontFamily: "'Lora', serif" }}>
                  Healthier Swaps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recs.healthier_alternatives.map((alt: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-border/30 bg-secondary/20 p-3">
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Instead of: <span className="text-foreground">{alt.current}</span></p>
                      <p className="text-sm font-medium text-foreground">Try: {alt.alternative}</p>
                      <p className="text-xs text-muted-foreground">{alt.reason}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function TargetItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-secondary/20 p-2.5">
      {icon && <span className="text-primary">{icon}</span>}
      <div>
        <p className="text-xs font-medium text-foreground">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function MealItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/30 bg-secondary/20 p-3">
      <span className="text-[10px] font-medium uppercase text-muted-foreground">{label}</span>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}
