const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf-8');
const scriptMatches = html.matchAll(/<script>([\s\S]*?)<\/script>/g);
const vm = require('vm');
let count = 0;
for (const match of scriptMatches) {
  count++;
  try {
    new vm.Script(match[1]);
    console.log("Script block", count, "OK");
  } catch (e) {
    console.error("Syntax Error in script", count, ":", e);
  }
}
