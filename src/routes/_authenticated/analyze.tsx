import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeFoodImage } from "@/lib/food-analysis.functions";
import { addFoodLog } from "@/lib/nutrition.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, Loader2, CheckCircle2, Flame, Beef, Wheat, Droplet, Leaf, Candy, Info } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze Food — NutriAI" },
      { name: "description", content: "Upload a food photo for AI nutrition analysis" },
    ],
  }),
  component: AnalyzePage,
});

function AnalyzePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const analyzeFn = useServerFn(analyzeFoodImage);
  const addFoodLogFn = useServerFn(addFoodLog);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setAnalysis(null);
    setSaved(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
    });
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setAnalysis(null);
    setSaved(false);

    try {
      const base64 = await fileToBase64(selectedFile);
      const result = await analyzeFn({
        data: { imageBase64: base64, mimeType: selectedFile.type },
      });
      setAnalysis(result.analysis);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      await addFoodLogFn({
        data: {
          meal_type: "snack",
          food_name: analysis.food_name || "Unknown food",
          calories: Math.round(analysis.nutrition_per_serving?.calories || 0),
          protein: analysis.nutrition_per_serving?.protein_g || 0,
          carbs: analysis.nutrition_per_serving?.carbs_g || 0,
          fats: analysis.nutrition_per_serving?.fats_g || 0,
          fiber: analysis.nutrition_per_serving?.fiber_g || 0,
          sugar: analysis.nutrition_per_serving?.sugar_g || 0,
          sodium: analysis.nutrition_per_serving?.sodium_mg || 0,
          vitamins: analysis.micronutrients || {},
          notes: analysis.description || "",
        },
      });
      setSaved(true);
      toast.success("Food entry saved to your log!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const reset = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setAnalysis(null);
    setSaved(false);
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Lora', serif" }}>
          Analyze Your Meal
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload a photo and our AI will identify the dish and break down its nutrition.
        </p>
      </div>

      <Card className="border-border/50 bg-card">
        <CardContent className="p-6">
          {!preview ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Take a photo or upload an image of your food
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button asChild>
                  <span className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Choose Image
                  </span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-xl">
                <img src={preview} alt="Food preview" className="w-full max-h-80 object-cover rounded-xl" />
              </div>

              {!analysis && !analyzing && (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleAnalyze} className="gap-2">
                    <SparklesIcon className="h-4 w-4" />
                    Analyze with AI
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    Choose Different Image
                  </Button>
                </div>
              )}

              {analyzing && (
                <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Analyzing your meal with AI...</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <div className="mt-6 space-y-4">
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg" style={{ fontFamily: "'Lora', serif" }}>
                  {analysis.food_name}
                </CardTitle>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {Math.round((analysis.confidence || 0) * 100)}% confidence
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{analysis.description}</p>
              {analysis.cuisine_type && (
                <span className="inline-block rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                  {analysis.cuisine_type.replace("_", " ")}
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <NutrientBox icon={<Flame className="h-4 w-4" />} label="Calories" value={`${Math.round(analysis.nutrition_per_serving?.calories || 0)}`} unit="kcal" color="text-primary" />
                <NutrientBox icon={<Beef className="h-4 w-4" />} label="Protein" value={`${(analysis.nutrition_per_serving?.protein_g || 0).toFixed(1)}`} unit="g" color="text-neon-blue" />
                <NutrientBox icon={<Wheat className="h-4 w-4" />} label="Carbs" value={`${(analysis.nutrition_per_serving?.carbs_g || 0).toFixed(1)}`} unit="g" color="text-neon-purple" />
                <NutrientBox icon={<Droplet className="h-4 w-4" />} label="Fats" value={`${(analysis.nutrition_per_serving?.fats_g || 0).toFixed(1)}`} unit="g" color="text-chart-3" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <NutrientBox icon={<Leaf className="h-4 w-4" />} label="Fiber" value={`${(analysis.nutrition_per_serving?.fiber_g || 0).toFixed(1)}`} unit="g" color="text-green-400" />
                <NutrientBox icon={<Candy className="h-4 w-4" />} label="Sugar" value={`${(analysis.nutrition_per_serving?.sugar_g || 0).toFixed(1)}`} unit="g" color="text-yellow-400" />
                <NutrientBox icon={<Leaf className="h-4 w-4" />} label="Sodium" value={`${Math.round(analysis.nutrition_per_serving?.sodium_mg || 0)}`} unit="mg" color="text-red-400" />
              </div>

              {analysis.health_tags && analysis.health_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {analysis.health_tags.map((tag: string) => (
                    <span key={tag} className="rounded-full bg-secondary/50 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {tag.replace("_", " ")}
                    </span>
                  ))}
                </div>
              )}

              {analysis.ingredients && analysis.ingredients.length > 0 && (
                <div className="rounded-lg bg-secondary/20 p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Key Ingredients</p>
                  <p className="text-xs text-foreground">{analysis.ingredients.join(", ")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            {!saved ? (
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {saving ? "Saving..." : "Save to Food Log"}
              </Button>
            ) : (
              <Button variant="outline" disabled className="gap-2 text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Saved!
              </Button>
            )}
            <Button variant="outline" onClick={reset}>
              Analyze Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function NutrientBox({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: string; unit: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 p-3 text-center">
      <div className={color}>{icon}</div>
      <div className="text-lg font-bold text-foreground">
        {value}
        <span className="text-[10px] font-normal text-muted-foreground"> {unit}</span>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  );
}
