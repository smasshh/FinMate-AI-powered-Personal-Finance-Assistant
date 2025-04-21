
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

const ChatBot = () => {
  const [conversation, setConversation] = useState([]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">ChatBot</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Financial Support ChatBot</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Placeholder for chatbot */}
          <p>ChatBot coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatBot;
