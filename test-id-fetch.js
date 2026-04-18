const { JSDOM } = require("jsdom");
const dom = new JSDOM(`<!DOCTYPE html><html id="fetch"></html>`);
console.log(dom.window.fetch);
