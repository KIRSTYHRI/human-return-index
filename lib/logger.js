const isProd = process.env.NODE_ENV === "production";

export function logInfo(...args) {
  if (!isProd) console.log("[INFO]", ...args);
}

export function logWarn(...args) {
  console.warn("[WARN]", ...args);
}

export function logError(...args) {
  console.error("[ERROR]", ...args);
}
