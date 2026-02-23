import { BookOpen, Clock, Target, Users, GraduationCap, Zap } from "lucide-react";

export const SEOContent = () => {
  return (
    <div className="bg-background border-t border-border">
      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-10 text-foreground">
          How InfinUp's Study Plan Generator Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">1. Choose Your Topic</h3>
            <p className="text-sm text-muted-foreground">
              Select any subject — from Python programming to organic chemistry to LSAT preparation.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">2. Set Your Timeframe</h3>
            <p className="text-sm text-muted-foreground">
              Define your study period: a 1-week sprint, 30-day challenge, or semester-long plan.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">3. Select Learning Intensity</h3>
            <p className="text-sm text-muted-foreground">
              Choose light, moderate, or intensive study schedules tailored to your availability.
            </p>
          </div>
        </div>
      </section>

      {/* Why Use InfinUp */}
      <section className="bg-muted/30 px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10 text-foreground">
            Why Use InfinUp for Study Planning
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Target, title: "Personalized Learning Paths", desc: "AI-generated study plans adapted to your goals and schedule." },
              { icon: Clock, title: "Time-Optimized Schedules", desc: "Maximize learning efficiency with strategically structured study sessions." },
              { icon: Zap, title: "Flexible Study Plans", desc: "Adjust intensity and timeline as your needs change." },
              { icon: BookOpen, title: "Topic-Specific Strategies", desc: "Customized approaches for different subjects and learning styles." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 items-start p-4 rounded-xl bg-card border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perfect For */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-10 text-foreground">
          Perfect For
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: GraduationCap, text: "Students preparing for exams (SAT, ACT, GRE, MCAT, Bar Exam)" },
            { icon: Users, text: "Professionals learning new job skills or certifications" },
            { icon: BookOpen, text: "Self-learners mastering programming, languages, or hobbies" },
            { icon: Target, text: "Bootcamp participants needing structured study schedules" },
          ].map((item) => (
            <div key={item.text} className="flex gap-3 items-center p-4 rounded-lg border bg-card">
              <item.icon className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
