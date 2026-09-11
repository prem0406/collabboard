"use client";

import { useState, FormEvent } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import BoardCard from "./BoardCard";
import { ListType } from "@/types/board";

export default function BoardList({
  list,
  onAddCard,
  onDeleteCard,
  onDeleteList,
}: {
  list: ListType;
  onAddCard: (listId: string, title: string) => void;
  onDeleteCard: (cardId: string) => void;
  onDeleteList: (listId: string) => void;
}) {
  const [newCardTitle, setNewCardTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const { setNodeRef } = useDroppable({
    id: list.id,
    data: { type: "list", list },
  });

  function handleAddCard(e: FormEvent) {
    e.preventDefault();
    if (newCardTitle.trim()) {
      onAddCard(list.id, newCardTitle);
      setNewCardTitle("");
      setAdding(false);
    }
  }

  return (
    <div className="w-72 flex-shrink-0 rounded bg-gray-100 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{list.name}</h3>
        <button
          onClick={() => onDeleteList(list.id)}
          className="text-xs text-gray-400 hover:text-red-500"
        >
          Delete
        </button>
      </div>

      <div ref={setNodeRef} className="min-h-[20px]">
        <SortableContext
          items={list.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {list.cards.map((card) => (
            <BoardCard key={card.id} card={card} onDelete={onDeleteCard} />
          ))}
        </SortableContext>
      </div>

      {adding ? (
        <form onSubmit={handleAddCard} className="mt-2">
          <textarea
            autoFocus
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            placeholder="Card title..."
            className="w-full rounded border p-2 text-sm"
            rows={2}
          />
          <div className="mt-1 flex gap-2">
            <button
              type="submit"
              className="rounded bg-blue-600 px-3 py-1 text-xs text-white"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-xs text-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 w-full rounded p-2 text-left text-sm text-gray-500 hover:bg-gray-200"
        >
          + Add a card
        </button>
      )}
    </div>
  );
}
