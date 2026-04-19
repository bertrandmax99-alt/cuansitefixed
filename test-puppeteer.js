const jsdom = require("jsdom");
const { JSDOM } = jsdom;

JSDOM.fromURL("http://localhost:3000/", {
  runScripts: "dangerously",
  resources: "usable"
}).then(dom => {
  // Capture console
  dom.window.console.error = (msg, err) => console.log("DOM ERROR:", msg, err);
  dom.window.console.log = (msg) => console.log("DOM LOG:", msg);

  setTimeout(() => {
    console.log("Port cards count:", dom.window.document.querySelectorAll('.port-card').length);
    dom.window.document.querySelectorAll('.port-card').forEach((el, i) => {
        console.log(`Card ${i} style=${el.getAttribute('style')}`);
    });
    process.exit(0);
  }, 2000);
}).catch(console.error);
