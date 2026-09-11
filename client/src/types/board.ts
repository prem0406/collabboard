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

export interface CommentType {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  author: { id: string; name: string; email: string };
}

export interface AttachmentType {
  id: string;
  filename: string;
  url: string;
  fileSize: number;
  createdAt: string;
  uploadedBy: { id: string; name: string };
}
