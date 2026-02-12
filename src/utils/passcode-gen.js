import crypto from "crypto";

const CODE_PREFIX = "BTB";
const CODE_LENGTH = 6;

// Crockford Base32 without confusing chars
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function genGamePassCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = "";

  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }

  return `${CODE_PREFIX}-${code}`;
}
