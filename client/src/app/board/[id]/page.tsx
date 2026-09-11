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
import { useRef } from "react";
import { getSocket } from "@/lib/socket";
import CardDetailModal from "@/components/board/CardDetailModal";

export default function BoardPage() {
  const { id: boardId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const sourceListIdRef = useRef<string | null>(null);

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
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);

  useEffect(() => {
    if (board) setLists(board.lists);
  }, [board]);

  useEffect(() => {
    if (!boardId) return;
    const socket = getSocket();
    socket.connect();
    socket.emit("board:join", boardId);

    socket.on("list:created", ({ list }: { list: ListType }) => {
      setLists((prev) =>
        prev.some((l) => l.id === list.id) ? prev : [...prev, list],
      );
    });

    socket.on("list:deleted", ({ listId }: { listId: string }) => {
      setLists((prev) => prev.filter((l) => l.id !== listId));
    });

    socket.on(
      "card:created",
      ({ listId, card }: { listId: string; card: CardType }) => {
        setLists((prev) =>
          prev.map((l) =>
            l.id === listId
              ? l.cards.some((c) => c.id === card.id)
                ? l
                : { ...l, cards: [...l.cards, card] }
              : l,
          ),
        );
      },
    );

    socket.on("card:updated", ({ card }: { card: CardType }) => {
      setLists((prev) =>
        prev.map((l) =>
          l.id === card.listId
            ? { ...l, cards: l.cards.map((c) => (c.id === card.id ? card : c)) }
            : l,
        ),
      );
    });

    socket.on(
      "card:deleted",
      ({ cardId, listId }: { cardId: string; listId: string }) => {
        setLists((prev) =>
          prev.map((l) =>
            l.id === listId
              ? { ...l, cards: l.cards.filter((c) => c.id !== cardId) }
              : l,
          ),
        );
      },
    );

    socket.on(
      "card:reordered",
      ({
        destinationListId,
        destinationCards,
        sourceListId,
        sourceCards,
      }: {
        destinationListId: string;
        destinationCards: CardType[];
        sourceListId?: string;
        sourceCards?: CardType[];
      }) => {
        setLists((prev) =>
          prev.map((l) => {
            if (l.id === destinationListId)
              return { ...l, cards: destinationCards };
            if (sourceListId && l.id === sourceListId)
              return { ...l, cards: sourceCards! };
            return l;
          }),
        );
      },
    );

    socket.on("comment:created", ({ cardId }: { cardId: string }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", cardId] });
    });
    socket.on("comment:deleted", ({ cardId }: { cardId: string }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", cardId] });
    });
    socket.on("attachment:created", ({ cardId }: { cardId: string }) => {
      queryClient.invalidateQueries({ queryKey: ["attachments", cardId] });
    });
    socket.on("attachment:deleted", ({ cardId }: { cardId: string }) => {
      queryClient.invalidateQueries({ queryKey: ["attachments", cardId] });
    });

    return () => {
      socket.emit("board:leave", boardId);
      socket.off("list:created");
      socket.off("list:deleted");
      socket.off("card:created");
      socket.off("card:updated");
      socket.off("card:deleted");
      socket.off("card:reordered");
      socket.off("comment:created");
      socket.off("comment:deleted");
      socket.off("attachment:created");
      socket.off("attachment:deleted");
      socket.disconnect();
    };
  }, [boardId]);

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
    sourceListIdRef.current =
      findListByCardId(event.active.id as string)?.id || null;
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
    mutationFn: async (payload: {
      cardId: string;
      destinationListId: string;
      orderedCardIds: string[];
      sourceListId?: string;
      sourceOrderedCardIds?: string[];
    }) => api.patch(`/cards/${payload.cardId}/reorder`, payload),
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const originalSourceListId = sourceListIdRef.current;

    const destList =
      findListByCardId(overId) ||
      findListById(overId) ||
      findListByCardId(activeId);
    if (!destList) return;

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

    const isCrossList =
      originalSourceListId && originalSourceListId !== destList.id;
    const sourceList = isCrossList
      ? lists.find((l) => l.id === originalSourceListId)
      : undefined;

    reorderMutation.mutate({
      cardId: activeId,
      destinationListId: destList.id,
      orderedCardIds: finalOrder.map((c) => c.id),
      sourceListId: isCrossList ? originalSourceListId! : undefined,
      sourceOrderedCardIds: isCrossList
        ? sourceList?.cards.map((c) => c.id)
        : undefined,
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
    onSuccess: () => setNewListName(""),
  });

  const addCardMutation = useMutation({
    mutationFn: async ({ listId, title }: { listId: string; title: string }) =>
      (await api.post(`/lists/${listId}/cards`, { title })).data,
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => api.delete(`/cards/${cardId}`),
  });

  const deleteListMutation = useMutation({
    mutationFn: async (listId: string) => api.delete(`/lists/${listId}`),
  });

  function handleAddList(e: FormEvent) {
    e.preventDefault();
    if (newListName.trim()) addListMutation.mutate(newListName);
  }

  if (isLoading) return <div className="p-8">Loading board...</div>;

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
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
              onCardClick={(card) => setSelectedCard(card)}
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
