import { serve } from "https://deno.land/std@0.138.0/http/server.ts";

const port = 8000;

const worker = new Worker(new URL("./worker2.ts", import.meta.url).href, { type: "module" });

const handler = (request: Request): Response => {
  const url: URL = new URL(request.url);
  let body: string;
  if(url.pathname == "/exec"){
    body = "exec request found";
    // const worker = new Worker(new URL("./worker.ts", import.meta.url).href, { type: "module" });
    // worker.postMessage({file: "asdasd"});
    const event = new CustomEvent('fetch', {
      bubbles: true,
      detail: { text: () => "textarea.value" }
    });
    // worker.addEventListener("fetch", (e)=>{
    //   console.log(e);
    // });
    worker.dispatchEvent(event);
  } else if (url.pathname == "/stat"){
    body = "deno stats request!!"
    console.log(Deno.memoryUsage())
  } else {
    body = `Your user-agent is:\n\n${
      request.headers.get("user-agent") ?? "Unknown"
    }`;
  }

  return new Response(body, { status: 200 });
};

console.log(`HTTP webserver running. Access it at: http://localhost:8000/`);
await serve(handler, { port });