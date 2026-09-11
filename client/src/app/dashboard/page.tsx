"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, FormEvent } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Workspace {
  id: string;
  name: string;
  myRole: string;
}

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  const { data: workspaces, isLoading } = useQuery<Workspace[]>({
    queryKey: ["workspaces"],
    queryFn: async () => (await api.get("/workspaces")).data,
    enabled: !!user,
  });

  const createWorkspace = useMutation({
    mutationFn: async (name: string) =>
      (await api.post("/workspaces", { name })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setNewWorkspaceName("");
    },
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (newWorkspaceName.trim()) createWorkspace.mutate(newWorkspaceName);
  }

  if (authLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Workspaces</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button onClick={logout} className="text-sm text-red-600">
            Log out
          </button>
        </div>
      </div>

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="New workspace name"
          value={newWorkspaceName}
          onChange={(e) => setNewWorkspaceName(e.target.value)}
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          type="submit"
          disabled={createWorkspace.isPending}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Create
        </button>
      </form>

      {isLoading ? (
        <p className="text-gray-500">Loading workspaces...</p>
      ) : workspaces?.length === 0 ? (
        <p className="text-gray-500">No workspaces yet — create one above.</p>
      ) : (
        <ul className="space-y-2">
          {workspaces?.map((ws) => (
            <li key={ws.id}>
              <Link
                href={`/workspace/${ws.id}`}
                className="block rounded border p-4 hover:bg-gray-50"
              >
                <span className="font-medium">{ws.name}</span>
                <span className="ml-2 text-xs text-gray-500">{ws.myRole}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
