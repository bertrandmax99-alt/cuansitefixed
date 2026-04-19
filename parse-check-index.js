const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const scriptMatches = html.matchAll(/<script>(.*?)<\/script>/gs);
const vm = require('vm');
for (const match of scriptMatches) {
  try {
    new vm.Script(match[1]);
    console.log("Script block OK");
  } catch (e) {
    console.error("Syntax Error in script:", e);
  }
}
