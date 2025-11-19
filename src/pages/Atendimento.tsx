import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Send, Upload, X } from "lucide-react";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  telefone: z.string().min(10, "Telefone inválido"),
  mensagem: z.string().min(1, "Mensagem é obrigatória"),
});

type FormData = z.infer<typeof formSchema>;

export default function Atendimento() {
  const [isLoading, setIsLoading] = useState(false);
  const [imagem, setImagem] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      const payload: any = {
        nome: data.nome,
        telefone: data.telefone,
        mensagem: data.mensagem,
      };

      if (imagem) {
        payload.imagem = await convertToBase64(imagem);
        payload.imagem_nome = imagem.name;
      }

      if (video) {
        payload.video = await convertToBase64(video);
        payload.video_nome = video.name;
      }

      await fetch(
        "https://christoofer1992.app.n8n.cloud/webhook-test/ef46bf75-214a-4cff-b9d1-ebd9a33085f3",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          body: JSON.stringify(payload),
        }
      );

      toast.success("Mensagem enviada com sucesso!");
      reset();
      setImagem(null);
      setVideo(null);
    } catch (error) {
      console.error("Erro ao enviar:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Atendimento</h1>
        <p className="text-muted-foreground mt-2">
          Envie mensagens via WhatsApp para seus contatos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enviar Mensagem WhatsApp</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para enviar uma mensagem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                placeholder="Digite o nome do contato"
                {...register("nome")}
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                {...register("telefone")}
              />
              {errors.telefone && (
                <p className="text-sm text-destructive">{errors.telefone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mensagem">Mensagem</Label>
              <Textarea
                id="mensagem"
                placeholder="Digite sua mensagem"
                rows={5}
                {...register("mensagem")}
              />
              {errors.mensagem && (
                <p className="text-sm text-destructive">{errors.mensagem.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagem">Imagem (opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="imagem"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImagem(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("imagem")?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {imagem ? imagem.name : "Selecionar Imagem"}
                </Button>
                {imagem && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setImagem(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video">Vídeo (opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideo(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("video")?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {video ? video.name : "Selecionar Vídeo"}
                </Button>
                {video && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setVideo(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Mensagem
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
