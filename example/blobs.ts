import { Router, RouterContext, Context, Status } from "https://deno.land/x/oak/mod.ts";
import { MultipartReader } from "https://deno.land/std@0.140.0/mime/multipart.ts";
import { SEP, join } from "https://deno.land/std@0.140.0/path/mod.ts";
import { ensureDir, ensureDirSync, move, exists } from "https://deno.land/std@0.140.0/fs/mod.ts";
import { notFound } from "./helper.ts";

// interface Blob {
//   id: string;
//   fileName: string;
//   filePath: string;
//   createdAt: string;
//   createdBy: string;
//   version: string;
// }

// https://github.com/hviana/Upload-middleware-for-Oak-Deno-framework

// const blobs = new Map<string, Blob>();

const uploadPath: string = join(Deno.cwd(), 'deno-swagger' + SEP + 'uploads');
if(!(await exists(uploadPath))) {
  await Deno.mkdir(uploadPath, { recursive: true })
}

const blobRouter = new Router();

blobRouter
  .get("/blobs", async (context) => {
    // context.response.body = Array.from(blobs.values());
    let body: string = `
      <body>
      <form id="myForm" enctype="multipart/form-data" action="/blobs" method="post">
        <input type="file" name="file1" multiple><br>
        <input type="submit" value="Submit">
      </form>
    `;
    body += '<br><b>Available Files ..</b><br><div>'
    for await (const dirEntry of Deno.readDir(uploadPath)) {
      if(dirEntry.isFile){
        body += '<span>'+dirEntry.name+'</span><br>'
      }
    }
    body += '</div></body>';
    context.response.type = 'text/html';
    context.response.body = body;
  })
  // .get("/blobs/:id", (context) => {
  //   if (context.params && blobs.has(context.params.id)) {
  //     context.response.body = blobs.get(context.params.id);
  //   } else {
  //     return notFound(context);
  //   }
  // })
  .post("/blobs", async (context: RouterContext<"/blobs">) => {
    const req = context.request;
    const boundaryRegex = /^multipart\/form-data;\sboundary=(?<boundary>.*)$/;
    let match: RegExpMatchArray | null; 
    match = req.headers.get("content-type")!.match(boundaryRegex);

    if(match){
      const formBoundary: string = match.groups!.boundary;
      const mr = new MultipartReader(await req.body({type:'reader'}).value, formBoundary);
      const form = await mr.readForm(0);
      let entries: any = Array.from(form.entries());
      for (const item of entries) {
        const formField:any = item[0];
        let filesData: any = [].concat(item[1]);
        for (const fileData of filesData) {
          if (fileData.tempfile !== undefined) {
            await ensureDir(uploadPath);
            await move(
              fileData.tempfile,
              join(uploadPath, fileData.filename)
            );
          }
        }
      }
    } else {
      context.throw(Status.BadRequest, "Bad Request, body must be a multipart form data.");
    }
    context.response.body = "success";
  })
  .delete("/blobs/:fileName", async (context) =>{
    if (context.params && context.params.fileName) {
      if(await exists(join(uploadPath, context.params.fileName))){
        Deno.remove(join(uploadPath, context.params.fileName));
        context.response.body = {"status": true}
      } else {
        context.throw(Status.NotFound, "File not found");
      }
    } else {
      context.throw(Status.BadRequest, "Missing parameter - filename");
    }
  });

export { blobRouter }