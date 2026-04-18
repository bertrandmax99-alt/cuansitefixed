const { JSDOM } = require("jsdom");
const fs = require('fs');

const html = fs.readFileSync('admin.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously" });

// Log script errors
dom.window.document.addEventListener("error", (e) => {
  console.log("JSDOM Error:", e.message);
});

// We can catch undefined variables
try {
  // Let JSDOM process
} catch (e) {
  console.log("JSDOM init error:", e);
}
