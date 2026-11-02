// A stand-in for the GoHighLevel API, for local tests only: records what the site sends and answers like GHL.
// node scripts/mock-ghl.mjs 3999  (then run the site with GHL_API_BASE=http://127.0.0.1:3999)
import { createServer } from "node:http";
const port = Number(process.argv[2] || 3999);
const calls = [];
createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    if (req.method === "GET" && req.url === "/__calls") { res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify(calls)); }
    const json = body ? JSON.parse(body) : {};
    calls.push({ method: req.method, url: req.url, auth: req.headers.authorization, version: req.headers.version, body: json });
    res.writeHead(200, { "content-type": "application/json" });
    if (req.url === "/contacts/upsert") return res.end(JSON.stringify({ new: true, contact: { id: "contact123abc", email: json.email, locationId: json.locationId }, traceId: "t1" }));
    res.end(JSON.stringify({ ok: true }));
  });
}).listen(port, "127.0.0.1", () => console.log(`mock GHL on ${port}`));
