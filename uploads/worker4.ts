import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { SEP, join } from "https://deno.land/std@0.140.0/path/mod.ts";



function handler(req: Request): Response {
  return new Response("Hello world - worker4");
}

console.log("Listening on http://localhost:42069");
// const workersBasePath = join(Deno.cwd(), 'deno-swagger' + SEP + 'uploads');
// const text = await Deno.readTextFile(join(workersBasePath, "worker-1_conf.json"));
// const conf:any = await JSON.parse(text);

await serve(handler, { port: 42069 });

