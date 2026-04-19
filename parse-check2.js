const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const scriptMatches = html.matchAll(/<script>(.*?)<\/script>/gs);
const vm = require('vm');
let count = 0;
for (const match of scriptMatches) {
  count++;
  try {
    new vm.Script(match[1]);
    console.log("Script index", count, "OK");
  } catch (e) {
    console.error("Syntax Error in script", count, ":", e);
  }
}
