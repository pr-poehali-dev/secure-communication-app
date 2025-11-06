import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  encrypted: boolean;
}

interface User {
  username: string;
  lastSeen: Date;
}

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'search' | 'chat'>('login');
  const [username, setUsername] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [currentChat, setCurrentChat] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const mockUsers: User[] = [
    { username: 'alice_crypto', lastSeen: new Date() },
    { username: 'bob_secure', lastSeen: new Date(Date.now() - 300000) },
    { username: 'charlie_anon', lastSeen: new Date(Date.now() - 600000) },
  ];

  const handleLogin = () => {
    if (!username.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите никнейм",
        variant: "destructive"
      });
      return;
    }
    
    const existingUser = mockUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUser) {
      toast({
        title: "Ошибка",
        description: "Никнейм уже занят",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Успешно",
      description: `Добро пожаловать, @${username}`,
    });
    setCurrentScreen('search');
  };

  const handleSelectUser = (user: User) => {
    setCurrentChat(user);
    setMessages([
      {
        id: '1',
        text: 'Привет! Это защищенный чат 🔒',
        sender: user.username,
        timestamp: new Date(Date.now() - 60000),
        encrypted: true
      }
    ]);
    setCurrentScreen('chat');
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !currentChat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageInput,
      sender: username,
      timestamp: new Date(),
      encrypted: true
    };

    setMessages([...messages, newMessage]);
    setMessageInput('');
  };

  const filteredUsers = mockUsers.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  if (currentScreen === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary/20">
        <Card className="w-full max-w-md p-8 space-y-6 animate-fade-in backdrop-blur-sm border-2">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
              <Icon name="Lock" size={32} className="text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">SecureChat</h1>
            <p className="text-muted-foreground">Защищенное общение без компромиссов</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Никнейм</label>
              <Input
                placeholder="Введите уникальный никнейм"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="h-12"
              />
            </div>

            <Button 
              onClick={handleLogin}
              className="w-full h-12 text-lg"
              size="lg"
            >
              Начать общение
              <Icon name="ArrowRight" size={20} className="ml-2" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <Icon name="ShieldCheck" size={16} />
            <span>End-to-end шифрование • Без email • Полная приватность</span>
          </div>
        </Card>
      </div>
    );
  }

  if (currentScreen === 'search') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 bg-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">@{username}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Онлайн
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Icon name="Settings" size={20} />
              </Button>
            </div>

            <div className="relative">
              <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по никнейму..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Icon name="Users" size={48} className="mx-auto text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Пользователи не найдены</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <Card
                  key={user.username}
                  className="p-4 hover:bg-accent/50 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 bg-secondary">
                      <AvatarFallback className="bg-secondary text-secondary-foreground font-bold">
                        {user.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">@{user.username}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Icon name="Shield" size={12} />
                        E2E шифрование
                      </p>
                    </div>
                    <Icon name="MessageCircle" size={20} className="text-muted-foreground" />
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentScreen('search')}
          >
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <Avatar className="h-10 w-10 bg-secondary">
            <AvatarFallback className="bg-secondary text-secondary-foreground font-bold">
              {currentChat?.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">@{currentChat?.username}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Icon name="Lock" size={10} />
              Защищенный чат
            </p>
          </div>
          <Button variant="ghost" size="icon">
            <Icon name="MoreVertical" size={20} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="flex justify-center">
            <div className="bg-muted/50 text-xs px-3 py-1 rounded-full flex items-center gap-2">
              <Icon name="ShieldCheck" size={12} />
              <span>Сообщения защищены end-to-end шифрованием</span>
            </div>
          </div>

          {messages.map((msg) => {
            const isOwn = msg.sender === username;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isOwn
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border'
                  }`}
                >
                  <p className="break-words">{msg.text}</p>
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <span className={`text-xs ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {formatTime(msg.timestamp)}
                    </span>
                    {msg.encrypted && (
                      <Icon name="Lock" size={10} className={isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon">
            <Icon name="Paperclip" size={20} />
          </Button>
          <Input
            placeholder="Сообщение..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            disabled={!messageInput.trim()}
          >
            <Icon name="Send" size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
