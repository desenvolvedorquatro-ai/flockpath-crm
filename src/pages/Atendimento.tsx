import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Send, Paperclip, Image as ImageIcon, Video } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  full_name: string;
  phone: string;
  lastMessage?: string;
  timestamp?: string;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "contact";
  timestamp: string;
  type?: "text" | "image" | "video";
  media?: string;
}

export default function Atendimento() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const { data: visitors, error } = await supabase
        .from("visitors")
        .select("id, full_name, phone")
        .not("phone", "is", null)
        .order("full_name");

      if (error) throw error;

      const formattedContacts: Contact[] = (visitors || []).map((v) => ({
        id: v.id,
        full_name: v.full_name,
        phone: v.phone || "",
      }));

      setContacts(formattedContacts);
    } catch (error) {
      console.error("Erro ao carregar contatos:", error);
      toast.error("Erro ao carregar contatos");
    }
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm)
  );

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedContact) return;

    setIsLoading(true);
    try {
      const payload = {
        nome: selectedContact.full_name,
        telefone: selectedContact.phone,
        mensagem: messageText,
      };

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

      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        sender: "user",
        timestamp: new Date().toISOString(),
        type: "text",
      };

      setMessages([...messages, newMessage]);
      setMessageText("");
      toast.success("Mensagem enviada!");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Lista de Conversas */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold mb-4">Conversas WhatsApp</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => {
                  setSelectedContact(contact);
                  setMessages([]);
                }}
                className={`w-full p-3 rounded-lg mb-1 flex items-start gap-3 hover:bg-accent transition-colors ${
                  selectedContact?.id === contact.id ? "bg-accent" : ""
                }`}
              >
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(contact.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="font-medium text-sm truncate">
                    {contact.full_name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {contact.phone}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Cabeçalho da Conversa */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(selectedContact.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{selectedContact.full_name}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedContact.phone}
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Campo de Envio */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Input
                  placeholder="Digite uma mensagem..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!messageText.trim() || isLoading}
                  size="icon"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Nenhuma conversa selecionada
              </h2>
              <p className="text-sm">
                Escolha uma conversa da lista para começar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
