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
import { Trash2, Pencil, Eye } from "lucide-react";
import { listaAssistidosDeveSerVisivel, obterOuCriarListaAssistidos, LISTA_ASSISTIDOS_ID, removerTodosItensDaListaAssistidos } from "@/lib/utils";

export function ListaDeListas() {
  const router = useRouter();
  const [listas, setListas] = useState<Lista[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [listaParaRemover, setListaParaRemover] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mostrarListaAssistidos, setMostrarListaAssistidos] = useState(false);

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
          const listasCarregadas = JSON.parse(savedListas) as Lista[];
          // Verificar se deve mostrar lista de assistidos
          setMostrarListaAssistidos(listaAssistidosDeveSerVisivel());
          // Filtrar a lista de assistidos da exibição principal
          setListas(listasCarregadas.filter(lista => !lista.isAssistidos));
        }
      } catch (error) {
        console.error("Erro ao carregar listas:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarListas();
    
    // Adicionar um listener para atualizar quando o localStorage mudar
    const handleStorageChange = () => {
      carregarListas();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const savedListas = localStorage.getItem("listas");
      if (savedListas) {
        const todasListas = JSON.parse(savedListas) as Lista[];
        const listaAssistidos = todasListas.find(l => l.isAssistidos);
        
        // Combinar as listas normais com a lista de assistidos (se existir)
        const listasAtualizadas = [
          ...listas,
          ...(listaAssistidos ? [listaAssistidos] : [])
        ];
        
        localStorage.setItem("listas", JSON.stringify(listasAtualizadas));
      } else {
        localStorage.setItem("listas", JSON.stringify(listas));
      }
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
      // Remover itens da lista de assistidos
      removerTodosItensDaListaAssistidos(listaParaRemover);
      
      // Remover a lista
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

  const abrirListaAssistidos = () => {
    // Garantir que a lista de assistidos existe
    obterOuCriarListaAssistidos();
    router.push(`/lista/${LISTA_ASSISTIDOS_ID}`);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Minhas Listas</h2>
        <Button onClick={adicionarLista}>Nova Lista</Button>
      </div>

      {/* Lista de Assistidos */}
      {mostrarListaAssistidos && (
        <div className="bg-secondary/30 rounded-lg p-6 border-2 border-secondary">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Eye className="h-5 w-5 mr-2 text-primary" />
              <h3 className="text-xl font-semibold">Assistidos</h3>
            </div>
            <Button 
              variant="secondary"
              onClick={abrirListaAssistidos}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Ver Todos
            </Button>
          </div>
          <p className="text-gray-500">Itens que você já marcou como vistos em suas listas</p>
        </div>
      )}

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
              className="flex flex-col justify-between border rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{lista.titulo}</h3>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmarRemocao(lista.id);
                  }}
                  title="Remover"
                >
                  <Trash2 className="h-4 w-4" />
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
                <Pencil className="h-4 w-4 mr-2" />
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