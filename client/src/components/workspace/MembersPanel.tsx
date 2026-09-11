"use client";

import { useState, FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { MemberType } from "@/types/board";

export default function MembersPanel({
  workspaceId,
  members,
  myRole,
}: {
  workspaceId: string;
  members: MemberType[];
  myRole: "OWNER" | "ADMIN" | "MEMBER";
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const canManage = myRole === "OWNER" || myRole === "ADMIN";

  const invite = useMutation({
    mutationFn: async (email: string) =>
      (
        await api.post(`/workspaces/${workspaceId}/members`, {
          email,
          role: "MEMBER",
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      setEmail("");
      setError("");
    },
    onError: (err: any) =>
      setError(err.response?.data?.error || "Failed to invite"),
  });

  const updateRole = useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string;
      role: string;
    }) => api.patch(`/workspaces/${workspaceId}/members/${memberId}`, { role }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] }),
    onError: (err: any) =>
      setError(err.response?.data?.error || "Failed to update role"),
  });

  const remove = useMutation({
    mutationFn: async (memberId: string) =>
      api.delete(`/workspaces/${workspaceId}/members/${memberId}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] }),
    onError: (err: any) =>
      setError(err.response?.data?.error || "Failed to remove member"),
  });

  function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (email.trim()) invite.mutate(email.trim());
  }

  return (
    <div className="rounded border bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold">Members</h3>

      {error && (
        <p className="mb-2 rounded bg-red-50 p-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {canManage && (
        <form onSubmit={handleInvite} className="mb-4 flex gap-2">
          <input
            type="email"
            placeholder="Invite by email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded border px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={invite.isPending}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            Invite
          </button>
        </form>
      )}

      <ul className="space-y-2">
        {members.map((m) => {
          const isMe = m.user.id === user?.id;
          const isLastOwner =
            m.role === "OWNER" &&
            members.filter((x) => x.role === "OWNER").length === 1;

          return (
            <li
              key={m.id}
              className="flex items-center justify-between text-sm"
            >
              <div>
                <span className="font-medium">{m.user.name}</span>
                {isMe && (
                  <span className="ml-1 text-xs text-gray-400">(you)</span>
                )}
                <span className="block text-xs text-gray-500">
                  {m.user.email}
                </span>
              </div>

              {canManage ? (
                <div className="flex items-center gap-2">
                  <select
                    value={m.role}
                    disabled={isLastOwner || updateRole.isPending}
                    onChange={(e) =>
                      updateRole.mutate({
                        memberId: m.id,
                        role: e.target.value,
                      })
                    }
                    className="rounded border px-1.5 py-1 text-xs disabled:opacity-50"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                  </select>
                  <button
                    disabled={isLastOwner}
                    onClick={() => remove.mutate(m.id)}
                    className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <span className="text-xs text-gray-500">{m.role}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
