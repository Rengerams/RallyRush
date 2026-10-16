function createContentSecurityPolicy({ development = false, nonce } = {}) {
  if (development && !/^[A-Za-z0-9_-]+$/.test(nonce || "")) {
    throw new Error("Desktop development CSP requires a generated nonce.");
  }

  const scriptSource = development ? `script-src 'self' 'nonce-${nonce}'` : "script-src 'self'";
  return [
    "default-src 'self'",
    scriptSource,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self' http://localhost:* ws://localhost:* https://fonts.googleapis.com https://fonts.gstatic.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

module.exports = { createContentSecurityPolicy };
