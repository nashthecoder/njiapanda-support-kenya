import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ShieldCheck, UserCog } from "lucide-react";
import { toast } from "sonner";

type ProfileResult = {
  id: string;
  full_name: string | null;
  zone: string | null;
  created_at: string;
};

type UserRole = {
  id: string;
  role: string;
  user_id: string;
};

const ROLES = ["admin", "conductor", "user"] as const;

export default function AdminUserRoles() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileResult | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [newRole, setNewRole] = useState<string>("");
  const [loadingRoles, setLoadingRoles] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    const { data, error } = await supabase.rpc("admin_search_profiles", {
      search_term: search.trim(),
    });
    if (error) {
      toast.error("Search failed", { description: error.message });
    } else {
      setResults((data as ProfileResult[]) ?? []);
    }
    setSearching(false);
  };

  const selectUser = async (profile: ProfileResult) => {
    setSelectedUser(profile);
    setLoadingRoles(true);
    const { data } = await supabase
      .from("user_roles")
      .select("id, role, user_id")
      .eq("user_id", profile.id);
    setUserRoles(data ?? []);
    setLoadingRoles(false);
  };

  const addRole = async () => {
    if (!selectedUser || !newRole) return;
    const exists = userRoles.some((r) => r.role === newRole);
    if (exists) {
      toast.error("User already has this role");
      return;
    }
    const { data, error } = await supabase
      .from("user_roles")
      .insert({ user_id: selectedUser.id, role: newRole as any })
      .select()
      .single();
    if (error) {
      toast.error("Failed to add role", { description: error.message });
    } else {
      setUserRoles((prev) => [...prev, data]);
      setNewRole("");
      toast.success(`Assigned ${newRole} role`);
    }
  };

  const removeRole = async (roleRow: UserRole) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", roleRow.id);
    if (error) {
      toast.error("Failed to remove role", { description: error.message });
    } else {
      setUserRoles((prev) => prev.filter((r) => r.id !== roleRow.id));
      toast.success(`Removed ${roleRow.role} role`);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold text-foreground">User Roles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Search for a user by name or ID, then assign or remove roles.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or user ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={searching || !search.trim()}>
          {searching ? "Searching…" : "Search"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Results */}
        <div>
          <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
            Users ({results.length})
          </Label>
          {results.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                {searching ? "Searching…" : "Search for users above."}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectUser(p)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedUser?.id === p.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      {p.full_name || "No name"}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{p.id}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Role management */}
        <div>
          <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
            Roles
          </Label>
          {selectedUser ? (
            <Card>
              <CardContent className="p-4">
                <div className="mb-4">
                  <p className="font-medium text-foreground">
                    {selectedUser.full_name || "No name"}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">{selectedUser.id}</p>
                </div>

                {loadingRoles ? (
                  <div className="h-8 animate-pulse rounded bg-muted" />
                ) : (
                  <>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {userRoles.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No roles assigned</p>
                      ) : (
                        userRoles.map((r) => (
                          <Badge
                            key={r.id}
                            variant="secondary"
                            className="gap-1.5 py-1 font-mono text-xs"
                          >
                            <ShieldCheck className="h-3 w-3" />
                            {r.role}
                            <button
                              onClick={() => removeRole(r)}
                              className="ml-1 rounded-full text-muted-foreground hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select role…" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={addRole} disabled={!newRole}>
                        Assign
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Select a user to manage their roles.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
