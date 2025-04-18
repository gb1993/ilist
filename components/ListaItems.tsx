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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { 
  generateShareId, 
  getShareUrl, 
  adicionarItemNaListaAssistidos, 
  LISTA_ASSISTIDOS_ID,
  obterListasDisponiveis,
  moverItemParaLista
} from "@/lib/utils";
import { toast } from "sonner";
import { Pencil, Trash2, ExternalLink, MoveRight } from "lucide-react";

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
  const [listasOrigens, setListasOrigens] = useState<Record<string, Lista>>({});
  const [listasDisponiveis, setListasDisponiveis] = useState<Lista[]>([]);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [itemParaMover, setItemParaMover] = useState<string | null>(null);
  const [listaDestinoId, setListaDestinoId] = useState<string>("");
  const isListaAssistidos = listaId === LISTA_ASSISTIDOS_ID;

  const form = useForm<Omit<ListItem, "id">>({
    defaultValues: {
      visto: false,
      nome: "",
      verEm: "",
      tipo: "série",
      observacao: "",
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
          
          // Carregar listas disponíveis para mover itens
          setListasDisponiveis(obterListasDisponiveis(listaId));
          
          // Se for a lista de assistidos, carregar as listas de origem para exibir os nomes
          if (isListaAssistidos) {
            const origensMap: Record<string, Lista> = {};
            listas.forEach(lista => {
              if (!lista.isAssistidos) {
                origensMap[lista.id] = lista;
              }
            });
            setListasOrigens(origensMap);
          }
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
  }, [listaId, router, isListaAssistidos]);

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
      tipo: "série",
      observacao: "",
    });
    setDialogOpen(true);
  };

  const editarItem = (item: ListItem) => {
    setEditingItem(item);
    form.reset({
      visto: item.visto,
      nome: item.nome,
      verEm: item.verEm,
      tipo: item.tipo,
      observacao: item.observacao || "",
    });
    setDialogOpen(true);
  };

  const getNomeOrigem = (origemId?: string) => {
    if (!origemId) return "";
    return listasOrigens[origemId]?.titulo || "Lista desconhecida";
  };

  const irParaListaOrigem = (origemId?: string) => {
    if (!origemId) return;
    router.push(`/lista/${origemId}`);
  };

  const removerItem = (id: string) => {
    if (!lista) return;
    
    const novaLista = {
      ...lista,
      itens: lista.itens.filter((item) => item.id !== id),
    };

    // Remover da lista
    salvarLista(novaLista);
    
    // Não há necessidade de sincronizar remoções, cada lista agora é independente
  };

  const toggleVisto = (id: string) => {
    if (!lista) return;
    
    // Encontrar o item
    const item = lista.itens.find(item => item.id === id);
    if (!item) return;
    
    // Inverter o estado de visto
    const novoEstadoVisto = !item.visto;
    
    // Se for a lista de assistidos, apenas atualizar o status de visto
    if (isListaAssistidos) {
      const novaLista = {
        ...lista,
        itens: lista.itens.map((item) =>
          item.id === id ? { ...item, visto: novoEstadoVisto } : item
        ),
      };
      salvarLista(novaLista);
      return;
    }
    
    // Se não for a lista de assistidos e o item foi marcado como visto:
    if (novoEstadoVisto) {
      // 1. Adicionar à lista de assistidos
      adicionarItemNaListaAssistidos(
        { ...item, visto: true }, 
        lista.id
      );
      
      // 2. Remover da lista original
      const novaLista = {
        ...lista,
        itens: lista.itens.filter((i) => i.id !== id),
      };
      salvarLista(novaLista);
      
      // Mostrar toast para informar ao usuário
      toast.success("Item movido para a lista Assistidos");
    } else {
      // Se estiver desmarcando o item, apenas atualizar o status
      const novaLista = {
        ...lista,
        itens: lista.itens.map((item) =>
          item.id === id ? { ...item, visto: false } : item
        ),
      };
      salvarLista(novaLista);
    }
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

    // Garantir que todos os itens tenham os campos obrigatórios (para itens antigos)
    const itensValidados = lista.itens.map(item => ({
      ...item,
      tipo: item.tipo || 'série', // Valor padrão para itens sem tipo
      observacao: item.observacao || '' // Valor padrão vazio para observação
    }));

    // Atualizar a lista com os itens validados, se necessário
    if (JSON.stringify(lista.itens) !== JSON.stringify(itensValidados)) {
      const listaAtualizada = {
        ...lista,
        itens: itensValidados
      };
      salvarLista(listaAtualizada);
      setLista(listaAtualizada);
    }

    // Se ainda não tiver um shareId, gerar um
    if (!lista.shareId) {
      const novaLista = {
        ...lista,
        itens: itensValidados, // Usar itens validados
        shareId: generateShareId()
      };
      salvarLista(novaLista);
      setLista(novaLista);
      
      // Atualizar o URL de compartilhamento
      const url = getShareUrl(novaLista);
      setShareUrl(url);
    } else {
      // Usar o shareId existente, mas garantir que use os itens validados
      const novaLista = {
        ...lista,
        itens: itensValidados
      };
      const url = getShareUrl(novaLista);
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

  const abrirDialogoMover = (id: string) => {
    setItemParaMover(id);
    setListaDestinoId("");
    setMoveDialogOpen(true);
  };

  const moverItem = () => {
    if (!itemParaMover || !listaDestinoId || !lista) return;
    
    const sucesso = moverItemParaLista(itemParaMover, listaId, listaDestinoId);
    
    if (sucesso) {
      // Atualizar a lista atual removendo o item
      const novaLista = {
        ...lista,
        itens: lista.itens.filter((item) => item.id !== itemParaMover),
      };
      
      setLista(novaLista);
      
      // Encontrar o nome da lista de destino para o toast
      const listaDestino = listasDisponiveis.find(l => l.id === listaDestinoId);
      
      toast.success(
        `Item movido para ${listaDestino ? listaDestino.titulo : 'outra lista'}`
      );
      
      setMoveDialogOpen(false);
      setItemParaMover(null);
      
      // Atualizar a lista de listas disponíveis
      setListasDisponiveis(obterListasDisponiveis(listaId));
    } else {
      toast.error("Não foi possível mover o item");
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
          {!isListaAssistidos && lista.itens.length > 0 && (
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
        <div className="border rounded-lg overflow-hidden">
          <div className="w-full overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/20 border-b">
                  <th className="text-left p-4 font-semibold">Visto</th>
                  <th className="text-left p-4 font-semibold">Nome</th>
                  <th className="text-left p-4 font-semibold">Onde Assistir</th>
                  <th className="text-left p-4 font-semibold">Tipo</th>
                  <th className="text-left p-4 font-semibold">Observação</th>
                  <th className="p-4 w-[80px]"></th>
                  <th className="p-4 w-[80px]"></th>
                  <th className="p-4 w-[80px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lista.itens.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary/5">
                    <td className="p-4">
                      <Checkbox
                        checked={item.visto}
                        onCheckedChange={() => toggleVisto(item.id)}
                        id={`visto-${item.id}`}
                      />
                    </td>
                    <td className={`p-4 ${item.visto ? "line-through text-gray-500" : ""}`}>
                      {item.nome}
                      {isListaAssistidos && item.origemId && (
                        <div className="text-xs mt-1 text-gray-500 flex items-center">
                          <span>De: {getNomeOrigem(item.origemId)}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 ml-1"
                            onClick={() => irParaListaOrigem(item.origemId)}
                            title="Ir para a lista de origem"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="p-4">{item.verEm}</td>
                    <td className="p-4">{item.tipo}</td>
                    <td className="p-4">{item.observacao}</td>
                    <td className="p-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => editarItem(item)}
                        title="Alterar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </td>
                    <td className="p-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => abrirDialogoMover(item.id)}
                        title="Mover para outra lista"
                      >
                        <MoveRight className="h-4 w-4" />
                      </Button>
                    </td>
                    <td className="p-4">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removerItem(item.id)}
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                    <FormLabel>Onde Assistir</FormLabel>
                    <FormControl>
                      <Input placeholder="Onde ver" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="série">Série</SelectItem>
                        <SelectItem value="filme">Filme</SelectItem>
                        <SelectItem value="anime">Anime</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="observacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observação</FormLabel>
                    <FormControl>
                      <Input placeholder="Observações (opcional)" {...field} />
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

      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover Item para Outra Lista</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">
              Selecione a lista para onde deseja mover este item:
            </p>
            {listasDisponiveis.length === 0 ? (
              <p className="text-sm text-amber-500">
                Não há outras listas disponíveis. Crie uma nova lista primeiro.
              </p>
            ) : (
              <Select 
                value={listaDestinoId} 
                onValueChange={setListaDestinoId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma lista" />
                </SelectTrigger>
                <SelectContent>
                  {listasDisponiveis.map((lista) => (
                    <SelectItem key={lista.id} value={lista.id}>
                      {lista.titulo}
                      {lista.isAssistidos && " (Assistidos)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setMoveDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={moverItem}
              disabled={!listaDestinoId || listasDisponiveis.length === 0}
            >
              Mover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 