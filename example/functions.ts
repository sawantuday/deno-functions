import { Router, RouterContext, Context, Status } from "https://deno.land/x/oak/mod.ts";
import { SEP, join } from "https://deno.land/std@0.140.0/path/mod.ts";
import * as log from "https://deno.land/std@0.140.0/log/mod.ts";
import { notFound } from "./helper.ts";

interface Func {
  id: string;
  name: string;
  filePath: string;
  params: Map<String, String>;
  createdAt: string;
  lastUsedAt: string;
  createdBy: String;
  worker: any | undefined;
}

const workersBasePath = join(Deno.cwd(), 'deno-swagger' + SEP + 'uploads');
const functions = new Map<string, Func>();

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
      const fn: Func = functions.get(context.params.id);
      if(fn.worker === undefined){  // initiate new worker here 
        console.log("initiating worker");
        fn.worker = new Worker(new URL("./worker.js", import.meta.url).href, { type: "module" });
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