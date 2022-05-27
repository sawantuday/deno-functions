
self.onmessage = (event)=>{
    console.log("new message received!!");
    console.log(event.data);
};

addEventListener("fetch", (e)=>{
    console.log("fetch event received");
    console.log(e);
});

console.log("worker started");
// self.close();