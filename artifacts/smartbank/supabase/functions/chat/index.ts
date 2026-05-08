import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

Deno.serve(async (req) => {
  try {
    const body = await req.json();

    const messages = body.messages || [];

    const lastMessage = messages[messages.length - 1]?.content || "Hello";

    const prompt = `
You are Aria, a professional AI banking assistant for SmartBank.

You help users with:
- bank accounts
- transfers
- cards
- loans
- mobile banking
- fraud protection
- payments
- account security
- finance guidance

Be concise, modern, and friendly.

User message:
${lastMessage}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      },
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I could not answer that.";

    return new Response(
      JSON.stringify({
        reply,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
});
