"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import api from "@/lib/api";
import { BoardType, ListType, CardType } from "@/types/board";
import BoardList from "@/components/board/BoardList";
import BoardCard from "@/components/board/BoardCard";

export default function BoardPage() {
  const { id: boardId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: board, isLoading } = useQuery<BoardType>({
    queryKey: ["board", boardId],
    queryFn: async () => (await api.get(`/boards/${boardId}`)).data,
  });

  // Local mirror of server data — needed so drag interactions feel instant,
  // without waiting for a round trip on every pixel of movement.
  const [lists, setLists] = useState<ListType[]>([]);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [newListName, setNewListName] = useState("");
  const [addingList, setAddingList] = useState(false);

  useEffect(() => {
    if (board) setLists(board.lists);
  }, [board]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function findListByCardId(cardId: string) {
    return lists.find((l) => l.cards.some((c) => c.id === cardId));
  }
  function findListById(listId: string) {
    return lists.find((l) => l.id === listId);
  }

  function handleDragStart(event: DragStartEvent) {
    const card = lists
      .flatMap((l) => l.cards)
      .find((c) => c.id === event.active.id);
    setActiveCard(card || null);
  }

  // Fires continuously while dragging — this is what makes a card visually
  // "jump" into a different column as you drag over it, before you even drop.
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceList = findListByCardId(activeId);
    // `over` can be either a card (dropping between cards) or a list itself (dropping into empty space)
    const destList = findListByCardId(overId) || findListById(overId);

    if (!sourceList || !destList || sourceList.id === destList.id) return;

    setLists((prev) => {
      const sourceCards = [...sourceList.cards];
      const cardIndex = sourceCards.findIndex((c) => c.id === activeId);
      const [movedCard] = sourceCards.splice(cardIndex, 1);

      const destCards = [...destList.cards];
      const overIndex = destCards.findIndex((c) => c.id === overId);
      const insertAt = overIndex >= 0 ? overIndex : destCards.length;
      destCards.splice(insertAt, 0, { ...movedCard, listId: destList.id });

      return prev.map((l) => {
        if (l.id === sourceList.id) return { ...l, cards: sourceCards };
        if (l.id === destList.id) return { ...l, cards: destCards };
        return l;
      });
    });
  }

  const reorderMutation = useMutation({
    mutationFn: async ({
      cardId,
      destinationListId,
      orderedCardIds,
    }: {
      cardId: string;
      destinationListId: string;
      orderedCardIds: string[];
    }) =>
      api.patch(`/cards/${cardId}/reorder`, {
        destinationListId,
        orderedCardIds,
      }),
    onError: () => {
      // Server rejected it (or network failed) — resync with source of truth
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const destList =
      findListByCardId(overId) ||
      findListById(overId) ||
      findListByCardId(activeId);
    if (!destList) return;

    // Reorder within the final destination list based on where it visually landed
    const cards = [...destList.cards];
    const activeIndex = cards.findIndex((c) => c.id === activeId);
    const overIndex = cards.findIndex((c) => c.id === overId);

    let finalOrder = cards;
    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      finalOrder = arrayMove(cards, activeIndex, overIndex);
      setLists((prev) =>
        prev.map((l) =>
          l.id === destList.id ? { ...l, cards: finalOrder } : l,
        ),
      );
    }

    reorderMutation.mutate({
      cardId: activeId,
      destinationListId: destList.id,
      orderedCardIds: finalOrder.map((c) => c.id),
    });
  }

  function arrayMove<T>(arr: T[], from: number, to: number): T[] {
    const copy = [...arr];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  }

  const addListMutation = useMutation({
    mutationFn: async (name: string) =>
      (await api.post(`/boards/${boardId}/lists`, { name })).data,
    onSuccess: (newList) => {
      setLists((prev) => [...prev, { ...newList, cards: [] }]);
      setNewListName("");
      setAddingList(false);
    },
  });

  const addCardMutation = useMutation({
    mutationFn: async ({ listId, title }: { listId: string; title: string }) =>
      (await api.post(`/lists/${listId}/cards`, { title })).data,
    onSuccess: (newCard, { listId }) => {
      setLists((prev) =>
        prev.map((l) =>
          l.id === listId ? { ...l, cards: [...l.cards, newCard] } : l,
        ),
      );
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => api.delete(`/cards/${cardId}`),
    onSuccess: (_data, cardId) => {
      setLists((prev) =>
        prev.map((l) => ({
          ...l,
          cards: l.cards.filter((c) => c.id !== cardId),
        })),
      );
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (listId: string) => api.delete(`/lists/${listId}`),
    onSuccess: (_data, listId) => {
      setLists((prev) => prev.filter((l) => l.id !== listId));
    },
  });

  function handleAddList(e: FormEvent) {
    e.preventDefault();
    if (newListName.trim()) addListMutation.mutate(newListName);
  }

  if (isLoading) return <div className="p-8">Loading board...</div>;

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <div className="border-b bg-white p-4">
        <Link
          href="#"
          onClick={() => history.back()}
          className="text-sm text-blue-600"
        >
          &larr; Back
        </Link>
        <h1 className="mt-1 text-xl font-semibold">{board?.name}</h1>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto p-4">
          {lists.map((list) => (
            <BoardList
              key={list.id}
              list={list}
              onAddCard={(listId, title) =>
                addCardMutation.mutate({ listId, title })
              }
              onDeleteCard={(cardId) => deleteCardMutation.mutate(cardId)}
              onDeleteList={(listId) => deleteListMutation.mutate(listId)}
            />
          ))}

          <div className="w-72 flex-shrink-0">
            {addingList ? (
              <form
                onSubmit={handleAddList}
                className="rounded bg-gray-100 p-3"
              >
                <input
                  autoFocus
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="List name..."
                  className="w-full rounded border p-2 text-sm"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="submit"
                    className="rounded bg-blue-600 px-3 py-1 text-xs text-white"
                  >
                    Add List
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingList(false)}
                    className="text-xs text-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAddingList(true)}
                className="w-full rounded bg-gray-200 p-3 text-left text-sm text-gray-600 hover:bg-gray-300"
              >
                + Add another list
              </button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="w-72">
              <BoardCard card={activeCard} onDelete={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
