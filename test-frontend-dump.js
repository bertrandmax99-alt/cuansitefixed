const jsdom = require("jsdom");
const { JSDOM } = jsdom;

JSDOM.fromURL("http://localhost:3000/", {
  runScripts: "dangerously",
  resources: "usable"
}).then(dom => {
  setTimeout(() => {
    require('fs').writeFileSync('dom-dump.html', dom.window.document.querySelector('.portfolio-grid').innerHTML);
    process.exit(0);
  }, 3000);
}).catch(console.error);
