"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Lista } from "@/lib/types";
import { decodeShareData } from "@/lib/utils";
import { toast } from "sonner";

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shareId = params.id as string;
  const shareData = searchParams.get("data");
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    // Se não houver dados, retornar
    if (!shareData) {
      setImportStatus("error");
      return;
    }

    // Tentar decodificar os dados compartilhados
    const decodedData = decodeShareData(shareData);
    if (!decodedData) {
      setImportStatus("error");
      return;
    }

    // Verificar se a lista já existe com este originId
    const savedListas = localStorage.getItem("listas");
    if (savedListas) {
      const listas = JSON.parse(savedListas) as Lista[];
      // Verificar se já existe uma lista com este originId
      const existingListaIndex = listas.findIndex(
        (lista) => decodedData.originId && lista.shareId === shareId
      );

      if (existingListaIndex >= 0) {
        // A lista já existe, redirecionar para ela
        const existingLista = listas[existingListaIndex];
        setImportStatus("success");
        toast.info("Esta lista já foi importada anteriormente");
        router.push(`/lista/${existingLista.id}`);
        return;
      }
    }

    // Criar nova lista a partir dos dados compartilhados
    const newLista: Lista = {
      id: crypto.randomUUID(),
      titulo: decodedData.titulo,
      descricao: decodedData.descricao,
      itens: decodedData.itens,
      shareId: shareId
    };

    // Salvar a nova lista
    if (savedListas) {
      const listas = JSON.parse(savedListas) as Lista[];
      localStorage.setItem("listas", JSON.stringify([...listas, newLista]));
    } else {
      localStorage.setItem("listas", JSON.stringify([newLista]));
    }

    setImportStatus("success");
    toast.success("Lista importada com sucesso!");

    // Redirecionar para a lista recém-criada após um breve delay
    setTimeout(() => {
      router.push(`/lista/${newLista.id}`);
    }, 1500);
  }, [shareId, shareData, router]);

  const goToHome = () => {
    router.push("/");
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-lg mx-auto text-center space-y-6 border rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl font-bold">
          {importStatus === "idle" && "Importando lista..."}
          {importStatus === "success" && "Lista importada com sucesso!"}
          {importStatus === "error" && "Erro ao importar lista"}
        </h1>

        {importStatus === "idle" && (
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        )}

        {importStatus === "success" && (
          <p className="text-gray-500">
            A lista foi importada com sucesso e você será redirecionado em breve.
          </p>
        )}

        {importStatus === "error" && (
          <div className="space-y-4">
            <p className="text-gray-500">
              Não foi possível importar a lista. O link pode estar inválido ou expirado.
            </p>
            <Button onClick={goToHome}>Voltar para a página inicial</Button>
          </div>
        )}
      </div>
    </main>
  );
} 