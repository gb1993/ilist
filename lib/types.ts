export interface ListItem {
  id: string;
  visto: boolean;
  nome: string;
  verEm: string;
}

export interface Lista {
  id: string;
  titulo: string;
  descricao: string;
  itens: ListItem[];
  shareId?: string;
}

export type ShareableListData = Omit<Lista, "id"> & { originId: string }; 