"use client";

import { useState, useEffect } from "react";
import { Lista } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

export function ListaDeListas() {
  const router = useRouter();
  const [listas, setListas] = useState<Lista[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [listaParaRemover, setListaParaRemover] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<Omit<Lista, "id" | "itens">>({
    defaultValues: {
      titulo: "",
      descricao: "",
    },
  });

  useEffect(() => {
    const carregarListas = () => {
      setIsLoading(true);
      try {
        const savedListas = localStorage.getItem("listas");
        if (savedListas) {
          setListas(JSON.parse(savedListas));
        }
      } catch (error) {
        console.error("Erro ao carregar listas:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarListas();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("listas", JSON.stringify(listas));
    }
  }, [listas, isLoading]);

  const adicionarLista = () => {
    form.reset({
      titulo: "",
      descricao: "",
    });
    setDialogOpen(true);
  };

  const confirmarRemocao = (id: string) => {
    setListaParaRemover(id);
    setConfirmDialogOpen(true);
  };

  const removerLista = () => {
    if (listaParaRemover) {
      setListas(listas.filter((lista) => lista.id !== listaParaRemover));
      setListaParaRemover(null);
      setConfirmDialogOpen(false);
    }
  };

  const cancelarRemocao = () => {
    setListaParaRemover(null);
    setConfirmDialogOpen(false);
  };

  const onSubmit = (data: Omit<Lista, "id" | "itens">) => {
    setListas([
      ...listas,
      {
        id: crypto.randomUUID(),
        ...data,
        itens: [],
      },
    ]);
    setDialogOpen(false);
  };

  const abrirLista = (id: string) => {
    router.push(`/lista/${id}`);
  };

  const getListaNome = (id: string) => {
    const lista = listas.find(l => l.id === id);
    return lista?.titulo || "esta lista";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="mt-4 text-gray-500">Carregando suas listas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Minhas Listas</h2>
        <Button onClick={adicionarLista}>Nova Lista</Button>
      </div>

      {listas.length === 0 ? (
        <div className="bg-secondary/40 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">
            Você ainda não tem nenhuma lista
          </p>
          <Button onClick={adicionarLista}>Criar Primeira Lista</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listas.map((lista) => (
            <div
              key={lista.id}
              className="border rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{lista.titulo}</h3>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmarRemocao(lista.id);
                  }}
                >
                  Remover
                </Button>
              </div>
              <p className="text-gray-500 mb-4">{lista.descricao}</p>
              <p className="text-sm text-gray-500 mb-4">
                {lista.itens.length} itens
              </p>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => abrirLista(lista.id)}
              >
                Abrir Lista
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Lista</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da lista" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição breve" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Criar Lista</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Remoção</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover a lista {listaParaRemover && getListaNome(listaParaRemover)}?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={cancelarRemocao}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={removerLista}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 