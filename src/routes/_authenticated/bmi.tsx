import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile, upsertProfile } from "@/lib/profile.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Ruler, Weight, Target, Info } from "lucide-react";
import { toast } from "sonner";

const profileQueryOptions = queryOptions({
  queryKey: ["profile"],
  queryFn: () => getProfile(),
});

export const Route = createFileRoute("/_authenticated/bmi")({
  head: () => ({
    meta: [
      { title: "BMI Calculator — NutriAI" },
      { name: "description", content: "Calculate and track your BMI" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQueryOptions),
  component: BMIPage,
});

function calculateBMI(weightKg: number, heightCm: number) {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function bmiInfo(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400", bg: "bg-blue-400/10", range: "< 18.5" };
  if (bmi < 25) return { label: "Healthy Weight", color: "text-green-400", bg: "bg-green-400/10", range: "18.5 - 24.9" };
  if (bmi < 30) return { label: "Overweight", color: "text-yellow-400", bg: "bg-yellow-400/10", range: "25 - 29.9" };
  return { label: "Obese", color: "text-red-400", bg: "bg-red-400/10", range: "30+" };
}

function idealWeightRange(heightCm: number) {
  const heightM = heightCm / 100;
  const min = 18.5 * heightM * heightM;
  const max = 24.9 * heightM * heightM;
  return { min: min.toFixed(1), max: max.toFixed(1) };
}

function BMIPage() {
  const { data: profileData } = useSuspenseQuery(profileQueryOptions);
  const profile = profileData?.profile;
  const upsertProfileFn = useServerFn(upsertProfile);

  const [weight, setWeight] = useState(profile?.weight_kg?.toString() || "");
  const [height, setHeight] = useState(profile?.height_cm?.toString() || "");
  const [age, setAge] = useState(profile?.age?.toString() || "");
  const [gender, setGender] = useState(profile?.gender || "male");
  const [goal, setGoal] = useState(profile?.fitness_goal || "maintain");
  const [targetWeight, setTargetWeight] = useState(profile?.target_weight_kg?.toString() || "");
  const [saving, setSaving] = useState(false);

  const bmi = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h || h <= 0) return null;
    return calculateBMI(w, h);
  }, [weight, height]);

  const info = bmi ? bmiInfo(bmi) : null;
  const ideal = height ? idealWeightRange(parseFloat(height)) : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertProfileFn({
        data: {
          weight_kg: weight ? parseFloat(weight) : undefined,
          height_cm: height ? parseFloat(height) : undefined,
          age: age ? parseInt(age) : undefined,
          gender: gender as "male" | "female" | "other",
          fitness_goal: goal as "lose" | "maintain" | "gain",
          target_weight_kg: targetWeight ? parseFloat(targetWeight) : undefined,
        },
      });
      toast.success("Profile updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Lora', serif" }}>
          BMI & Health Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Calculate your BMI and set your health goals.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-sm">Weight (kg)</Label>
          <div className="relative">
            <Weight className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={weight} onChange={(e) => setWeight(e.target.value)} type="number" placeholder="70" className="pl-9" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Height (cm)</Label>
          <div className="relative">
            <Ruler className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={height} onChange={(e) => setHeight(e.target.value)} type="number" placeholder="170" className="pl-9" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Age</Label>
          <Input value={age} onChange={(e) => setAge(e.target.value)} type="number" placeholder="25" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Gender</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Fitness Goal</Label>
          <Select value={goal} onValueChange={setGoal}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="lose">Lose Weight</SelectItem>
              <SelectItem value="maintain">Maintain Weight</SelectItem>
              <SelectItem value="gain">Gain Weight</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Target Weight (kg)</Label>
          <div className="relative">
            <Target className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} type="number" placeholder="65" className="pl-9" />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="mt-4">
        {saving ? "Saving..." : "Save Profile"}
      </Button>

      {bmi && info && (
        <Card className="mt-6 border-border/50 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: "'Lora', serif" }}>
              <Activity className="h-5 w-5 text-primary" />
              Your BMI Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`flex h-20 w-20 flex-col items-center justify-center rounded-2xl ${info.bg}`}>
                <span className="text-2xl font-bold text-foreground">{bmi.toFixed(1)}</span>
              </div>
              <div>
                <p className={`text-lg font-bold ${info.color}`}>{info.label}</p>
                <p className="text-xs text-muted-foreground">BMI Range: {info.range}</p>
              </div>
            </div>

            {ideal && (
              <div className="rounded-lg bg-secondary/20 p-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Ideal Weight Range</span>
                </div>
                <p className="mt-1 text-sm text-foreground">
                  For your height, a healthy weight is between {ideal.min} kg and {ideal.max} kg
                </p>
              </div>
            )}

            {targetWeight && parseFloat(targetWeight) > 0 && (
              <div className="rounded-lg bg-secondary/20 p-3">
                <p className="text-xs font-medium text-muted-foreground">Your Target</p>
                <p className="text-sm text-foreground">
                  Target weight: {targetWeight} kg
                  {weight && (
                    <span className="text-muted-foreground">
                      {" "}(
                      {Math.abs(parseFloat(targetWeight) - parseFloat(weight)).toFixed(1)} kg{" "}
                      {parseFloat(targetWeight) < parseFloat(weight) ? "to lose" : "to gain"})
                    </span>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
