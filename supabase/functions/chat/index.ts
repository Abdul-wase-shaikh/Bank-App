import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  const { messages } = await req.json();

  const lastMessage = messages[messages.length - 1]?.content || "Hello";

  return new Response(
    JSON.stringify({
      choices: [
        {
          delta: {
            content: `You said: ${lastMessage}`,
          },
        },
      ],
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
});
