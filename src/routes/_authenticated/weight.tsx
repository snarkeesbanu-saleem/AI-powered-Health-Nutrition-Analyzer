import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWeightHistory, addWeightEntry } from "@/lib/nutrition.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, TrendingDown, TrendingUp, Minus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const weightHistoryQueryOptions = queryOptions({
  queryKey: ["weight-history"],
  queryFn: () => getWeightHistory(),
});

export const Route = createFileRoute("/_authenticated/weight")({
  head: () => ({
    meta: [
      { title: "Weight Tracker — NutriAI" },
      { name: "description", content: "Track your weight progress over time" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(weightHistoryQueryOptions),
  component: WeightPage,
});

function WeightPage() {
  const { data } = useSuspenseQuery(weightHistoryQueryOptions);
  const queryClient = useQueryClient();
  const addWeightFn = useServerFn(addWeightEntry);
  const [newWeight, setNewWeight] = useState("");
  const [saving, setSaving] = useState(false);

  const history = data?.history || [];

  const chartData = history.map((h) => ({
    date: new Date(h.logged_at + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: h.weight_kg,
  }));

  const trend = history.length >= 2
    ? history[history.length - 1].weight_kg - history[0].weight_kg
    : 0;

  const handleAdd = async () => {
    const w = parseFloat(newWeight);
    if (!w || w <= 0) {
      toast.error("Enter a valid weight");
      return;
    }
    setSaving(true);
    try {
      await addWeightFn({ data: { weight_kg: w } });
      queryClient.invalidateQueries({ queryKey: ["weight-history"] });
      queryClient.invalidateQueries({ queryKey: ["today-summary"] });
      setNewWeight("");
      toast.success("Weight logged");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to log");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Lora', serif" }}>
          Weight Tracker
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor your weight journey and stay on track with your goals.
        </p>
      </div>

      <Card className="mb-6 border-border/50 bg-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Log Weight (kg)</Label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  type="number"
                  step="0.1"
                  placeholder="70.5"
                  className="pl-9 w-40"
                />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
              Log Weight
            </Button>
          </div>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-secondary/30 px-3 py-1.5">
              {trend < 0 ? (
                <TrendingDown className="h-4 w-4 text-green-400" />
              ) : trend > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-400" />
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground">
                {trend === 0 ? "No change" : `${Math.abs(trend).toFixed(1)} kg ${trend < 0 ? "lost" : "gained"}`}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              Latest: {history[history.length - 1].weight_kg} kg
            </span>
          </div>

          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base" style={{ fontFamily: "'Lora', serif" }}>
                Weight Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a2e",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      labelStyle={{ color: "#e2e8f0" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: "#8b5cf6", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {history.length === 0 && (
        <Card className="border-border/50 bg-card">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Scale className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No weight entries yet.</p>
            <p className="text-xs text-muted-foreground">Log your first weight above to start tracking.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
