
const clientIo = io("http://localhost:3000/", {
    auth: { authorization: "System eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OGM4MmEwYWIxODVkZDJiMzFhNmVmZWEiLCJpYXQiOjE3NTkzNDMwNzQsImV4cCI6MTc1OTM0NDg3NCwianRpIjoiMGJTVWVoeVFIUEFBVHByYVNNck1NIn0.OP4FUd-8SclmvG5D8UqmOUynBCtuNTikabPTJPCgxX4" }
});
//const clientIo2 = io("http://localhost:3000/admin");






clientIo.on("connect", () => {
    console.log("Server establish connection successfully 💗");
    
});

clientIo.on("connect_error", (error) => {
    console.log(`Connection error ::: ${error.message}`);
    
})



clientIo.on("productStock", (data) => {
    console.log({ data });
    // callback("Done");
    
})



