"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardType } from "@/types/board";

export default function BoardCard({
  card,
  onDelete,
  onClick,
}: {
  card: CardType;
  onDelete: (id: string) => void;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: "card", card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="group mb-2 cursor-grab rounded border bg-white p-3 shadow-sm active:cursor-grabbing"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm">{card.title}</p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card.id);
          }}
          className="ml-2 hidden text-xs text-gray-400 hover:text-red-500 group-hover:block"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
