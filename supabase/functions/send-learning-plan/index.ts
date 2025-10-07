import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  plan: {
    topic: string;
    level: string;
    weeks: number;
    hoursPerWeek: number;
    weekData: Array<{
      weekNumber: number;
      theme: string;
      resources: Array<{
        title: string;
        source: string;
        url: string;
        duration: string;
        description: string;
        type: string;
      }>;
    }>;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, plan }: EmailRequest = await req.json();

    console.log('Sending learning plan email to:', email);

    // Generate HTML email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0066FF, #00D084); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px; }
            .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; margin: 5px; font-size: 14px; }
            .week { background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #0066FF; }
            .week-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #0066FF; }
            .resource { background: white; padding: 15px; margin-bottom: 12px; border-radius: 8px; border: 1px solid #e0e0e0; }
            .resource-title { font-weight: bold; margin-bottom: 5px; }
            .resource-meta { color: #666; font-size: 14px; margin-bottom: 8px; }
            .resource-link { display: inline-block; color: #0066FF; text-decoration: none; margin-top: 8px; }
            .footer { text-align: center; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0 0 15px 0;">Your Learning Path</h1>
              <p style="margin: 0; opacity: 0.9;">Learn Anything. Infinitely Upward.</p>
            </div>
            
            <div style="margin-bottom: 30px;">
              <span class="badge">🎯 ${plan.topic}</span>
              <span class="badge">📊 ${plan.level.charAt(0).toUpperCase() + plan.level.slice(1)}</span>
              <span class="badge">⏰ ${plan.hoursPerWeek} hrs/week for ${plan.weeks} weeks</span>
            </div>

            ${plan.weekData.map(week => `
              <div class="week">
                <div class="week-title">WEEK ${week.weekNumber}: ${week.theme}</div>
                ${week.resources.map(resource => `
                  <div class="resource">
                    <div class="resource-title">${getResourceIcon(resource.type)} ${resource.title}</div>
                    <div class="resource-meta">${resource.source} • ${resource.duration}</div>
                    <div style="color: #666; font-size: 14px;">${resource.description}</div>
                    <a href="${resource.url}" class="resource-link">View Resource →</a>
                  </div>
                `).join('')}
              </div>
            `).join('')}

            <div class="footer">
              <p>Created with <a href="https://infinup.ai" style="color: #0066FF;">Infinup.ai</a></p>
              <p style="font-size: 14px;">Keep learning, keep growing! 🚀</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Infinup.ai <onboarding@resend.dev>",
      to: [email],
      subject: `Your ${plan.topic} Learning Path - ${plan.weeks} Weeks`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

function getResourceIcon(type: string): string {
  const icons: Record<string, string> = {
    video: "🎥",
    reading: "📖",
    interactive: "💻",
    project: "🛠️",
  };
  return icons[type] || "📚";
}
