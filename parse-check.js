const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf-8');
const scriptMatch = html.match(/<script>(.*?)<\/script>/s);
if (scriptMatch) {
  try {
    const vm = require('vm');
    const script = new vm.Script(scriptMatch[1]);
    console.log("Syntax is OK");
  } catch (e) {
    console.error("Syntax Error:", e);
  }
}
