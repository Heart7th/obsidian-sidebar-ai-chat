import { requestUrl, Platform } from "obsidian";

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

async function chatViaRequestUrl(
  fullUrl: string,
  apiKey: string,
  body: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout

  try {
    const response = await requestUrl({
      url: fullUrl,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body,
      throw: true,
    });

    const data = response.json;
    const content = data.choices?.[0]?.message?.content;
    if (content) callbacks.onToken(content);
    callbacks.onDone();
  } finally {
    clearTimeout(timeout);
  }
}

async function chatViaNodeHttps(
  fullUrl: string,
  apiKey: string,
  body: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const https = require("https") as typeof import("https");
  const http = require("http") as typeof import("http");
  const agent = new https.Agent({ rejectUnauthorized: false });

  const parsed = new URL(fullUrl);
  const isHttps = parsed.protocol === "https:";

  const options = {
    hostname: parsed.hostname,
    port: parsed.port || (isHttps ? 443 : 80),
    path: parsed.pathname,
    method: "POST",
    timeout: 120000,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Length": Buffer.byteLength(body),
    },
    ...(isHttps ? { agent } : {}),
  };

  return new Promise<void>((resolve, reject) => {
    const transport = isHttps ? https : http;
    const req = transport.request(options, (res: any) => {
      if (res.statusCode !== 200) {
        let errBody = "";
        res.on("data", (chunk: any) => (errBody += chunk.toString()));
        res.on("end", () => {
          const err = new Error(`API error ${res.statusCode}: ${errBody}`);
          callbacks.onError(err);
          reject(err);
        });
        return;
      }

      let responseBody = "";
      res.on("data", (chunk: any) => (responseBody += chunk.toString()));
      res.on("end", () => {
        try {
          const data = JSON.parse(responseBody);
          const content = data.choices?.[0]?.message?.content;
          if (content) callbacks.onToken(content);
          callbacks.onDone();
          resolve();
        } catch (e: any) {
          callbacks.onError(new Error(`Parse error: ${e.message}`));
          reject(e);
        }
      });
      res.on("error", (err: Error) => { callbacks.onError(err); reject(err); });
    });
    req.on("timeout", () => {
      req.destroy(new Error("Request timeout — the agent may still be working. Check your notes for updates."));
    });
    req.on("error", (err: Error) => { callbacks.onError(err); reject(err); });
    req.write(body);
    req.end();
  });
}

export async function streamChat(
  apiUrl: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  projectName: string,
  callbacks: StreamCallbacks
): Promise<void> {
  let url = apiUrl.replace(/\/$/, "");
  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    url = "https://" + url;
  }
  const fullUrl = url.endsWith("/chat/completions") ? url : `${url}/chat/completions`;

  const body = JSON.stringify({
    model,
    messages,
    stream: false,
    user: `obsidian-${projectName}`,
  });

  // Mobile: always use requestUrl (no Node.js)
  // Desktop: try requestUrl first, fall back to Node https for self-signed certs
  if (Platform.isMobile) {
    return chatViaRequestUrl(fullUrl, apiKey, body, callbacks);
  }

  try {
    await chatViaRequestUrl(fullUrl, apiKey, body, callbacks);
  } catch (e: any) {
    const msg = String(e?.message || e || "");
    if (msg.includes("CERT") || msg.includes("certificate") || msg.includes("ERR_CERT")) {
      await chatViaNodeHttps(fullUrl, apiKey, body, callbacks);
    } else {
      throw e;
    }
  }
}
