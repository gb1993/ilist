"use client";

import { ListaItems } from "@/components/ListaItems";
import { ThemeToggle } from "@/components/theme-toggle";
import { useParams } from "next/navigation";

export default function ListaPage() {
  const params = useParams();
  const listaId = params.id as string;

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <ListaItems listaId={listaId} />
      </div>
    </main>
  );
} 