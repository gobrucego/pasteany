const encoder = new TextEncoder();
const decoder = new TextDecoder();

type Payload = {
  iv: string;
  data: string;
};

function toBase64Url(bytes: Uint8Array) {
  let value = "";
  bytes.forEach((byte) => {
    value += String.fromCharCode(byte);
  });
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function importKey(rawKey: Uint8Array) {
  return crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function createSecretUrl(message: string) {
  const key = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await importKey(key);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, encoder.encode(message));
  const payload: Payload = {
    iv: toBase64Url(iv),
    data: toBase64Url(new Uint8Array(cipher))
  };
  const hash = `#${toBase64Url(encoder.encode(JSON.stringify(payload)))}.${toBase64Url(key)}`;
  return `${window.location.origin}/view${hash}`;
}

export async function decryptSecretFromHash(hash: string) {
  const cleaned = hash.replace(/^#/, "");
  const [payloadPart, keyPart] = cleaned.split(".");

  if (!payloadPart || !keyPart) {
    throw new Error("Invalid hash");
  }

  const payload = JSON.parse(decoder.decode(fromBase64Url(payloadPart))) as Payload;
  const key = fromBase64Url(keyPart);
  const cryptoKey = await importKey(key);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(payload.iv) },
    cryptoKey,
    fromBase64Url(payload.data)
  );

  return decoder.decode(plain);
}

export function wipeHashFromUrl() {
  const url = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState(null, "", url);
}
