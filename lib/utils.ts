import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Lista, ShareableListData, ListItem } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateShareId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function encodeShareData(data: ShareableListData): string {
  // Precisamos usar encodeURIComponent antes de btoa para lidar com caracteres Unicode
  // A função btoa só funciona com strings ASCII
  const jsonString = JSON.stringify(data);
  // Converter para UTF-8, depois codificar em base64 de forma segura
  return btoa(encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g, (_, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  }));
}

export function decodeShareData(encoded: string): ShareableListData | null {
  try {
    // Decodificar o base64 para UTF-8, depois para objeto JavaScript
    const jsonString = decodeURIComponent(
      Array.from(atob(encoded), c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Erro ao decodificar dados compartilhados:", e);
    return null;
  }
}

export function getShareUrl(lista: Lista): string {
  if (!lista.shareId) return "";
  
  // Garantir que todos os itens tenham os campos necessários
  const itensCompletos = lista.itens.map(item => ({
    id: item.id,
    nome: item.nome,
    verEm: item.verEm,
    visto: item.visto,
    tipo: item.tipo || 'série', // Valor padrão para tipo
    observacao: item.observacao || '', // Valor padrão para observação
    origemId: item.origemId
  }));
  
  const shareData: ShareableListData = {
    titulo: lista.titulo,
    descricao: lista.descricao,
    itens: itensCompletos, // Usar itens com todos os campos
    originId: lista.id
  };
  
  const encoded = encodeShareData(shareData);
  return `${window.location.origin}/share/${lista.shareId}?data=${encoded}`;
}

export const LISTA_ASSISTIDOS_ID = "assistidos-especial";

// Verifica se a lista de assistidos existe, e cria se não existir
export function obterOuCriarListaAssistidos(): Lista {
  const savedListas = localStorage.getItem("listas");
  let listas: Lista[] = [];
  
  if (savedListas) {
    listas = JSON.parse(savedListas);
  }
  
  // Procurar lista de assistidos
  let listaAssistidos = listas.find(lista => lista.isAssistidos);
  
  // Se não existir, criar
  if (!listaAssistidos) {
    listaAssistidos = {
      id: LISTA_ASSISTIDOS_ID,
      titulo: "Assistidos",
      descricao: "Itens marcados como vistos",
      itens: [],
      isAssistidos: true
    };
    
    listas.push(listaAssistidos);
    localStorage.setItem("listas", JSON.stringify(listas));
  }
  
  return listaAssistidos;
}

// Adicionar item à lista de assistidos
export function adicionarItemNaListaAssistidos(item: ListItem, listaOrigemId: string) {
  const savedListas = localStorage.getItem("listas");
  if (!savedListas) return;
  
  const listas = JSON.parse(savedListas) as Lista[];
  const listaAssistidosIndex = listas.findIndex(lista => lista.isAssistidos);
  
  if (listaAssistidosIndex === -1) {
    // Criar lista de assistidos se não existir
    adicionarItemNaListaAssistidos(item, listaOrigemId);
    return;
  }
  
  // Verificar se o item já existe na lista de assistidos
  const itemExistente = listas[listaAssistidosIndex].itens.find(
    i => i.id === item.id && i.origemId === listaOrigemId
  );
  
  if (!itemExistente) {
    // Adicionar item com referência à lista de origem
    const itemParaAdicionar = {
      ...item,
      origemId: listaOrigemId
    };
    
    listas[listaAssistidosIndex].itens.push(itemParaAdicionar);
    localStorage.setItem("listas", JSON.stringify(listas));
  }
}

// Remover item da lista de assistidos
export function removerItemDaListaAssistidos(itemId: string, listaOrigemId: string) {
  const savedListas = localStorage.getItem("listas");
  if (!savedListas) return;
  
  const listas = JSON.parse(savedListas) as Lista[];
  const listaAssistidosIndex = listas.findIndex(lista => lista.isAssistidos);
  
  if (listaAssistidosIndex === -1) return;
  
  // Remover item da lista de assistidos
  listas[listaAssistidosIndex].itens = listas[listaAssistidosIndex].itens.filter(
    item => !(item.id === itemId && item.origemId === listaOrigemId)
  );
  
  localStorage.setItem("listas", JSON.stringify(listas));
}

// Remover todos os itens de uma lista específica da lista de assistidos
export function removerTodosItensDaListaAssistidos(listaOrigemId: string) {
  const savedListas = localStorage.getItem("listas");
  if (!savedListas) return;
  
  const listas = JSON.parse(savedListas) as Lista[];
  const listaAssistidosIndex = listas.findIndex(lista => lista.isAssistidos);
  
  if (listaAssistidosIndex === -1) return;
  
  // Remover todos os itens da lista de origem
  listas[listaAssistidosIndex].itens = listas[listaAssistidosIndex].itens.filter(
    item => item.origemId !== listaOrigemId
  );
  
  localStorage.setItem("listas", JSON.stringify(listas));
}

// Verificar se a lista de assistidos deve ser visível
export function listaAssistidosDeveSerVisivel(): boolean {
  const savedListas = localStorage.getItem("listas");
  if (!savedListas) return false;
  
  const listas = JSON.parse(savedListas) as Lista[];
  const listaAssistidos = listas.find(lista => lista.isAssistidos);
  
  return !!listaAssistidos && listaAssistidos.itens.length > 0;
}
