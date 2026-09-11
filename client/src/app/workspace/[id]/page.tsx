"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface Board {
  id: string;
  name: string;
}

export default function WorkspacePage() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [newBoardName, setNewBoardName] = useState("");

  const { data: workspace, isLoading } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => (await api.get(`/workspaces/${workspaceId}`)).data,
  });

  const { data: boards } = useQuery<Board[]>({
    queryKey: ["boards", workspaceId],
    queryFn: async () =>
      (await api.get(`/workspaces/${workspaceId}/boards`)).data,
  });

  const createBoard = useMutation({
    mutationFn: async (name: string) =>
      (await api.post(`/workspaces/${workspaceId}/boards`, { name })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", workspaceId] });
      setNewBoardName("");
    },
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (newBoardName.trim()) createBoard.mutate(newBoardName);
  }

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl p-8">
      <Link href="/dashboard" className="text-sm text-blue-600">
        &larr; Dashboard
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">{workspace?.name}</h1>

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="New board name"
          value={newBoardName}
          onChange={(e) => setNewBoardName(e.target.value)}
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Create Board
        </button>
      </form>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {boards?.map((board) => (
          <Link
            key={board.id}
            href={`/board/${board.id}`}
            className="rounded border bg-white p-6 shadow-sm hover:shadow-md"
          >
            {board.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
