import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

function handler(req: Request): Response {
  return new Response("Hello world");
}

console.log("Listening on http://localhost:8000");
await serve(handler, { port: 4242 });



// async function handler(req: Request): Promise<Response> {
//   console.log("Method:", req.method);

//   const url = new URL(req.url);
//   console.log("Path:", url.pathname);
//   console.log("Query parameters:", url.searchParams);

//   console.log("Headers:", req.headers);

//   if (req.body) {
//       const body = await req.text();
//       console.log("Body:", body);
//   }

//   return new Response("Hello, World!");
// }

// function handler(req: Request): Response {
//   const body = JSON.stringify({ message: "NOT FOUND" });
//   return new Response(body, {
//     status: 404,
//     headers: {
//       "content-type": "application/json; charset=utf-8",
//     },
//   });
// }

// function handler(req: Request): Response {
//   let timer;
//   const body = new ReadableStream({
//     async start(controller) {
//       timer = setInterval(() => {
//         controller.enqueue("Hello, World!\n");
//       }, 1000);
//     },
//     cancel() {
//       clearInterval(timer);
//     },
//   });
//   return new Response(body, {
//     headers: {
//       "content-type": "text/plain; charset=utf-8",
//     },
//   });
// }