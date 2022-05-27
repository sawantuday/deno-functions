import {
  bold,
  cyan,
  green,
  yellow,
} from "https://deno.land/std@0.131.0/fmt/colors.ts";
import { 
  Application,
  isHttpError,
} from "https://deno.land/x/oak/mod.ts";

import { bookRouter } from "./books.ts";
import { functionRouter } from "./functions.ts";
import { blobRouter } from "./blobs.ts";
import { requestLogger } from "./helper.ts";

const app = new Application();

// Logger
app.use(requestLogger);

// Response Time
app.use(async (context, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  context.response.headers.set("X-Response-Time", `${ms}ms`);
});

// Error handler
app.use(async (context, next) => {
  try {
    await next();
  } catch (err) {
    if (isHttpError(err)) {
      context.response.status = err.status;
      const { message, status, stack } = err;
      if (context.request.accepts("json")) {
        context.response.body = { message, status, stack };
        context.response.type = "json";
      } else {
        context.response.body = `${status} ${message}\n\n${stack ?? ""}`;
        context.response.type = "text/plain";
      }
    } else {
      console.log(err);
      throw err;
    }
  }
});

// app.use(async (context, next) => {
//   if(context.request.url.pathname === '/swagger.json'){
//     context.response.headers.set('Content-Type', 'application/json');
//     context.response.status = 200;
//     context.response.body = "swaggerSpec"
//   }else{
//     await next();
//   } 
// });

app.use(bookRouter.routes());
app.use(bookRouter.allowedMethods());
app.use(functionRouter.routes());
app.use(functionRouter.allowedMethods());
app.use(blobRouter.routes());
app.use(blobRouter.allowedMethods());

app.addEventListener("listen", ({ hostname, port, serverType }) => {
  console.log(
    bold("Start listening on ") + yellow(`${hostname}:${port}`),
  );
  console.log(bold("  using HTTP server: " + yellow(serverType)));
});

await app.listen({ port: 8000 });