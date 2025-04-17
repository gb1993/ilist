export interface ListItem {
  id: string;
  visto: boolean;
  nome: string;
  verEm: string;
  tipo: 'série' | 'filme' | 'anime'; // Tipo do conteúdo
  observacao?: string; // Campo opcional para observações
  origemId?: string; // ID da lista de origem, para itens na lista de assistidos
}

export interface Lista {
  id: string;
  titulo: string;
  descricao: string;
  itens: ListItem[];
  shareId?: string;
  isAssistidos?: boolean; // Indica se é a lista especial de assistidos
}

export type ShareableListData = Omit<Lista, "id"> & { originId: string }; 