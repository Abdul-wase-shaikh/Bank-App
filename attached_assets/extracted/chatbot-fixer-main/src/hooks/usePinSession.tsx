import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface PinSessionCtx {
  unlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

const Ctx = createContext<PinSessionCtx>({ unlocked: false, unlock: () => {}, lock: () => {} });

const KEY = "smartbank.pinUnlocked";

export const PinSessionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState(false);

  // Reset whenever user changes
  useEffect(() => {
    if (!user) {
      sessionStorage.removeItem(KEY);
      setUnlocked(false);
      return;
    }
    const stored = sessionStorage.getItem(KEY);
    setUnlocked(stored === user.id);
  }, [user?.id]);

  const unlock = () => {
    if (user) {
      sessionStorage.setItem(KEY, user.id);
      setUnlocked(true);
    }
  };
  const lock = () => {
    sessionStorage.removeItem(KEY);
    setUnlocked(false);
  };

  return <Ctx.Provider value={{ unlocked, unlock, lock }}>{children}</Ctx.Provider>;
};

export const usePinSession = () => useContext(Ctx);
