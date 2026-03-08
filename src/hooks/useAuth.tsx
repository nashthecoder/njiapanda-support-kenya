import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", u.id);
          setRoles(data?.map((r) => r.role) ?? []);
        } else {
          setRoles([]);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", u.id)
          .then(({ data }) => {
            setRoles(data?.map((r) => r.role) ?? []);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isConductor = roles.includes("conductor") || roles.includes("admin");
  const isAdmin = roles.includes("admin");

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, roles, isConductor, isAdmin, signOut };
}
