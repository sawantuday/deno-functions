// Worker.ts 
self.addEventListener('message', ev => {
    try {
      const {data} = ev as MessageEvent;
      console.log('worker <- main:', data);
      const value = data > 0 ? data * 2 : undefined;
      (self as any).postMessage(value);
      console.log('worker -> main:', value);
    }
    catch (ex) {
      console.error(ex);
    }
});

// main.ts
const data = 0;

const main = async (): Promise<void> => {
  let resolve: (value: number) => void;

  const workerUrl = new URL('worker.ts', import.meta.url).href;
  const worker = new Worker(workerUrl, {deno: true, type: 'module'});

  const handleWorkerMessage = (ev: MessageEvent): void => {
    const {data} = ev;
    console.log('main <- worker:', data);
    resolve(data);
    worker.terminate();
  };

  worker.addEventListener('message', handleWorkerMessage);
  worker.addEventListener('messageerror', () => console.log('message error'));
  worker.addEventListener('error', () => console.log('error'));

  const result = await new Promise(res => {
    resolve = res;
    worker.postMessage(data);
    console.log('main -> worker:', data);
  });

  console.log(result);
};

if (import.meta.main) main();

// trigger this main() function with RequestEvent.request 
// pass request as a message 
// worker will send back message after processing request 
// in the promise resolve create new response and return 