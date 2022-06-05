import { Router, RouterContext, Context, Status } from "https://deno.land/x/oak/mod.ts";
import { SEP, join, toFileUrl } from "https://deno.land/std@0.140.0/path/mod.ts";
// import * as log from "https://deno.land/std@0.140.0/log/mod.ts";
import { notFound } from "./helper.ts";
import { existsSync } from "https://deno.land/std@0.140.0/fs/mod.ts";

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
const fnStr:string = await Deno.readTextFile(join(workersBasePath, "6ba5d480-735f-4ae8-8084-7c8505435261", "conf.json"));
const fnc:Func = await JSON.parse(fnStr);
functions.set(fnc.id, fnc);

// const fnStr5:string = await Deno.readTextFile(join(workersBasePath, "worker-2_conf.json"));
// const fn5:Func = await JSON.parse(fnStr5);
// functions.set(fn5.id, fn5);

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
        const path:URL = toFileUrl(join(workersBasePath, fn.id, "server.ts"));
        fn.worker = new Worker(path.href, { type: "module",
            deno: {
              namespace: true,
              permissions: {
                read: true,
                run: false,
                write: false,
                hrtime: false,
                net: true,
                env: false
              }
            }
          }
        );
      }
      // context.response.body = "executed";
      // send/proxy an event to worker 
      if(fn && fn.port){
        const headers = context.request.headers;
        // headers["X-forwarded-for"] = "http://localhost:8000/"; // TODO; this is not working 
        const res:Response = await fetch("http://localhost:"+fn.port, {
          headers:headers,
          // body: context.request.body,
          method: context.request.method
        });
        context.response.body = res.body;
        // context.response.headers = res.headers;
        // context.response.status = res.status;
        // context.response.type = res.type; // TODO: add query params as well 
      } else {
        context.throw(Status.NotFound, "Function not found")
      }
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
      // context.assert(func.id && typeof func.id === "string", Status.BadRequest);
      context.assert(func.filePath && typeof func.filePath === "string", Status.BadRequest);

      func.id = crypto.randomUUID();
      func.name = func.name || func.id;
      func.port = Math.floor(Math.random() * (65000 - 2000) + 2000);
      func.createdAt = Math.floor(Date.now()/1000);
      func.createdBy = 'Admin';
      const jsonStr:string = await JSON.stringify(func);
      console.log(join(workersBasePath, func.id));
      if(existsSync(join(workersBasePath, func.id))){
        context.throw(Status.InternalServerError, "Function already exists");
      }

      Deno.mkdirSync(join(workersBasePath, func.id));
      Deno.copyFileSync(
        join(workersBasePath, "function-1", "server.ts"), 
        join(workersBasePath, func.id, "server.ts")
      );
      Deno.copyFileSync(
        join(workersBasePath, func.filePath), 
        join(workersBasePath, func.id, func.filePath)
      );
      await Deno.writeTextFile(join(workersBasePath, func.id, 'conf.json'), jsonStr);

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
      const fn: Func|undefined = functions.get(context.params.id);
      if(fn && fn.worker != undefined){
        fn.worker.terminate();
      }
      const status = functions.delete(context.params.id);
      context.response.body = {"status": status}
    } else {
      return notFound(context);
    }
  });

export { functionRouter }