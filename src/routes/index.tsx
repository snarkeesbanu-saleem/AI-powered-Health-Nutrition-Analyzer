import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Camera,
  Activity,
  Sparkles,
  Scale,
  Droplets,
  Utensils,
  Brain,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NutriAI — AI-Powered Health & Nutrition Analyzer" },
      { name: "description", content: "Analyze your meals with AI, track nutrition, and get personalized Indian & South Indian diet recommendations." },
      { property: "og:title", content: "NutriAI — AI-Powered Health & Nutrition Analyzer" },
      { property: "og:description", content: "Snap a photo of your meal. Get instant nutrition analysis and personalized Indian diet recommendations." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [user, setUser] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(!!data.user));
  }, []);

  const features = [
    {
      icon: Camera,
      title: "AI Food Recognition",
      description: "Snap a photo of any meal and our AI instantly identifies Indian & South Indian dishes with detailed nutrition.",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Utensils,
      title: "Nutrition Analysis",
      description: "Get complete macros — calories, protein, carbs, fats, fiber, vitamins & minerals for every meal.",
      color: "text-neon-blue",
      bg: "bg-neon-blue/10",
    },
    {
      icon: Brain,
      title: "Personalized Recommendations",
      description: "AI-powered meal plans and healthier alternatives tailored to your BMI, goals, and Indian food preferences.",
      color: "text-neon-purple",
      bg: "bg-neon-purple/10",
    },
    {
      icon: Activity,
      title: "BMI & Health Metrics",
      description: "Track your BMI, daily calorie goals, and weight progress with beautiful charts.",
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    {
      icon: Droplets,
      title: "Water Intake Tracker",
      description: "Stay hydrated with daily water reminders and intake logging.",
      color: "text-neon-blue",
      bg: "bg-neon-blue/10",
    },
    {
      icon: Scale,
      title: "Weight Progress",
      description: "Monitor your weight journey over time and stay motivated toward your target.",
      color: "text-chart-5",
      bg: "bg-chart-5/10",
    },
  ];

  const sampleFoods = [
    { name: "Masala Dosa", calories: "~290", tag: "South Indian" },
    { name: "Chicken Biryani", calories: "~520", tag: "Hyderabadi" },
    { name: "Idli Sambar", calories: "~180", tag: "South Indian" },
    { name: "Palak Paneer", calories: "~340", tag: "North Indian" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-16 text-center">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-neon-blue/20 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Nutrition for Indian Cuisine
          </div>
          <h1
            className="text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Understand Your Food,
            <br />
            <span className="bg-gradient-to-r from-primary via-neon-blue to-neon-purple bg-clip-text text-transparent">
              Transform Your Health
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Upload a photo of your meal and get instant nutrition analysis.
            Personalized recommendations for Indian & South Indian diets.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" className="gap-2">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button size="lg" className="gap-2">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Sample Foods */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground" style={{ fontFamily: "'Lora', serif" }}>
            Popular Indian Dishes We Analyze
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {sampleFoods.map((food) => (
              <div
                key={food.name}
                className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card p-4 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Utensils className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold text-foreground">{food.name}</div>
                <div className="text-xs text-muted-foreground">{food.calories} cal</div>
                <div className="rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] text-muted-foreground">{food.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-2xl font-bold text-foreground" style={{ fontFamily: "'Lora', serif" }}>
            Everything You Need
          </h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">
            A complete nutrition toolkit powered by AI
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border/50 bg-card p-5 transition-colors hover:border-border"
              >
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${feature.bg} ${feature.color}`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-foreground">{feature.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl" style={{ fontFamily: "'Lora', serif" }}>
            Ready to Eat Smarter?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Join thousands of users tracking their nutrition with AI-powered insights.
          </p>
          <div className="mt-6">
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button size="lg" className="gap-2">
                {user ? "Go to Dashboard" : "Start Your Journey"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          NutriAI — AI-Powered Health & Nutrition Analyzer
        </p>
      </footer>
    </div>
  );
}
