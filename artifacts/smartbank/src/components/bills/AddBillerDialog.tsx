import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, GROUPS, type BillCategoryKey } from "@/lib/bills";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(80),
  category: z.string().min(1) as unknown as z.ZodType<BillCategoryKey>,
  provider: z.string().trim().max(60).optional().or(z.literal("")),
  account_ref: z.string().trim().max(60).optional().or(z.literal("")),
  due_day: z.coerce.number().int().min(1).max(31).optional().or(z.nan()),
  default_amount: z.coerce.number().positive().max(10_000_000).optional().or(z.nan()),
  autopay: z.boolean(),
  autopay_max: z.coerce.number().positive().max(10_000_000).optional().or(z.nan()),
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Pre-select a category. */
  defaultCategory?: BillCategoryKey;
  onCreated?: () => void;
}

export const AddBillerDialog = ({ open, onOpenChange, defaultCategory, onCreated }: Props) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(() => ({
    name: "",
    category: (defaultCategory ?? "electricity") as BillCategoryKey,
    provider: "",
    account_ref: "",
    due_day: "" as string | number,
    default_amount: "" as string | number,
    autopay: false,
    autopay_max: "" as string | number,
  }));

  // Reset whenever the dialog opens
  const reset = () => {
    setForm({
      name: "", category: (defaultCategory ?? "electricity") as BillCategoryKey,
      provider: "", account_ref: "", due_day: "", default_amount: "",
      autopay: false, autopay_max: "",
    });
  };

  async function submit() {
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    const payload = {
      user_id: user.id,
      name: parsed.data.name,
      category: parsed.data.category,
      provider: parsed.data.provider || null,
      account_ref: parsed.data.account_ref || null,
      due_day: Number.isFinite(parsed.data.due_day as number) ? (parsed.data.due_day as number) : null,
      default_amount: Number.isFinite(parsed.data.default_amount as number) ? (parsed.data.default_amount as number) : null,
      autopay: parsed.data.autopay,
      autopay_max: Number.isFinite(parsed.data.autopay_max as number) ? (parsed.data.autopay_max as number) : null,
    };
    const { error } = await supabase.from("billers").insert(payload as never);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Biller saved");
    reset();
    onOpenChange(false);
    onCreated?.();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!submitting) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a biller</DialogTitle>
          <DialogDescription>
            Save a bill so you can pay, track due dates, and get spending insights.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm(f => ({ ...f, category: v as BillCategoryKey }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GROUPS.map(group => (
                  <div key={group}>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{group}</div>
                    {CATEGORIES.filter(c => c.group === group).map(c => (
                      <SelectItem key={c.key} value={c.key}>
                        <span className="inline-flex items-center gap-2">
                          <c.icon className="h-3.5 w-3.5" /> {c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Nickname</Label>
            <Input
              placeholder="e.g. Home electricity"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              maxLength={80}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Provider</Label>
              <Input
                placeholder="e.g. Tata Power"
                value={form.provider}
                onChange={(e) => setForm(f => ({ ...f, provider: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Account / Reference</Label>
              <Input
                placeholder="Consumer no."
                value={form.account_ref}
                onChange={(e) => setForm(f => ({ ...f, account_ref: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Due day (1-31)</Label>
              <Input
                type="number" min={1} max={31}
                placeholder="e.g. 15"
                value={form.due_day}
                onChange={(e) => setForm(f => ({ ...f, due_day: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Default amount (₹)</Label>
              <Input
                type="number" min={0} step="0.01"
                placeholder="Optional"
                value={form.default_amount}
                onChange={(e) => setForm(f => ({ ...f, default_amount: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
            <div>
              <div className="text-sm font-medium">Auto-pay</div>
              <div className="text-xs text-muted-foreground">Pay automatically on due day if balance allows.</div>
            </div>
            <Switch
              checked={form.autopay}
              onCheckedChange={(v) => setForm(f => ({ ...f, autopay: v }))}
            />
          </div>

          {form.autopay && (
            <div className="grid gap-2">
              <Label>Auto-pay max (₹)</Label>
              <Input
                type="number" min={0} step="0.01"
                placeholder="Skip if bill exceeds this"
                value={form.autopay_max}
                onChange={(e) => setForm(f => ({ ...f, autopay_max: e.target.value }))}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save biller"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
