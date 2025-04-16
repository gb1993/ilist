"use client";

import { useState, useEffect } from "react";
import { ListItem, Lista } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { generateShareId, getShareUrl } from "@/lib/utils";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

interface ListaItemsProps {
  listaId: string;
}

export function ListaItems({ listaId }: ListaItemsProps) {
  const router = useRouter();
  const [lista, setLista] = useState<Lista | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const form = useForm<Omit<ListItem, "id">>({
    defaultValues: {
      visto: false,
      nome: "",
      verEm: "",
    },
  });

  useEffect(() => {
    const carregarLista = () => {
      const savedListas = localStorage.getItem("listas");
      if (savedListas) {
        const listas = JSON.parse(savedListas) as Lista[];
        const currentLista = listas.find((l) => l.id === listaId);
        if (currentLista) {
          setLista(currentLista);
        } else {
          // Lista não encontrada, voltar para a página inicial
          router.push("/");
        }
      } else {
        // Nenhuma lista encontrada, voltar para a página inicial
        router.push("/");
      }
    };

    carregarLista();
  }, [listaId, router]);

  const salvarLista = (novaLista: Lista) => {
    setLista(novaLista);

    const savedListas = localStorage.getItem("listas");
    if (savedListas) {
      const listas = JSON.parse(savedListas) as Lista[];
      const listaAtualizada = listas.map((l) =>
        l.id === listaId ? novaLista : l
      );
      localStorage.setItem("listas", JSON.stringify(listaAtualizada));
    }
  };

  const adicionarItem = () => {
    setEditingItem(null);
    form.reset({
      visto: false,
      nome: "",
      verEm: "",
    });
    setDialogOpen(true);
  };

  const editarItem = (item: ListItem) => {
    setEditingItem(item);
    form.reset({
      visto: item.visto,
      nome: item.nome,
      verEm: item.verEm,
    });
    setDialogOpen(true);
  };

  const removerItem = (id: string) => {
    if (!lista) return;
    
    const novaLista = {
      ...lista,
      itens: lista.itens.filter((item) => item.id !== id),
    };

    salvarLista(novaLista);
  };

  const toggleVisto = (id: string) => {
    if (!lista) return;
    
    const novaLista = {
      ...lista,
      itens: lista.itens.map((item) =>
        item.id === id ? { ...item, visto: !item.visto } : item
      ),
    };

    salvarLista(novaLista);
  };

  const onSubmit = (data: Omit<ListItem, "id">) => {
    if (!lista) return;
    
    let novaLista: Lista;

    if (editingItem) {
      novaLista = {
        ...lista,
        itens: lista.itens.map((item) =>
          item.id === editingItem.id ? { ...item, ...data } : item
        ),
      };
    } else {
      novaLista = {
        ...lista,
        itens: [
          ...lista.itens,
          {
            id: crypto.randomUUID(),
            ...data,
          },
        ],
      };
    }

    salvarLista(novaLista);
    setDialogOpen(false);
  };

  const voltarParaListas = () => {
    router.push("/");
  };

  const compartilharLista = () => {
    if (!lista) return;

    // Se ainda não tiver um shareId, gerar um
    if (!lista.shareId) {
      const novaLista = {
        ...lista,
        shareId: generateShareId()
      };
      salvarLista(novaLista);
      setLista(novaLista);
      
      // Atualizar o URL de compartilhamento
      const url = getShareUrl(novaLista);
      setShareUrl(url);
    } else {
      // Usar o shareId existente
      const url = getShareUrl(lista);
      setShareUrl(url);
    }
    
    setShareDialogOpen(true);
  };

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado para a área de transferência");
    } catch (err) {
      toast.error("Erro ao copiar link");
      console.error("Erro ao copiar link:", err);
    }
  };

  if (!lista) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="mt-4 text-gray-500">Carregando itens da lista...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={voltarParaListas}
            className="mb-2"
          >
            ← Voltar para listas
          </Button>
          <h2 className="text-2xl font-bold">{lista.titulo}</h2>
          <p className="text-gray-500">{lista.descricao}</p>
        </div>
        <div className="flex gap-2">
          {lista.itens.length > 0 && (
            <Button variant="outline" onClick={compartilharLista}>
              Compartilhar
            </Button>
          )}
          <Button onClick={adicionarItem}>Adicionar Item</Button>
        </div>
      </div>

      {lista.itens.length === 0 ? (
        <p className="text-center py-4 text-gray-500">
          Nenhum item adicionado ainda
        </p>
      ) : (
        <div className="border rounded-lg divide-y">
          {lista.itens.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 p-4 items-center"
            >
              <Checkbox
                checked={item.visto}
                onCheckedChange={() => toggleVisto(item.id)}
                id={`visto-${item.id}`}
              />
              <div className={item.visto ? "line-through text-gray-500" : ""}>
                {item.nome}
              </div>
              <div>{item.verEm}</div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => editarItem(item)}
                title="Alterar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => removerItem(item.id)}
                title="Remover"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Item" : "Adicionar Item"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do item" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="verEm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ver em</FormLabel>
                    <FormControl>
                      <Input placeholder="Onde ver" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visto"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Visto</FormLabel>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">
                  {editingItem ? "Salvar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartilhar Lista</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Compartilhe este link para que outras pessoas possam importar esta lista:
            </p>
            <div className="flex items-center gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button onClick={copiarLink}>Copiar</Button>
            </div>
            <p className="text-xs text-gray-500">
              Quando alguém abrir este link, a lista será criada automaticamente para eles.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 