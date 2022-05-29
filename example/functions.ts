import { Router, RouterContext, Context, Status } from "https://deno.land/x/oak/mod.ts";
import { SEP, join } from "https://deno.land/std@0.140.0/path/mod.ts";
import * as log from "https://deno.land/std@0.140.0/log/mod.ts";
import { notFound } from "./helper.ts";

interface Func {
  id: string;
  name: string;
  filePath: string;
  params: Map<String, String>;
  createdAt: number;
  lastUsedAt: number;
  createdBy: String;
  worker: any | undefined;
  port: Number;
}

const workersBasePath = join(Deno.cwd(), 'deno-swagger' + SEP + 'uploads');
const functions = new Map<string, Func>();

// load data from config files 
const fnStr:string = await Deno.readTextFile(join(workersBasePath, "worker-1_conf.json"));
const fn:Func = await JSON.parse(fnStr);
functions.set(fn.id, fn);

const functionRouter = new Router()
  .get("/functions", (context) => {
    context.response.body = Array.from(functions.values());
  })
  .get("/functions/:id", (context) => {
    if (context.params && functions.has(context.params.id)) {
      context.response.body = functions.get(context.params.id);
    } else {
      context.throw(Status.NotFound, "Function not found")
    }
  })
  .get("/functions/:id/exec", async (context) => {
    if (context.params && functions.has(context.params.id)) {
      const fn: Func | undefined = functions.get(context.params.id);
      if(fn && fn.worker === undefined){  // initiate new worker here 
        console.log("initiating worker");
        fn.worker = new Worker(
          new URL("file://"+fn.filePath, import.meta.url).href, {
            type: "module",
            deno: {
              namespace: true,
            }
          }
        );
      }
      // send an event to worker 
      context.response.body = "Function executed";
    } else {
      context.throw(Status.NotFound, "Function not found")
    }
  })
  .post("/functions", async (context: RouterContext<"/functions">) => {
    if (!context.request.hasBody) {
      context.throw(Status.BadRequest, "Bad Request");
    }

    const body = context.request.body();
    let func: Partial<Func> | undefined;

    if (body.type === "json") {
      func = await body.value;
    } else if (body.type === "form") {
      func = {};
      // for (const [key, value] of await body.value) {
      //   func[key as keyof Func] = value;
      // }
    } else if (body.type === "form-data") {
      const formData = await body.value.read();
      func = formData.fields;
    }

    if (func) {
      context.assert(func.id && typeof func.id === "string", Status.BadRequest);
      context.assert(func.filePath && typeof func.filePath === "string", Status.BadRequest);

      func.name = func.id;
      func.filePath = join(workersBasePath, func.filePath);
      // TODO: add worker exists check
      func.port = Math.floor(Math.random() * (65000 - 2000) + 2000);
      func.createdAt = Math.floor(Date.now()/1000);
      func.createdBy = 'Admin';
      const jsonStr:string = await JSON.stringify(func);
      await Deno.writeTextFile(join(workersBasePath, func.id+'_conf.json'), jsonStr);

      functions.set(func.id, func as Func);
      context.response.status = Status.OK;
      context.response.body = func;
      context.response.type = "json";
      return;
    }

    context.throw(Status.BadRequest, "Bad Request");
  })
  .delete("/functions/:id", (context) =>{
    if (context.params && functions.has(context.params.id)) {
      const status = functions.delete(context.params.id);
      context.response.body = {"status": status}
    } else {
      return notFound(context);
    }
  });

export { functionRouter }