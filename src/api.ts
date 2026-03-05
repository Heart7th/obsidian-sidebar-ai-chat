import { requestUrl, Platform } from "obsidian";

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

/** Parse SSE lines and extract content deltas */
function parseSSEChunk(line: string): string | null {
  if (!line.startsWith("data: ")) return null;
  const data = line.slice(6).trim();
  if (data === "[DONE]") return null;
  try {
    const json = JSON.parse(data);
    return json.choices?.[0]?.delta?.content || null;
  } catch {
    return null;
  }
}

/** Mobile: non-streaming via requestUrl (no Node.js, no SSE support) */
async function chatViaRequestUrl(
  fullUrl: string,
  apiKey: string,
  messages: any[],
  model: string,
  projectName: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const body = JSON.stringify({
    model,
    messages,
    stream: false,
    user: `obsidian-${projectName}`,
  });

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
  } catch (e: any) {
    callbacks.onError(e instanceof Error ? e : new Error(String(e)));
  }
}

/** Desktop: SSE streaming via Node.js http/https */
async function chatViaNodeStreaming(
  fullUrl: string,
  apiKey: string,
  messages: any[],
  model: string,
  projectName: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const https = require("https") as typeof import("https");
  const http = require("http") as typeof import("http");
  const tlsAgent = new https.Agent({ rejectUnauthorized: false });

  const parsed = new URL(fullUrl);
  const isHttps = parsed.protocol === "https:";

  const body = JSON.stringify({
    model,
    messages,
    stream: true,
    user: `obsidian-${projectName}`,
  });

  const options = {
    hostname: parsed.hostname,
    port: parsed.port || (isHttps ? 443 : 80),
    path: parsed.pathname,
    method: "POST",
    timeout: 600000, // 10 min for streaming (agent may do long tool calls between chunks)
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Length": Buffer.byteLength(body),
      Accept: "text/event-stream",
    },
    ...(isHttps ? { agent: tlsAgent } : {}),
  };

  return new Promise<void>((resolve, reject) => {
    const transport = isHttps ? https : http;
    const req = transport.request(options, (res: any) => {
      // Enable TCP keepalive on the socket to prevent idle disconnection
      if (res.socket) {
        res.socket.setKeepAlive(true, 30000); // send keepalive every 30s
        res.socket.setTimeout(600000); // 10 min socket timeout
        res.socket.on("timeout", () => {}); // prevent auto-destroy on timeout
      }

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

      let buffer = "";
      res.on("data", (chunk: any) => {
        buffer += chunk.toString();
        // Process complete lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // keep incomplete line in buffer
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === "data: [DONE]") {
            callbacks.onDone();
            return;
          }
          const content = parseSSEChunk(trimmed);
          if (content) {
            callbacks.onToken(content);
          }
        }
      });

      res.on("end", () => {
        // Process remaining buffer
        if (buffer.trim()) {
          const content = parseSSEChunk(buffer.trim());
          if (content) callbacks.onToken(content);
        }
        callbacks.onDone();
        resolve();
      });

      res.on("error", (err: Error) => {
        callbacks.onError(err);
        reject(err);
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error("Request timeout (10min) — the agent may still be working."));
    });
    req.on("error", (err: Error) => {
      callbacks.onError(err);
      reject(err);
    });
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

  // Mobile: non-streaming (requestUrl doesn't support SSE)
  // Desktop: SSE streaming via Node.js
  if (Platform.isMobile) {
    return chatViaRequestUrl(fullUrl, apiKey, messages, model, projectName, callbacks);
  }

  return chatViaNodeStreaming(fullUrl, apiKey, messages, model, projectName, callbacks);
}
