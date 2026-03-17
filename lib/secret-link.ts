const encoder = new TextEncoder();
const decoder = new TextDecoder();
const AES_KEY_BYTES = 32;
const AES_GCM_IV_BYTES = 12;
const FORMAT_VERSION = 1;

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

function packSecretParts(iv: Uint8Array, cipher: Uint8Array, key: Uint8Array) {
  const packed = new Uint8Array(1 + iv.length + cipher.length + key.length);
  packed[0] = FORMAT_VERSION;
  packed.set(iv, 1);
  packed.set(cipher, 1 + iv.length);
  packed.set(key, 1 + iv.length + cipher.length);
  return packed;
}

function unpackSecretParts(bytes: Uint8Array) {
  const version = bytes[0];

  if (version !== FORMAT_VERSION) {
    throw new Error("Unsupported secret format");
  }

  if (bytes.length < 1 + AES_GCM_IV_BYTES + AES_KEY_BYTES + 16) {
    throw new Error("Invalid secret payload");
  }

  const ivEnd = 1 + AES_GCM_IV_BYTES;
  const keyStart = bytes.length - AES_KEY_BYTES;
  return {
    iv: bytes.slice(1, ivEnd),
    data: bytes.slice(ivEnd, keyStart),
    key: bytes.slice(keyStart)
  };
}

export async function createSecretUrl(message: string) {
  const key = crypto.getRandomValues(new Uint8Array(AES_KEY_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES));
  const cryptoKey = await importKey(key);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, encoder.encode(message));
  const packed = packSecretParts(iv, new Uint8Array(cipher), key);
  const hash = `#${toBase64Url(packed)}`;
  return `${window.location.origin}/view${hash}`;
}

export async function decryptSecretFromHash(hash: string) {
  const cleaned = hash.replace(/^#/, "");
  let key: Uint8Array;
  let iv: Uint8Array;
  let data: Uint8Array;

  if (cleaned.includes(".")) {
    const [payloadPart, keyPart] = cleaned.split(".");

    if (!payloadPart || !keyPart) {
      throw new Error("Invalid hash");
    }

    const payload = JSON.parse(decoder.decode(fromBase64Url(payloadPart))) as Payload;
    key = fromBase64Url(keyPart);
    iv = fromBase64Url(payload.iv);
    data = fromBase64Url(payload.data);
  } else {
    const unpacked = unpackSecretParts(fromBase64Url(cleaned));
    key = unpacked.key;
    iv = unpacked.iv;
    data = unpacked.data;
  }

  const cryptoKey = await importKey(key);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, data);

  return decoder.decode(plain);
}

export function wipeHashFromUrl() {
  const url = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState(null, "", url);
}
