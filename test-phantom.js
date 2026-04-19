const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

const dom = new JSDOM(fs.readFileSync('test-onerror.html', 'utf-8'), { runScripts: "dangerously", resources: "usable" });
setTimeout(() => {
  console.log(dom.window.document.getElementById('test').innerHTML);
}, 1000);
