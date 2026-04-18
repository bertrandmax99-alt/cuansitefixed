Object.defineProperty(globalThis, 'fetch', { get() { return function() {}; }, configurable: true });

try {
  eval("var fetch = 123;");
  console.log("var fetch success");
} catch(e) {
  console.log("var fetch error:", e.message);
}

try {
  eval("async function fetch() {}");
  console.log("function fetch success");
} catch(e) {
  console.log("function fetch error:", e.message);
}
