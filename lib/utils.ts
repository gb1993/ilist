import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Lista, ShareableListData } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateShareId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function encodeShareData(data: ShareableListData): string {
  return encodeURIComponent(btoa(JSON.stringify(data)));
}

export function decodeShareData(encoded: string): ShareableListData | null {
  try {
    return JSON.parse(atob(decodeURIComponent(encoded)));
  } catch (e) {
    console.error("Erro ao decodificar dados compartilhados:", e);
    return null;
  }
}

export function getShareUrl(lista: Lista): string {
  if (!lista.shareId) return "";
  
  const shareData: ShareableListData = {
    titulo: lista.titulo,
    descricao: lista.descricao,
    itens: lista.itens,
    originId: lista.id
  };
  
  const encoded = encodeShareData(shareData);
  return `${window.location.origin}/share/${lista.shareId}?data=${encoded}`;
}
