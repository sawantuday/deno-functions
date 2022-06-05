import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import config from "./conf.json" assert {type: "json"};
const module = await import("./"+config.filePath);
await serve(module.default, { port: config.port });
