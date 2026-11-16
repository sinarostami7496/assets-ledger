const PBKDF2_ITERATIONS = 120_000;

export const PIN_LENGTH = 4;

/** @deprecated use PIN_LENGTH */
export const PIN_MIN_LENGTH = PIN_LENGTH;

/** @deprecated use PIN_LENGTH */
export const PIN_MAX_LENGTH = PIN_LENGTH;

export function isValidPinFormat(pin) {
  if (typeof pin !== 'string') return false;
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function hashPin(pin, saltBase64) {
  const salt = saltBase64 ? base64ToBytes(saltBase64) : crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return {
    salt: bytesToBase64(salt),
    hash: bytesToBase64(new Uint8Array(derived)),
  };
}

export async function verifyPin(pin, saltBase64, hashBase64) {
  if (!isValidPinFormat(pin) || !saltBase64 || !hashBase64) return false;
  const { hash } = await hashPin(pin, saltBase64);
  return hash === hashBase64;
}

export const EMPTY_PIN_LOCK = { enabled: false, hash: null, salt: null };

export function migratePinLock(raw) {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_PIN_LOCK };
  const enabled = !!raw.enabled && !!raw.hash && !!raw.salt;
  return {
    enabled,
    hash: enabled ? String(raw.hash) : null,
    salt: enabled ? String(raw.salt) : null,
  };
}