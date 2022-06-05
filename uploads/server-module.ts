import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { SEP, join } from "https://deno.land/std@0.140.0/path/mod.ts";
import { Func } from "../example/helper.ts";

const workersBasePath = join(Deno.cwd(), 'deno-swagger' + SEP + 'uploads');
const jsonStr = await Deno.readTextFile(join(workersBasePath, "conf.json"));
const conf:Func = await JSON.parse(jsonStr);

const module = await import(join(workersBasePath, conf.filePath));

await serve(module.default, { port: conf.port });

