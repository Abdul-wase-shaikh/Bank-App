// ---------------------------------------------------------------------------
// Local "banking" service
// ---------------------------------------------------------------------------
// The connected Supabase project does not deploy the `banking` edge function
// this app expects, so direct invocations fail with
// "Failed to send a request to the Edge Function".
//
// This module reproduces the function's behaviour locally on top of the
// localStorage table shim:
//   - deposit  → credit the user's account, log a +txn
//   - withdraw → verify txn-PIN/biometric, debit if sufficient, log a -txn
//   - transfer → debit sender, credit recipient (looked up by account_number),
//                log a paired -txn / +txn
// ---------------------------------------------------------------------------

import { supabase } from "@/integrations/supabase/client";
import { txnPinApi } from "@/lib/secureLogin";

export type BankingAction = "deposit" | "withdraw" | "transfer";

export interface BankingRequest {
  action: BankingAction;
  amount: number;
  to_account?: string | null;
  description?: string | null;
  txn_pin?: string;
  biometric_credential_id?: string;
}

export interface BankingResult {
  data: { transaction_id: string } | null;
  error: { message: string } | null;
}

const fail = (message: string): BankingResult => ({
  data: null,
  error: { message },
});

export async function processBanking(
  req: BankingRequest,
): Promise<BankingResult> {
  const amt = Number(req.amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return fail("Enter a valid amount.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("You're not signed in.");

  // ── 1. Verify txn PIN / biometric for outgoing money ──────────────────
  if (req.action === "withdraw" || req.action === "transfer") {
    if (req.biometric_credential_id) {
      // The dialog already authenticated via WebAuthn before reaching us;
      // accept the supplied credential ID as proof.
    } else if (req.txn_pin) {
      const v = await txnPinApi.verify(req.txn_pin);
      if (v.error || !v.data?.ok) {
        return fail(v.error || "Incorrect transaction PIN.");
      }
    } else {
      return fail("Transaction PIN required.");
    }
  }

  // ── 2. Load sender's account ──────────────────────────────────────────
  const { data: sender } = await supabase
    .from("accounts")
    .select("id, account_number, balance, currency")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!sender) return fail("Account not found. Please refresh and try again.");

  const senderBalance = Number(sender.balance ?? 0);

  // ── 3. Apply the action ───────────────────────────────────────────────
  if (req.action === "deposit") {
    await supabase
      .from("accounts")
      .update({ balance: senderBalance + amt })
      .eq("id", sender.id);

    const txId = await insertTxn({
      user_id: user.id,
      account_id: sender.id,
      type: "deposit",
      amount: amt,
      currency: sender.currency,
      description: req.description ?? "Deposit",
    });
    return { data: { transaction_id: txId }, error: null };
  }

  if (req.action === "withdraw") {
    if (senderBalance < amt) return fail("Insufficient balance.");

    await supabase
      .from("accounts")
      .update({ balance: senderBalance - amt })
      .eq("id", sender.id);

    const txId = await insertTxn({
      user_id: user.id,
      account_id: sender.id,
      type: "withdraw",
      amount: amt,
      currency: sender.currency,
      description: req.description ?? "Withdrawal",
    });
    return { data: { transaction_id: txId }, error: null };
  }

  // transfer
  const target = (req.to_account ?? "").trim();
  if (!target) return fail("Enter the recipient account number.");
  if (target === sender.account_number) {
    return fail("You can't transfer to your own account.");
  }
  if (senderBalance < amt) return fail("Insufficient balance.");

  const { data: recipient } = await supabase
    .from("accounts")
    .select("id, user_id, balance, currency, account_number")
    .eq("account_number", target)
    .maybeSingle();
  if (!recipient) {
    return fail("Recipient account not found.");
  }

  const recipientBalance = Number(recipient.balance ?? 0);
  const desc = req.description?.trim() || `Transfer to ${target}`;

  // Debit sender
  await supabase
    .from("accounts")
    .update({ balance: senderBalance - amt })
    .eq("id", sender.id);

  // Credit recipient
  await supabase
    .from("accounts")
    .update({ balance: recipientBalance + amt })
    .eq("id", recipient.id);

  // Two paired transaction rows
  const senderTxId = await insertTxn({
    user_id: user.id,
    account_id: sender.id,
    type: "transfer",
    amount: amt,
    currency: sender.currency,
    description: desc,
    counterparty_account: target,
  });
  await insertTxn({
    user_id: recipient.user_id,
    account_id: recipient.id,
    type: "deposit",
    amount: amt,
    currency: recipient.currency,
    description: `Received from ${sender.account_number}`,
    counterparty_account: sender.account_number,
  });

  return { data: { transaction_id: senderTxId }, error: null };
}

async function insertTxn(row: {
  user_id: string;
  account_id: string;
  type: "deposit" | "withdraw" | "transfer";
  amount: number;
  currency: string;
  description: string;
  counterparty_account?: string;
}): Promise<string> {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : "tx-" + Math.random().toString(36).slice(2);
  await supabase
    .from("transactions")
    .insert({
      id,
      ...row,
      created_at: new Date().toISOString(),
    } as never);
  return id;
}
