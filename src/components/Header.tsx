import { Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Menu,
  X,
  Home,
  Camera,
  History,
  Activity,
  Sparkles,
  Scale,
  LogOut,
  Droplets,
  User,
} from "lucide-react";

export function Header() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.invalidate();
    window.location.href = "/";
  };

  const navLinks = user
    ? [
        { to: "/dashboard", label: "Dashboard", icon: Home },
        { to: "/analyze", label: "Analyze Food", icon: Camera },
        { to: "/history", label: "History", icon: History },
        { to: "/bmi", label: "BMI", icon: Activity },
        { to: "/recommendations", label: "Recommendations", icon: Sparkles },
        { to: "/weight", label: "Weight", icon: Scale },
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground" style={{ fontFamily: "'Lora', serif" }}>
            NutriAI
          </span>
        </Link>

        {user ? (
          <>
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  activeProps={{ className: "bg-accent text-accent-foreground" }}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
              >
                <User className="h-3.5 w-3.5" />
                {user.email?.split("@")[0] || "User"}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-md p-2 text-muted-foreground hover:bg-accent md:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>

      {menuOpen && user && (
        <div className="border-t border-border/50 bg-background px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                activeProps={{ className: "bg-accent text-accent-foreground" }}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
