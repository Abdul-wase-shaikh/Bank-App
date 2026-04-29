// This file wraps the Supabase client so calls to tables that don't exist
// in the connected Supabase schema are transparently served from a
// localStorage-backed shim. See ./localTables.ts for details.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { LOCAL_TABLES, localFrom } from "./localTables";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const realClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

const realFrom = realClient.from.bind(realClient);

(realClient as any).from = (table: string) => {
  if (LOCAL_TABLES.has(table)) {
    return localFrom(table) as any;
  }
  return realFrom(table as any);
};

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = realClient;
