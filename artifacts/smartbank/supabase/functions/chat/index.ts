const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages = [], language = "English", languageCode = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const system = `You are Aria, the friendly AI assistant for Smart Bank.
You help users with questions about deposits, withdrawals, transfers, fees, cards, security, biometrics, and general banking guidance.
Be concise, warm, and use markdown (short lists, **bold** for key terms). Do NOT invent specific account balances or transactions.
Always reply in ${language} (${languageCode}).`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // NOTE: "google/gemini-3-flash-preview" is not a real model on the
        // Lovable AI Gateway, so the request was failing with a 4xx and the
        // chat returned a generic error. The supported default is gemini-2.5-flash.
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });

    if (upstream.status === 429)
      return new Response(JSON.stringify({ error: "Rate limit" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (upstream.status === 402)
      return new Response(JSON.stringify({ error: "Payment required" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (!upstream.ok || !upstream.body) {
      const t = await upstream.text();
      console.error("AI gateway error:", upstream.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error", upstreamStatus: upstream.status, detail: t }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});