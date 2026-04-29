import { supabase } from "@/integrations/supabase/client";

// ---------- API wrappers ----------
type Json = Record<string, unknown>;

async function call<T = any>(name: string, body?: Json): Promise<{ data?: T; error?: string; status?: number; raw?: any }> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    // supabase wraps non-2xx responses; try to surface the JSON message
    const ctx: any = (error as any).context;
    let msg = error.message;
    let payload: any = undefined;
    try {
      if (ctx?.body) {
        const text = typeof ctx.body === "string" ? ctx.body : await new Response(ctx.body).text();
        payload = JSON.parse(text);
        if (payload?.error) msg = payload.error;
      }
    } catch { /* ignore */ }
    return { error: msg, status: ctx?.status, raw: payload };
  }
  return { data: data as T };
}

export interface PinStatus {
  hasPin: boolean;
  pinChangedAt: string | null;
  failedCount: number;
  lockedUntil: string | null;
  biometricCredentials: Array<{ id: string; credential_id: string; device_label: string | null; last_used_at: string | null }>;
}

export const pinApi = {
  status: () => call<PinStatus>("pin-status"),
  set: (pin: string, confirm: string, currentPin?: string) =>
    call<{ ok: true }>("pin-set", { pin, confirm, currentPin }),
  verify: (pin: string) => call<{ ok: true; suspicious: boolean }>("pin-verify", { pin }),
  resetRequest: () => call<{ ok: true; sentTo: string; expiresAt: string; devOtp?: string }>("pin-reset-request"),
  resetConfirm: (otp: string, newPin: string, confirmPin: string) =>
    call<{ ok: true }>("pin-reset-confirm", { otp, newPin, confirmPin }),
  biometricRegister: (credentialId: string, publicKey: string, deviceLabel: string) =>
    call<{ ok: true }>("biometric-register", { credentialId, publicKey, deviceLabel }),
  biometricVerify: (credentialId: string) =>
    call<{ ok: true; suspicious: boolean }>("biometric-verify", { credentialId }),
  logoutAll: () => call<{ ok: true }>("logout-all-devices"),
};

export interface TxnPinStatus {
  hasTxnPin: boolean;
  txnPinChangedAt: string | null;
  failedCount: number;
  lockedUntil: string | null;
  biometricCredentials: Array<{ id: string; credential_id: string; device_label: string | null; last_used_at: string | null }>;
}

/** Separate 6-digit PIN used to authorize withdrawals and transfers. */
export const txnPinApi = {
  status: () => call<TxnPinStatus>("txn-pin-status"),
  set: (pin: string, confirm: string, currentPin?: string) =>
    call<{ ok: true }>("txn-pin-set", { pin, confirm, currentPin }),
  verify: (pin: string) => call<{ ok: true }>("txn-pin-verify", { pin }),
  resetRequest: () =>
    call<{ ok: true; sentTo: string; expiresAt: string; devOtp?: string }>("txn-pin-reset-request"),
  resetConfirm: (otp: string, newPin: string, confirmPin: string) =>
    call<{ ok: true }>("txn-pin-reset-confirm", { otp, newPin, confirmPin }),
};

// ---------- WebAuthn helpers ----------
export const isBiometricSupported = (): boolean =>
  typeof window !== "undefined" &&
  !!window.PublicKeyCredential &&
  typeof navigator !== "undefined" && !!navigator.credentials;

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

export async function registerBiometric(userId: string, userEmail: string): Promise<{ credentialId: string; publicKey: string }> {
  if (!isBiometricSupported()) throw new Error("Biometric authentication is not supported on this device.");
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userIdBytes = new TextEncoder().encode(userId);

  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "SmartBank", id: window.location.hostname },
      user: { id: userIdBytes, name: userEmail, displayName: userEmail },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },   // ES256
        { type: "public-key", alg: -257 }, // RS256
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
  const publicKey = (response.getPublicKey?.() ?? null);
  return {
    credentialId: bufToB64Url(cred.rawId),
    publicKey: publicKey ? bufToB64Url(publicKey) : "none",
  };
}

export async function authenticateBiometric(allowedCredentialIds: string[]): Promise<string> {
  if (!isBiometricSupported()) throw new Error("Biometric authentication is not supported on this device.");
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
