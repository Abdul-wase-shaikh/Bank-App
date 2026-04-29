import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Mail, Phone, Wallet } from "lucide-react";
import { AdminAcct, AdminProfile, AdminTx } from "@/lib/admin/insights";
import { formatCurrency, formatDate } from "@/lib/format";

type Props = {
  open: boolean;
  onClose: () => void;
  account: AdminAcct | null;
  profile: AdminProfile | null;
  email?: string | null;
  phone?: string | null;
  txs: AdminTx[];
};

const TX_ICON = {
  deposit: ArrowDownToLine,
  withdraw: ArrowUpFromLine,
  transfer: ArrowLeftRight,
};

export const CustomerDetailDialog = ({ open, onClose, account, profile, email, phone, txs }: Props) => {
  const userTxs = useMemo(
    () => (account ? txs.filter((t) => t.user_id === account.user_id).slice(0, 12) : []),
    [account, txs],
  );

  if (!account) return null;
  const name = profile?.full_name?.trim() || "Customer";

  const totalIn = userTxs.filter((t) => t.type === "deposit").reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = userTxs.filter((t) => t.type !== "deposit").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl border-border/60 bg-card/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-primary-foreground font-semibold">
              {name.slice(0, 1).toUpperCase()}
            </div>
            <span>
              <span className="block text-base font-semibold">{name}</span>
              <span className="block font-mono text-xs text-muted-foreground">{account.account_number}</span>
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/60 bg-background/40 p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              <Wallet className="h-3 w-3" /> Balance
            </div>
            <div className="mt-1 font-display text-lg font-bold text-gradient">{formatCurrency(account.balance)}</div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Total in</div>
            <div className="mt-1 font-display text-lg font-bold text-emerald-400">{formatCurrency(totalIn)}</div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Total out</div>
            <div className="mt-1 font-display text-lg font-bold text-amber-400">{formatCurrency(totalOut)}</div>
          </div>
        </div>

        {(email || phone) && (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {email}
              </span>
            )}
            {phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {phone}
              </span>
            )}
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">Recent activity</div>
            <Badge variant="secondary" className="text-[10px]">{userTxs.length} of {txs.filter(t=>t.user_id===account.user_id).length}</Badge>
          </div>
          <div className="max-h-72 divide-y divide-border/60 overflow-y-auto rounded-xl border border-border/60 bg-background/30">
            {userTxs.length === 0 && (
              <div className="grid h-32 place-items-center text-xs text-muted-foreground">No activity yet</div>
            )}
            {userTxs.map((t) => {
              const Icon = TX_ICON[t.type];
              const positive = t.type === "deposit";
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`grid h-8 w-8 place-items-center rounded-lg ${positive ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm capitalize">{t.type}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{formatDate(t.created_at)}{t.description ? ` - ${t.description}` : ""}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${positive ? "text-emerald-400" : ""}`}>{positive ? "+" : "-"}{formatCurrency(t.amount)}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Account holder profile - read only. Mutating actions (freeze, balance adjust) require an admin SQL migration.
        </div>
      </DialogContent>
    </Dialog>
  );
};
