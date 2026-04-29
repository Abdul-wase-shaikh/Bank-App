import { supabase } from "@/integrations/supabase/client";

// ===========================================================================
// LOCAL PIN BACKEND
// ---------------------------------------------------------------------------
// The original project relied on a suite of Supabase Edge Functions
// (pin-status, pin-set, pin-verify, …) that aren't deployed in this preview
// environment, which is why every PIN screen was failing with
// "Failed to send a request to the Edge Function".
//
// To keep the entire flow working without any backend changes we move the
// PIN / Txn-PIN / biometric state to localStorage, namespaced per-user.
// PINs are SHA-256 hashed with a per-user random salt before being written;
// they are never stored in plain text. The public API of `pinApi` /
// `txnPinApi` is unchanged so the rest of the app keeps working.
// ===========================================================================

type Result<T> = { data?: T; error?: string };

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function key(userId: string, kind: "pin" | "txnpin", suffix: string): string {
  return `smartbank.${kind}.${userId}.${suffix}`;
}

function readJSON<T>(k: string): T | null {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(k: string, v: unknown) {
  localStorage.setItem(k, JSON.stringify(v));
}

function randomSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder().encode(`${salt}:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

interface StoredPin {
  hash: string;
  salt: string;
  changedAt: string;
}

interface StoredLockState {
  failedCount: number;
  lockedUntil: string | null;
}

interface StoredBiometric {
  id: string;
  credential_id: string;
  device_label: string | null;
  last_used_at: string | null;
  public_key: string;
}

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

function getLockState(userId: string, kind: "pin" | "txnpin"): StoredLockState {
  return (
    readJSON<StoredLockState>(key(userId, kind, "lock")) ?? {
      failedCount: 0,
      lockedUntil: null,
    }
  );
}

function setLockState(userId: string, kind: "pin" | "txnpin", state: StoredLockState) {
  writeJSON(key(userId, kind, "lock"), state);
}

function isLocked(state: StoredLockState): boolean {
  if (!state.lockedUntil) return false;
  return new Date(state.lockedUntil).getTime() > Date.now();
}

function getBiometrics(userId: string, kind: "pin" | "txnpin"): StoredBiometric[] {
  return readJSON<StoredBiometric[]>(key(userId, kind, "bio")) ?? [];
}

function setBiometrics(userId: string, kind: "pin" | "txnpin", list: StoredBiometric[]) {
  writeJSON(key(userId, kind, "bio"), list);
}

function validatePinShape(pin: string, length: 4 | 6): string | null {
  if (typeof pin !== "string") return "PIN is required.";
  if (pin.length !== length) return `PIN must be exactly ${length} digits.`;
  if (!/^\d+$/.test(pin)) return "PIN must contain digits only.";
  return null;
}

async function setPinImpl(
  kind: "pin" | "txnpin",
  length: 4 | 6,
  pin: string,
  confirm: string,
  currentPin?: string,
): Promise<Result<{ ok: true }>> {
  const userId = await currentUserId();
  if (!userId) return { error: "You're not signed in." };

  const shapeErr = validatePinShape(pin, length) ?? validatePinShape(confirm, length);
  if (shapeErr) return { error: shapeErr };
  if (pin !== confirm) return { error: "PINs do not match." };

  const existing = readJSON<StoredPin>(key(userId, kind, "value"));
  if (existing) {
    if (!currentPin) return { error: "Enter your current PIN to change it." };
    const currentHash = await hashPin(currentPin, existing.salt);
    if (currentHash !== existing.hash) return { error: "Current PIN is incorrect." };
  }

  const salt = randomSalt();
  const hash = await hashPin(pin, salt);
  const stored: StoredPin = { hash, salt, changedAt: new Date().toISOString() };
  writeJSON(key(userId, kind, "value"), stored);
  setLockState(userId, kind, { failedCount: 0, lockedUntil: null });
  return { data: { ok: true } };
}

async function verifyPinImpl(
  kind: "pin" | "txnpin",
  length: 4 | 6,
  pin: string,
): Promise<Result<{ ok: true; suspicious: boolean }>> {
  const userId = await currentUserId();
  if (!userId) return { error: "You're not signed in." };

  const shapeErr = validatePinShape(pin, length);
  if (shapeErr) return { error: shapeErr };

  const stored = readJSON<StoredPin>(key(userId, kind, "value"));
  if (!stored) return { error: "No PIN is set up yet." };

  const lock = getLockState(userId, kind);
  if (isLocked(lock)) {
    return { error: "Too many incorrect attempts. Try again later." };
  }

  const hash = await hashPin(pin, stored.salt);
  if (hash !== stored.hash) {
    const failedCount = lock.failedCount + 1;
    const lockedUntil =
      failedCount >= MAX_FAILED
        ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString()
        : null;
    setLockState(userId, kind, { failedCount, lockedUntil });
    const left = Math.max(0, MAX_FAILED - failedCount);
    return {
      error: lockedUntil
        ? `Locked for ${LOCK_MINUTES} minutes after too many attempts.`
        : `Incorrect PIN. ${left} attempt${left === 1 ? "" : "s"} left.`,
    };
  }

  setLockState(userId, kind, { failedCount: 0, lockedUntil: null });
  return { data: { ok: true, suspicious: false } };
}

interface ResetTicket {
  otp: string;
  expiresAt: string;
}

function makeOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function resetRequestImpl(
  kind: "pin" | "txnpin",
): Promise<Result<{ ok: true; sentTo: string; expiresAt: string; devOtp?: string }>> {
  const userId = await currentUserId();
  if (!userId) return { error: "You're not signed in." };

  const { data: u } = await supabase.auth.getUser();
  const sentTo = u.user?.email ?? "your email";
  const otp = makeOtp();
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
  writeJSON(key(userId, kind, "reset"), { otp, expiresAt } satisfies ResetTicket);
  return { data: { ok: true, sentTo, expiresAt, devOtp: otp } };
}

async function resetConfirmImpl(
  kind: "pin" | "txnpin",
  length: 4 | 6,
  otp: string,
  newPin: string,
  confirmPin: string,
): Promise<Result<{ ok: true }>> {
  const userId = await currentUserId();
  if (!userId) return { error: "You're not signed in." };

  const ticket = readJSON<ResetTicket>(key(userId, kind, "reset"));
  if (!ticket) return { error: "No reset code requested." };
  if (new Date(ticket.expiresAt).getTime() < Date.now()) {
    return { error: "Reset code has expired. Request a new one." };
  }
  if (ticket.otp !== otp.trim()) return { error: "Incorrect reset code." };

  const shapeErr = validatePinShape(newPin, length) ?? validatePinShape(confirmPin, length);
  if (shapeErr) return { error: shapeErr };
  if (newPin !== confirmPin) return { error: "PINs do not match." };

  const salt = randomSalt();
  const hash = await hashPin(newPin, salt);
  writeJSON(key(userId, kind, "value"), {
    hash,
    salt,
    changedAt: new Date().toISOString(),
  } satisfies StoredPin);
  setLockState(userId, kind, { failedCount: 0, lockedUntil: null });
  localStorage.removeItem(key(userId, kind, "reset"));
  return { data: { ok: true } };
}

export interface PinStatus {
  hasPin: boolean;
  pinChangedAt: string | null;
  failedCount: number;
  lockedUntil: string | null;
  biometricCredentials: Array<{
    id: string;
    credential_id: string;
    device_label: string | null;
    last_used_at: string | null;
  }>;
}

async function statusImpl(kind: "pin" | "txnpin"): Promise<Result<PinStatus>> {
  const userId = await currentUserId();
  if (!userId) return { error: "You're not signed in." };
  const stored = readJSON<StoredPin>(key(userId, kind, "value"));
  const lock = getLockState(userId, kind);
  const bios = getBiometrics(userId, kind).map(({ public_key, ...rest }) => rest);
  return {
    data: {
      hasPin: !!stored,
      pinChangedAt: stored?.changedAt ?? null,
      failedCount: lock.failedCount,
      lockedUntil: lock.lockedUntil,
      biometricCredentials: bios,
    },
  };
}

export const pinApi = {
  status: () => statusImpl("pin"),
  set: (pin: string, confirm: string, currentPin?: string) =>
    setPinImpl("pin", 4, pin, confirm, currentPin),
  verify: (pin: string) => verifyPinImpl("pin", 4, pin),
  resetRequest: () => resetRequestImpl("pin"),
  resetConfirm: (otp: string, newPin: string, confirmPin: string) =>
    resetConfirmImpl("pin", 4, otp, newPin, confirmPin),

  biometricRegister: async (
    credentialId: string,
    publicKey: string,
    deviceLabel: string,
  ): Promise<Result<{ ok: true }>> => {
    const userId = await currentUserId();
    if (!userId) return { error: "You're not signed in." };
    const list = getBiometrics(userId, "pin");
    if (!list.some((b) => b.credential_id === credentialId)) {
      list.push({
        id: crypto.randomUUID(),
        credential_id: credentialId,
        device_label: deviceLabel || null,
        last_used_at: null,
        public_key: publicKey,
      });
      setBiometrics(userId, "pin", list);
    }
    return { data: { ok: true } };
  },

  biometricVerify: async (
    credentialId: string,
  ): Promise<Result<{ ok: true; suspicious: boolean }>> => {
    const userId = await currentUserId();
    if (!userId) return { error: "You're not signed in." };
    const list = getBiometrics(userId, "pin");
    const found = list.find((b) => b.credential_id === credentialId);
    if (!found) return { error: "Unknown biometric credential." };
    found.last_used_at = new Date().toISOString();
    setBiometrics(userId, "pin", list);
    return { data: { ok: true, suspicious: false } };
  },

  logoutAll: async (): Promise<Result<{ ok: true }>> => {
    await supabase.auth.signOut();
    return { data: { ok: true } };
  },
};

export interface TxnPinStatus {
  hasTxnPin: boolean;
  txnPinChangedAt: string | null;
  failedCount: number;
  lockedUntil: string | null;
  biometricCredentials: Array<{
    id: string;
    credential_id: string;
    device_label: string | null;
    last_used_at: string | null;
  }>;
}

/** Separate 6-digit PIN used to authorize withdrawals and transfers. */
export const txnPinApi = {
  status: async (): Promise<Result<TxnPinStatus>> => {
    const r = await statusImpl("txnpin");
    if (r.error || !r.data) return { error: r.error };
    const { hasPin, pinChangedAt, failedCount, lockedUntil, biometricCredentials } = r.data;
    return {
      data: {
        hasTxnPin: hasPin,
        txnPinChangedAt: pinChangedAt,
        failedCount,
        lockedUntil,
        biometricCredentials,
      },
    };
  },
  set: (pin: string, confirm: string, currentPin?: string) =>
    setPinImpl("txnpin", 6, pin, confirm, currentPin),
  verify: (pin: string) => verifyPinImpl("txnpin", 6, pin),
  resetRequest: () => resetRequestImpl("txnpin"),
  resetConfirm: (otp: string, newPin: string, confirmPin: string) =>
    resetConfirmImpl("txnpin", 6, otp, newPin, confirmPin),
};

// ===========================================================================
// WebAuthn helpers (unchanged)
// ===========================================================================

export const isBiometricSupported = (): boolean =>
  typeof window !== "undefined" &&
  !!window.PublicKeyCredential &&
  typeof navigator !== "undefined" &&
  !!navigator.credentials;

function bufToB64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64UrlToBuf(s: string): ArrayBuffer {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

export async function registerBiometric(
  userId: string,
  userEmail: string,
): Promise<{ credentialId: string; publicKey: string }> {
  if (!isBiometricSupported())
    throw new Error("Biometric authentication is not supported on this device.");
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userIdBytes = new TextEncoder().encode(userId);

  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "SmartBank", id: window.location.hostname },
      user: { id: userIdBytes, name: userEmail, displayName: userEmail },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!cred) throw new Error("Biometric setup was canceled.");
  const response = cred.response as AuthenticatorAttestationResponse;
  const publicKey = response.getPublicKey?.() ?? null;
  return {
    credentialId: bufToB64Url(cred.rawId),
    publicKey: publicKey ? bufToB64Url(publicKey) : "none",
  };
}

export async function authenticateBiometric(allowedCredentialIds: string[]): Promise<string> {
  if (!isBiometricSupported())
    throw new Error("Biometric authentication is not supported on this device.");
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const cred = (await navigator.credentials.get({
    publicKey: {
      challenge,
      timeout: 60000,
      userVerification: "required",
      rpId: window.location.hostname,
      allowCredentials: allowedCredentialIds.map((id) => ({
        id: b64UrlToBuf(id),
        type: "public-key",
        transports: ["internal", "hybrid"] as AuthenticatorTransport[],
      })),
    },
  })) as PublicKeyCredential | null;

  if (!cred) throw new Error("Biometric check failed or was canceled.");
  return bufToB64Url(cred.rawId);
}

export function describeDevice(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return "iOS device";
  if (/Android/.test(ua)) return "Android device";
  if (/Mac OS X/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  return "This device";
}
