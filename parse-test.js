const p = { screenshot: "test" };
const str = `<div class="port-admin-thumb">${p.screenshot ? `<img src="${p.screenshot}" alt="" onerror="this.outerHTML='<i class=&quot;fas fa-image&quot;></i>';">` : '<i class="fas fa-image"></i>'}</div>`;
console.log(str);
