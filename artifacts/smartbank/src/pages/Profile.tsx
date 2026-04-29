import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState({ full_name: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setProfile({ full_name: data.full_name ?? "", phone: data.phone ?? "" });
      setLoading(false);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(profile).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success(t("profile.saved"));
  };

  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container py-10 max-w-2xl">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-gradient-primary text-primary-foreground grid place-items-center"><UserIcon className="h-7 w-7" /></div>
        <div>
          <h1 className="font-display text-3xl">{t("profile.title")}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="glass-card p-6 mt-6 space-y-4">
        <div>
          <label className="text-sm">{t("profile.fullName")}</label>
          <input value={profile.full_name} onChange={e=>setProfile({...profile,full_name:e.target.value})} className="mt-1 w-full bg-secondary/60 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-primary/50" />
        </div>
        <div>
          <label className="text-sm">{t("profile.phone")}</label>
          <input value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})} className="mt-1 w-full bg-secondary/60 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-primary/50" />
        </div>
        <Button onClick={save} disabled={saving} className="bg-gradient-primary text-primary-foreground">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("profile.save")}
        </Button>
      </div>
    </div>
  );
};
export default Profile;
