import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Contact {
  id: string;
  full_name: string;
  phone: string;
}

interface NovaConversaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
}

export function NovaConversaDialog({
  open,
  onOpenChange,
  contacts,
  onSelectContact,
}: NovaConversaDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm)
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const handleSelectContact = (contact: Contact) => {
    onSelectContact(contact);
    onOpenChange(false);
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Iniciar Nova Conversa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar contato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <Button
                  key={contact.id}
                  variant="ghost"
                  onClick={() => handleSelectContact(contact)}
                  className="w-full h-auto p-3 flex items-start gap-3 justify-start hover:bg-accent"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(contact.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{contact.full_name}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MessageCircle className="w-3 h-3 text-green-600" />
                      <span>{contact.phone}</span>
                    </div>
                  </div>
                </Button>
              ))}

              {filteredContacts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum contato encontrado</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
