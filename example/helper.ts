import { Context, Status } from "https://deno.land/x/oak/mod.ts";
import {
  bold,
  cyan,
  green,
  yellow,
} from "https://deno.land/std@0.131.0/fmt/colors.ts";

// TODO: move this to types.d
// interface Func {
//   id: string;
//   name: string;
//   filePath: string;
//   params: Map<String, String>;
//   createdAt: number;
//   lastUsedAt: number;
//   createdBy: String;
//   worker: any | undefined;
//   port: Number;
// }

function notFound(context: Context) {
  context.response.status = Status.NotFound;
  context.response.body =
    `<html><body><h1>404 - Not Found</h1><p>Path <code>${context.request.url}</code> not found.`;
}

const requestLogger = async (context:any, next:any) => {
  await next();
  const rt = context.response.headers.get("X-Response-Time");
  console.log(
    `${green(context.request.method)} ${
      cyan(decodeURIComponent(context.request.url.pathname))
    } - ${
      bold(
        String(rt),
      )
    }`,
  );
}

export { notFound, requestLogger }