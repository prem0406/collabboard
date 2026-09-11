export interface CardType {
  id: string;
  title: string;
  description: string | null;
  position: number;
  listId: string;
}

export interface ListType {
  id: string;
  name: string;
  position: number;
  cards: CardType[];
}

export interface BoardType {
  id: string;
  name: string;
  lists: ListType[];
}
