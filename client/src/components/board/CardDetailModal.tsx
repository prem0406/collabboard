"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { CardType, CommentType, AttachmentType } from "@/types/board";

export default function CardDetailModal({
  card,
  onClose,
}: {
  card: CardType;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: comments } = useQuery<CommentType[]>({
    queryKey: ["comments", card.id],
    queryFn: async () => (await api.get(`/cards/${card.id}/comments`)).data,
  });

  const { data: attachments } = useQuery<AttachmentType[]>({
    queryKey: ["attachments", card.id],
    queryFn: async () => (await api.get(`/cards/${card.id}/attachments`)).data,
  });

  const addComment = useMutation({
    mutationFn: async (content: string) =>
      (await api.post(`/cards/${card.id}/comments`, { content })).data,
    onSuccess: () => setNewComment(""),
  });

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return (
        await api.post(`/cards/${card.id}/attachments`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data;
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) =>
      api.delete(`/cards/comments/${commentId}`),
  });

  const deleteAttachment = useMutation({
    mutationFn: async (attachmentId: string) =>
      api.delete(`/cards/attachments/${attachmentId}`),
  });

  function handleAddComment(e: FormEvent) {
    e.preventDefault();
    if (newComment.trim()) addComment.mutate(newComment);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile.mutate(file);
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL!.replace("/api", "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold">{card.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Attachments */}
        <section className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-gray-600">
            Attachments
          </h3>
          <label className="mb-2 inline-block cursor-pointer rounded bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200">
            + Add file
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>
          <ul className="space-y-1">
            {attachments?.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded border p-2 text-sm"
              >
                <a
                  href={`${apiBase}${a.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {a.filename}
                </a>
                <button
                  onClick={() => deleteAttachment.mutate(a.id)}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Comments */}
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-600">Comments</h3>
          <ul className="mb-3 space-y-2">
            {comments?.map((c) => (
              <li key={c.id} className="rounded border p-2 text-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">{c.author.name}</span>
                  <button
                    onClick={() => deleteComment.mutate(c.id)}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-gray-700">{c.content}</p>
              </li>
            ))}
          </ul>
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
            >
              Post
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
