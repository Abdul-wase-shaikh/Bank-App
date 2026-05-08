import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const messages = body.messages || [];

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
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
});
