"use client";

import { ListaItems } from "@/components/ListaItems";
import { useParams } from "next/navigation";

export default function ListaPage() {
  const params = useParams();
  const listaId = params.id as string;

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <ListaItems listaId={listaId} />
      </div>
    </main>
  );
} 