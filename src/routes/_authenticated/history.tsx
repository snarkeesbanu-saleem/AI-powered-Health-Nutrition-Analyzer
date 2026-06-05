import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getFoodLogs, deleteFoodLog } from "@/lib/nutrition.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Trash2, Flame, Beef, Wheat, Droplet, Calendar } from "lucide-react";
import { toast } from "sonner";

const foodLogsQueryOptions = queryOptions({
  queryKey: ["food-logs"],
  queryFn: () => getFoodLogs({ data: {} }),
});

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Food History — NutriAI" },
      { name: "description", content: "View your food consumption history" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(foodLogsQueryOptions),
  component: HistoryPage,
});

function HistoryPage() {
  const { data } = useSuspenseQuery(foodLogsQueryOptions);
  const queryClient = useQueryClient();
  const deleteFn = useServerFn(deleteFoodLog);

  const handleDelete = async (id: string) => {
    try {
      await deleteFn({ data: { id } });
      queryClient.invalidateQueries({ queryKey: ["food-logs"] });
      queryClient.invalidateQueries({ queryKey: ["today-summary"] });
      toast.success("Entry deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const logs = data?.logs || [];
  const grouped = logs.reduce((acc: Record<string, typeof logs>, log) => {
    const date = log.logged_at || new Date(log.created_at).toISOString().split("T")[0];
    if (!date) return acc;
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const mealTypeIcon = (type: string) => {
    switch (type) {
      case "breakfast": return "🍳";
      case "lunch": return "🍛";
      case "dinner": return "🍽️";
      default: return "🥪";
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Lora', serif" }}>
          Food History
        </h1>
        <p className="text-sm text-muted-foreground">
          {logs.length} entries logged across {sortedDates.length} days
        </p>
      </div>

      {sortedDates.length === 0 && (
        <Card className="border-border/50 bg-card">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <History className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No food entries yet.</p>
            <p className="text-xs text-muted-foreground">Analyze your first meal to start tracking!</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {sortedDates.map((date) => (
          <div key={date}>
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </span>
              <span className="text-xs text-muted-foreground">
                ({grouped[date].reduce((s, l) => s + (l.calories || 0), 0)} kcal)
              </span>
            </div>
            <div className="space-y-2">
              {grouped[date].map((log) => (
                <Card key={log.id} className="border-border/40 bg-card/60">
                  <CardContent className="flex items-center gap-3 p-3">
                    <span className="text-lg">{mealTypeIcon(log.meal_type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{log.food_name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Flame className="h-3 w-3" /> {log.calories || 0} kcal
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Beef className="h-3 w-3" /> {log.protein || 0}g
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Wheat className="h-3 w-3" /> {log.carbs || 0}g
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Droplet className="h-3 w-3" /> {log.fats || 0}g
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(log.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
