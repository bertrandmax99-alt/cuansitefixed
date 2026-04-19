const jsdom = require("jsdom");
const { JSDOM } = jsdom;

JSDOM.fromURL("http://localhost:3000/", {
  runScripts: "dangerously",
  resources: "usable"
}).then(dom => {
  dom.window.console.error = () => {};
  
  setTimeout(() => {
    console.log("svc cards count:", dom.window.document.querySelectorAll('.svc-card').length);
    dom.window.document.querySelectorAll('.svc-card').forEach((el, i) => {
        console.log(`Card ${i} opacity: ${el.style.opacity}, transform: ${el.style.transform}`);
    });
    process.exit(0);
  }, 2000);
}).catch(console.error);
