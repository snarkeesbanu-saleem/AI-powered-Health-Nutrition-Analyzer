import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { getProfile } from "@/lib/profile.functions";
import { getTodaySummary } from "@/lib/nutrition.functions";
import { getWeightHistory } from "@/lib/nutrition.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import foodDosa from "@/assets/food-dosa.jpg";
import foodBiryani from "@/assets/food-biryani.jpg";
import foodIdli from "@/assets/food-idli.jpg";
import foodPongal from "@/assets/food-pongal.jpg";
import {
  Camera,
  History,
  Activity,
  Sparkles,
  Scale,
  Droplets,
  Flame,
  Beef,
  Wheat,
  Droplet,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import { useMemo } from "react";

const profileQueryOptions = queryOptions({
  queryKey: ["profile"],
  queryFn: () => getProfile(),
});

const summaryQueryOptions = queryOptions({
  queryKey: ["today-summary"],
  queryFn: () => getTodaySummary(),
});

const weightHistoryQueryOptions = queryOptions({
  queryKey: ["weight-history"],
  queryFn: () => getWeightHistory(),
});

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — NutriAI" },
      { name: "description", content: "Your personal nutrition dashboard" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(profileQueryOptions),
      context.queryClient.ensureQueryData(summaryQueryOptions),
      context.queryClient.ensureQueryData(weightHistoryQueryOptions),
    ]),
  component: DashboardPage,
});

function calculateBMI(weightKg: number | null, heightCm: number | null) {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400" };
  if (bmi < 25) return { label: "Healthy", color: "text-green-400" };
  if (bmi < 30) return { label: "Overweight", color: "text-yellow-400" };
  return { label: "Obese", color: "text-red-400" };
}

function getDailyCalorieTarget(profile: { age?: number | null; gender?: string | null; weight_kg?: number | null; height_cm?: number | null; activity_level?: string | null; fitness_goal?: string | null }) {
  const { age, gender, weight_kg, height_cm, activity_level, fitness_goal } = profile;
  if (!age || !gender || !weight_kg || !height_cm) return 2000;

  let bmr = 0;
  if (gender === "male") {
    bmr = 88.362 + 13.397 * weight_kg + 4.799 * height_cm - 5.677 * age;
  } else {
    bmr = 447.593 + 9.247 * weight_kg + 3.098 * height_cm - 4.33 * age;
  }

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const tdee = bmr * (activityMultipliers[activity_level || "moderate"] || 1.55);

  if (fitness_goal === "lose") return Math.round(tdee - 500);
  if (fitness_goal === "gain") return Math.round(tdee + 300);
  return Math.round(tdee);
}

