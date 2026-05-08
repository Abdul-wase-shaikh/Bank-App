import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  try {
    const { messages } = await req.json();

    const lastMessage = messages?.[messages.length - 1]?.content || "Hello";

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // simulate streaming text
        const text = `You said: ${lastMessage}`;

        for (const char of text) {
          const chunk = `data: ${JSON.stringify({
            choices: [
              {
                delta: {
                  content: char,
                },
              },
            ],
          })}\n\n`;

          controller.enqueue(encoder.encode(chunk));

          await new Promise((r) => setTimeout(r, 20));
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err.message,
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
