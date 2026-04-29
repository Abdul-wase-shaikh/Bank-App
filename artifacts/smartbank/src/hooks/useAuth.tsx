import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null, session: null, isAdmin: false, loading: true, signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hard-coded super-admins. Any user logging in with one of these emails
    // is granted admin access in the UI without needing a row in the
    // user_roles table. Server-side actions that depend on RLS still need a
    // matching role on Supabase.
    const SUPER_ADMIN_EMAILS = new Set<string>([
      "saniyakhan14u@gmail.com",
    ]);

    const resolveAdmin = async (sessUser: User) => {
      if (sessUser.email && SUPER_ADMIN_EMAILS.has(sessUser.email.toLowerCase())) {
        setIsAdmin(true);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sessUser.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => { void resolveAdmin(sess.user); }, 0);
      } else {
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) void resolveAdmin(s.user);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    sessionStorage.removeItem("smartbank.pinUnlocked");
    await supabase.auth.signOut();
  };

  return <Ctx.Provider value={{ user, session, isAdmin, loading, signOut }}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
