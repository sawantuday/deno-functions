import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
const messages = [];
const channel = new BroadcastChannel("chat");
channel.onmessage = (event) => {
  messages.push(event.data);
};
function handler(req: Request): Response {
  const { searchParams } = new URL(req.url);
  const msg = searchParams.get("msg");
  if (msg) channel.postMessage(msg);
  return new Response(JSON.stringify(messages), {
    headers: { "content-type": "application/json" }
  });
}
console.log("Listening on http://localhost:8000");
await serve(handler);