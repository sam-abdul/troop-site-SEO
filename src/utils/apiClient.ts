import axios from "axios";

const HMAC_SECRET = process.env.NEXT_PUBLIC_TROOP_HMAC_SECRET || "";

const encoder = new TextEncoder();

async function generateHmacSHA256Signature(
  message: string,
  secret: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message)
  );

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const api = axios.create();

api.interceptors.request.use(async (config) => {
  if (!HMAC_SECRET) {
    return config;
  }

  const timestamp = Date.now().toString();
  const method = (config.method || "GET").toUpperCase();
  const url = config.url || "";
  const data = config.data ? JSON.stringify(config.data, null, 0) : "{}";

  const requestData = `${method}:${url}:${timestamp}:${data}`;

  const signature = await generateHmacSHA256Signature(requestData, HMAC_SECRET);

  config.headers["X-HMAC-Timestamp"] = timestamp;
  config.headers["X-HMAC-Signature"] = signature;

  return config;
});

export default api;