function DashboardPage() {
  const { data: profileData } = useSuspenseQuery(profileQueryOptions);
  const { data: summaryData } = useSuspenseQuery(summaryQueryOptions);
  const { data: weightData } = useSuspenseQuery(weightHistoryQueryOptions);

  const profile = profileData?.profile;
  const summary = summaryData;
  const weightHistory = weightData?.history || [];

  const bmi = useMemo(
    () => calculateBMI(profile?.weight_kg ?? null, profile?.height_cm ?? null),
    [profile]
  );

  const calorieTarget = useMemo(() => getDailyCalorieTarget(profile || {}), [profile]);
  const caloriePercent = Math.min(100, Math.round(((summary?.totals.calories ?? 0) / calorieTarget) * 100));

  const waterTarget = 2500;
  const waterPercent = Math.min(100, Math.round(((summary?.water_ml ?? 0) / waterTarget) * 100));

  const weightTrend = useMemo(() => {
    if (weightHistory.length < 2) return "stable";
    const first = weightHistory[0].weight_kg;
    const last = weightHistory[weightHistory.length - 1].weight_kg;
    if (last < first) return "down";
    if (last > first) return "up";
    return "stable";
  }, [weightHistory]);

  const quickActions = [
    { to: "/analyze", label: "Analyze Food", icon: Camera, color: "bg-primary/10 text-primary" },
    { to: "/history", label: "View History", icon: History, color: "bg-neon-blue/10 text-neon-blue" },
    { to: "/bmi", label: "BMI Calculator", icon: Activity, color: "bg-neon-purple/10 text-neon-purple" },
    { to: "/recommendations", label: "Recommendations", icon: Sparkles, color: "bg-chart-3/10 text-chart-3" },
    { to: "/weight", label: "Track Weight", icon: Scale, color: "bg-chart-5/10 text-chart-5" },
  ];

  const popularDishes = [
    { name: "Masala Dosa", image: foodDosa, calories: 387, tag: "South Indian" },
    { name: "Chicken Biryani", image: foodBiryani, calories: 489, tag: "High protein" },
    { name: "Idli Sambar", image: foodIdli, calories: 132, tag: "Low fat" },
    { name: "Ven Pongal", image: foodPongal, calories: 286, tag: "Comfort food" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Lora', serif" }}>
          {profile?.username ? `Hello, ${profile.username}` : "Your Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your nutrition, monitor progress, and stay on top of your health goals.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Flame className="h-4 w-4 text-primary" />
              Calories Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {summary?.totals.calories ?? 0}
              <span className="text-sm font-normal text-muted-foreground"> / {calorieTarget}</span>
            </div>
            <Progress value={caloriePercent} className="mt-2 h-2" />
            <p className="mt-1 text-xs text-muted-foreground">{caloriePercent}% of daily target</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Droplets className="h-4 w-4 text-neon-blue" />
              Water Intake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {Math.round((summary?.water_ml ?? 0) / 10) / 100}
              <span className="text-sm font-normal text-muted-foreground"> L / 2.5L</span>
            </div>
            <Progress value={waterPercent} className="mt-2 h-2" />
            <p className="mt-1 text-xs text-muted-foreground">{waterPercent}% of daily goal</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Activity className="h-4 w-4 text-neon-purple" />
              BMI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {bmi ? bmi.toFixed(1) : "—"}
            </div>
            {bmi && (
              <p className={`mt-1 text-xs font-medium ${bmiCategory(bmi).color}`}>
                {bmiCategory(bmi).label}
              </p>
            )}
            {!bmi && (
              <p className="mt-1 text-xs text-muted-foreground">Set your weight & height in profile</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Scale className="h-4 w-4 text-chart-5" />
              Weight Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-2xl font-bold text-foreground">
              {profile?.weight_kg ? `${profile.weight_kg} kg` : "—"}
              {weightTrend === "down" && <TrendingDown className="h-5 w-5 text-green-400" />}
              {weightTrend === "up" && <TrendingUp className="h-5 w-5 text-red-400" />}
              {weightTrend === "stable" && <Minus className="h-5 w-5 text-muted-foreground" />}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {profile?.target_weight_kg ? `Target: ${profile.target_weight_kg} kg` : "No target set"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="border-border/50 bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base" style={{ fontFamily: "'Lora', serif" }}>
              Today's Macros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MacroItem
                icon={<Beef className="h-5 w-5" />}
                label="Protein"
                value={summary?.totals.protein ?? 0}
                unit="g"
                color="text-primary"
              />
              <MacroItem
                icon={<Wheat className="h-5 w-5" />}
                label="Carbs"
                value={summary?.totals.carbs ?? 0}
                unit="g"
                color="text-neon-blue"
              />
              <MacroItem
                icon={<Droplet className="h-5 w-5" />}
                label="Fats"
                value={summary?.totals.fats ?? 0}
                unit="g"
                color="text-neon-purple"
              />
              <MacroItem
                icon={<Flame className="h-5 w-5" />}
                label="Fiber"
                value={summary?.totals.fiber ?? 0}
                unit="g"
                color="text-chart-3"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-base" style={{ fontFamily: "'Lora', serif" }}>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 p-3 text-center transition-colors hover:bg-secondary/50"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{action.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Lora', serif" }}>
            Popular Indian Dishes
          </h2>
          <Link to="/analyze" className="text-xs font-medium text-primary hover:underline">
            Analyze a meal →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {popularDishes.map((dish) => (
            <Link
              key={dish.name}
              to="/analyze"
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-card"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={dish.image}
                  alt={dish.name}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-sm font-semibold text-foreground">{dish.name}</p>
                <p className="text-[11px] text-muted-foreground">{dish.calories} kcal · {dish.tag}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MacroItem({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border/30 bg-secondary/20 p-4">
      <div className={color}>{icon}</div>
      <div className="text-xl font-bold text-foreground">
        {value.toFixed(1)}
        <span className="text-xs font-normal text-muted-foreground"> {unit}</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
