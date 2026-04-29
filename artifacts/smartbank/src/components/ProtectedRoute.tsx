import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePinSession } from "@/hooks/usePinSession";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  children: ReactNode;
  adminOnly?: boolean;
  /** Skip the PIN gate for routes that ARE the unlock flow itself. */
  skipPinGate?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly = false, skipPinGate = false }: Props) => {
  const { user, isAdmin, loading } = useAuth();
  const { unlocked } = usePinSession();
  const loc = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (!skipPinGate && !unlocked) return <Navigate to="/pin-unlock" replace state={{ from: loc.pathname }} />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

