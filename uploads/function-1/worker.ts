
export default (req: Request): Response => {
  return new Response("Hello from new worker thread!!");
}
