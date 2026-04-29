import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGsapPage } from "@/hooks/useGsapPage";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, MoreVertical, Trash2, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_MAP } from "@/lib/bills";
import { AddBillerDialog } from "@/components/bills/AddBillerDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function Billers() {
  useGsapPage();
  const { user } = useAuth();
  const [billers, setBillers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const fetchBillers = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("billers").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setBillers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBillers();
  }, [user]);

  const deleteBiller = async (id: string) => {
    const { error } = await supabase.from("billers").delete().eq("id", id);
    if (error) toast.error("Failed to delete biller");
    else {
      toast.success("Biller removed");
      fetchBillers();
    }
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8" data-anim>
        <div className="flex items-center gap-4">
          <Link to="/bills" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-display font-bold">Manage Billers</h1>
        </div>
        <Button onClick={() => setAddOpen(true)} className="rounded-full">
          <Plus className="h-4 w-4 mr-2" /> Add Biller
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-anim>
        {loading ? (
          <>
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </>
        ) : billers.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-border/60 rounded-3xl bg-secondary/10">
            <h3 className="font-medium text-lg mb-2">No saved billers</h3>
            <p className="text-sm text-muted-foreground mb-4">Add billers to easily pay them next time without entering details.</p>
            <Button onClick={() => setAddOpen(true)} variant="outline" className="rounded-full">Add your first biller</Button>
          </div>
        ) : (
          billers.map(b => {
            const meta = CATEGORY_MAP[b.category as keyof typeof CATEGORY_MAP] || CATEGORY_MAP["other"];
            return (
              <div key={b.id} className="bg-card border border-border/60 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${meta.tone} shrink-0`}>
                  <meta.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate mb-0.5">{b.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{meta.label} {b.account_ref ? `• ${b.account_ref}` : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold">{b.default_amount ? formatCurrency(b.default_amount) : ''}</div>
                  {b.autopay && <div className="text-[10px] font-medium text-emerald-500 mt-1">AUTOPAY</div>}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-1 shrink-0 rounded-full">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => deleteBiller(b.id)} className="text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        )}
      </div>

      <AddBillerDialog open={addOpen} onOpenChange={setAddOpen} onCreated={fetchBillers} />
    </div>
  );
}