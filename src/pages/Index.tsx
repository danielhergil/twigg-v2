import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles, Users, PencilRuler, Zap, Shield, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";
import { MadeWithDyad } from "@/components/made-with-dyad";

const FeatureCard = ({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) => (
  <div className="group relative overflow-hidden rounded-2xl border border-purple-200 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 dark:border-purple-800 dark:bg-card/60">
    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-purple-300/60 blur-3xl animate-pulse-slow dark:bg-purple-700/30" />
      <div className="absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-pink-300/50 blur-3xl animate-pulse-slow delay-150 dark:bg-pink-700/30" />
    </div>
    <div className="relative p-6">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-pink-600 to-red-600 text-white shadow-lg shadow-purple-500/30">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-bold text-xl text-foreground">{title}</h3>
      <p className="mt-2 text-base text-muted-foreground">{desc}</p>
    </div>
  </div>
);

const PriceCard = ({
  name,
  price,
  features,
  highlight = false,
  badge,
}: {
  name: string;
  price: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
}) => (
  <div
    className={[
      "relative rounded-3xl border p-8 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
      highlight
        ? "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300 shadow-lg shadow-purple-200/50 dark:from-purple-900 dark:to-pink-900 dark:border-purple-700 dark:shadow-purple-900/50 scale-[1.03] py-10" // Added scale and increased padding
        : "bg-white/90 backdrop-blur-sm border-gray-200 dark:bg-card/70 dark:border-gray-800",
    ].join(" ")}
  >
    {badge && (
      <div className="absolute -top-4 right-6">
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm px-3 py-1.5 rounded-full shadow-md animate-bounce-slow">
          {badge}
        </Badge>
      </div>
    )}
    <h3 className="text-2xl font-bold text-foreground">{name}</h3>
    <div className="mt-4 flex items-end gap-1">
      <span className="text-5xl font-extrabold tracking-tight text-foreground">${price}</span>
      <span className="text-lg text-muted-foreground">/mo</span>
    </div>
    <ul className="mt-6 space-y-4 flex-grow"> {/* Added flex-grow */}
      {features.map((f) => (
        <li key={f} className="flex items-center gap-3 text-base text-muted-foreground">
          <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 dark:text-primary" />
          <span>{f}</span>
        </li>
      ))}
    </ul>
    <Link to="/login" className="mt-8"> {/* Removed mt-8 from Button and added to Link */}
      <Button
        className={[
          "w-full text-lg py-3 rounded-xl transition-all duration-300",
          highlight
            ? "bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white shadow-lg shadow-purple-600/30"
            : "bg-purple-500 hover:bg-purple-600 text-white shadow-md shadow-purple-500/20",
        ].join(" ")}
      >
        Get started
      </Button>
    </Link>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(75rem_30rem_at_50%_-5%,rgba(139,92,246,0.2),transparent),radial-gradient(60rem_28rem_at_120%_10%,rgba(236,72,153,0.25),transparent),linear-gradient(to_bottom,#fdf2f8,white)] dark:bg-[radial-gradient(75rem_30rem_at_50%_-5%,rgba(139,92,246,0.1),transparent),radial-gradient(60rem_28rem_at_120%_10%,rgba(236,72,153,0.15),transparent),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--background)))]">
      <Header />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Decorative background shapes */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-[-150px] -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-purple-400/30 blur-3xl animate-float-slow dark:bg-purple-700/20" />
            <div className="absolute left-[5%] top-[100px] h-52 w-52 rounded-full bg-pink-400/30 blur-3xl animate-float-slow delay-200 dark:bg-pink-700/20" />
            <div className="absolute right-[3%] top-[250px] h-40 w-40 rounded-full bg-red-400/30 blur-3xl animate-float-slow delay-400 dark:bg-red-700/20" />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-24 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/80 px-4 py-1.5 text-sm text-purple-700 font-medium shadow-md backdrop-blur-sm animate-fade-in-up dark:border-purple-800 dark:bg-card/60 dark:text-primary">
              <Sparkles className="h-4 w-4 text-purple-500 dark:text-primary" />
              <span className="hidden sm:inline">Adaptive learning at your fingertips</span>
              <span className="sm:hidden">Adaptive learning</span>
            </div>
            <h1 className="mt-8 text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-foreground animate-fade-in-up delay-100">
              Build, Learn, and Share Courses with{" "}
              <span className="bg-gradient-to-br from-purple-600 to-pink-700 bg-clip-text text-transparent drop-shadow-lg">
                Twigg
              </span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in-up delay-200">
              Create interactive courses, learn with AI-powered paths, and grow with a supportive community.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
              <Link to="/login" className="w-full sm:w-auto">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white text-lg px-8 py-6 rounded-xl shadow-xl shadow-purple-600/30 transition-all duration-300 hover:scale-105">
                  <Zap className="mr-2 h-5 w-5" />
                  Start free
                </Button>
              </Link>
              <a href="#pricing" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full border-purple-300 hover:bg-purple-50 text-purple-700 text-lg px-8 py-6 rounded-xl shadow-md transition-all duration-300 hover:scale-105 dark:border-primary dark:text-primary dark:hover:bg-primary/10">
                  See pricing
                </Button>
              </a>
            </div>

            {/* Hero stats/benefits */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto animate-fade-in-up delay-400">
              {[
                { icon: Wand2, label: "AI-assisted authoring" },
                { icon: Shield, label: "Privacy-first" },
                { icon: Users, label: "Creator community" },
                { icon: Sparkles, label: "Adaptive learning" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-purple-100 bg-white/70 py-4 text-sm text-foreground font-medium backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-105 dark:border-purple-800 dark:bg-card/60"
                >
                  <Icon className="h-6 w-6 text-purple-600 dark:text-primary" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-white/80 backdrop-blur-sm text-purple-700 dark:bg-card/60 dark:text-primary">
              Powerful Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Everything you need to{" "}
              <span className="bg-gradient-to-br from-purple-600 to-pink-700 bg-clip-text text-transparent">
                succeed
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              From intuitive course creation to a thriving community, Twigg has you covered.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={PencilRuler}
              title="Create courses"
              desc="Design interactive lessons with quizzes, rich media, and engaging projects effortlessly."
            />
            <FeatureCard
              icon={Users}
              title="Community reviews"
              desc="Discover and review high-quality courses from a global network of passionate creators."
            />
            <FeatureCard
              icon={Sparkles}
              title="Adaptive learning"
              desc="Experience personalized learning paths that dynamically adjust to your progress and goals."
            />
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 h-52 w-[80%] rounded-full bg-purple-300/30 blur-3xl animate-float-slow dark:bg-purple-700/20" />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 py-20">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-3 bg-white/80 backdrop-blur-sm text-purple-700 dark:bg-card/60 dark:text-primary">
                Simple & Transparent
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Pick the plan that{" "}
                <span className="bg-gradient-to-br from-purple-600 to-pink-700 bg-clip-text text-transparent">
                  grows with you
                </span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Start free, upgrade anytime. No hidden fees, just pure value.
              </p>
            </div>

            <div className="mt-16 grid md:grid-cols-3 gap-8">
              <PriceCard
                name="Starter"
                price="0"
                features={[
                  "Unlimited learning access",
                  "Basic course creation tools",
                  "Full community access",
                  "Standard support",
                ]}
              />
              <PriceCard
                name="Pro"
                price="12"
                features={[
                  "All Starter features",
                  "Advanced creation suite",
                  "Detailed insights & analytics",
                  "Priority email support",
                  "Custom branding options",
                ]}
                highlight
                badge="Most popular"
              />
              <PriceCard
                name="Team"
                price="29"
                features={[
                  "All Pro features",
                  "Dedicated team workspaces",
                  "Real-time collaboration",
                  "Shared content libraries",
                  "Dedicated account manager",
                ]}
              />
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-20 text-center">
          <div className="mx-auto max-w-3xl rounded-3xl border border-purple-200 bg-white/80 p-10 backdrop-blur-sm shadow-xl shadow-purple-100/50 dark:border-purple-800 dark:bg-card/60 dark:shadow-purple-900/50">
            <h3 className="text-3xl font-bold text-foreground">Ready to create your next great course?</h3>
            <p className="mt-4 text-lg text-muted-foreground">
              Join Twigg today and bring your learning and teaching to life with our powerful platform.
            </p>
            <div className="mt-8">
              <Link to="/login">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white text-lg px-8 py-6 rounded-xl shadow-xl shadow-purple-600/30 transition-all duration-300 hover:scale-105">
                  Get started free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MadeWithDyad />
    </div>
  );
};

export default Index;