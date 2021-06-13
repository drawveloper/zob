import {
  listenAndServe,
  Response,
  ServerRequest,
} from "https://deno.land/std@0.98.0/http/server.ts";
import { posix } from "https://deno.land/std@0.98.0/path/mod.ts";
import { serveFile } from "https://deno.land/std@0.98.0/http/file_server.ts";

const encoder = new TextEncoder();
function normalizeURL(url: string): string {
  let normalizedUrl = url;
  try {
    normalizedUrl = decodeURI(normalizedUrl);
  } catch (e) {
    if (!(e instanceof URIError)) {
      throw e;
    }
  }

  try {
    //allowed per https://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html
    const absoluteURI = new URL(normalizedUrl);
    normalizedUrl = absoluteURI.pathname;
  } catch (e) { //wasn't an absoluteURI
    if (!(e instanceof TypeError)) {
      throw e;
    }
  }

  if (normalizedUrl[0] !== "/") {
    throw new URIError("The request URI is malformed.");
  }

  normalizedUrl = posix.normalize(normalizedUrl);
  const startOfParams = normalizedUrl.indexOf("?");
  return startOfParams > -1
    ? normalizedUrl.slice(0, startOfParams)
    : normalizedUrl;
}

function serveFallback(_req: ServerRequest, e: Error): Promise<Response> {
  if (e instanceof URIError) {
    return Promise.resolve({
      status: 400,
      body: encoder.encode("Bad Request"),
    });
  } else if (e instanceof Deno.errors.NotFound) {
    return Promise.resolve({
      status: 404,
      body: encoder.encode("Not Found"),
    });
  } else {
    return Promise.resolve({
      status: 500,
      body: encoder.encode("Internal server error"),
    });
  }
}

function serverLog(req: ServerRequest, res: Response): void {
  const d = new Date().toISOString();
  const dateFmt = `[${d.slice(0, 10)} ${d.slice(11, 19)}]`;
  const s = `${dateFmt} "${req.method} ${req.url} ${req.proto}" ${res.status}`;
  console.log(s);
}

export function live() {
  const target = posix.resolve(`public/`);
  const handler = async (req: ServerRequest) => {
    let response: Response | undefined;
    try {
      const normalizedUrl = normalizeURL(req.url);
      let fsPath = posix.join(target, normalizedUrl);
      if (fsPath.indexOf(target) !== 0) {
        fsPath = target;
      }
      const fileInfo = await Deno.stat(fsPath);
      if (fileInfo.isDirectory) {
        fsPath = posix.join(target, "index.html");
      }
      console.log(fsPath);
      response = await serveFile(req, fsPath);
    } catch (e) {
      console.error(e.message);
      response = await serveFallback(req, e);
    } finally {
      serverLog(req, response!);
      try {
        await req.respond(response!);
      } catch (e) {
        console.error(e.message);
      }
    }
  };

  const proto = "http";
  const addr = "localhost:8080";
  listenAndServe(addr, handler);
  console.log(
    `${proto.toUpperCase()} server listening on ${proto}://${addr}/`,
  );
}
