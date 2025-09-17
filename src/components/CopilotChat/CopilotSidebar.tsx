// src/components/CopilotChat/CopilotSidebar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Database, 
  Table, 
  Plus,
  Trash2,
  X,
  Bot,
  User,
  Copy,
  FileText
} from 'lucide-react';
import { FaGithub, FaLock } from 'react-icons/fa';
import { useGitHubAuth } from '../../hooks/useGitHubAuth';
import { useDatabaseContext, DatabaseContext } from '../../hooks/useDatabaseContext';
import { useAIModels } from '../../hooks/useAIModels';
import ModelSelector from './ModelSelector';
import UsageDisplay from './UsageDisplay';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  query?: string; // Generated SQL query if applicable
}

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNewTab: (query: string) => void;
}

const CopilotSidebar: React.FC<CopilotSidebarProps> = ({
  isOpen,
  onClose,
  onCreateNewTab
}) => {
  const { authState, signIn } = useGitHubAuth();
  const { 
    contexts, 
    addTableContext, 
    addDatabaseContext, 
    removeContext, 
    getContextDescription 
  } = useDatabaseContext();

  const {
    availableModels,
    selectedModel,
    setSelectedModel,
    usage,
    updateUsage,
    getUsagePercentage,
    getRemainingTokens,
    isUsageLimitReached,
    getSelectedModel,
    getDaysUntilReset,
    realUsageData,
    isConnectedToGitHub
  } = useAIModels();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm GitHub Copilot. I can help you write SQL queries based on your database structure. Add some database context to get started!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Check authentication status - simplified: just check if connected
  if (!authState.isConnected) {
    return (
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-gray-800 text-white shadow-xl transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } z-50`}
      >
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FaGithub className="text-blue-400" />
              GitHub Copilot
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="p-6 text-center">
          <FaLock className="mx-auto text-gray-400 text-4xl mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-gray-400 text-sm mb-4">
            Please connect to your GitHub account using the button in the top-right corner to use Copilot Chat.
          </p>
        </div>
      </div>
    );
  }

  // Mock function to generate SQL based on context and user message
  const generateSQL = async (userMessage: string, dbContexts: DatabaseContext[]): Promise<string> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const contextDescription = getContextDescription();
    const message = userMessage.toLowerCase();
    
    // Simple pattern matching for common queries
    if (message.includes('select') || message.includes('show') || message.includes('get') || message.includes('find')) {
      if (message.includes('user') || message.includes('customer')) {
        return `-- Query based on: "${userMessage}"
-- Context: ${contextDescription}
SELECT * FROM users 
ORDER BY created_at DESC 
LIMIT 10;`;
      } else if (message.includes('order') || message.includes('purchase')) {
        return `-- Query based on: "${userMessage}"
-- Context: ${contextDescription}
SELECT o.*, u.name as customer_name 
FROM orders o 
JOIN users u ON o.user_id = u.id 
ORDER BY o.created_at DESC 
LIMIT 20;`;
      } else if (message.includes('count')) {
        return `-- Query based on: "${userMessage}"
-- Context: ${contextDescription}
SELECT COUNT(*) as total_records FROM ${dbContexts[0]?.name || 'table_name'};`;
      }
      return `-- Query based on: "${userMessage}"
-- Context: ${contextDescription}
SELECT * FROM ${dbContexts[0]?.name || 'your_table'} 
LIMIT 10;`;
    }
    
    if (message.includes('create') || message.includes('insert') || message.includes('add')) {
      return `-- Insert query based on: "${userMessage}"
-- Context: ${contextDescription}
INSERT INTO ${dbContexts[0]?.name || 'your_table'} (column1, column2) 
VALUES ('value1', 'value2');`;
    }
    
    if (message.includes('update') || message.includes('change') || message.includes('modify')) {
      return `-- Update query based on: "${userMessage}"
-- Context: ${contextDescription}
UPDATE ${dbContexts[0]?.name || 'your_table'} 
SET column1 = 'new_value' 
WHERE id = 1;`;
    }
    
    if (message.includes('delete') || message.includes('remove')) {
      return `-- Delete query based on: "${userMessage}"
-- Context: ${contextDescription}
DELETE FROM ${dbContexts[0]?.name || 'your_table'} 
WHERE id = 1;`;
    }

    if (message.includes('join') || message.includes('relationship')) {
      return `-- Join query based on: "${userMessage}"
-- Context: ${contextDescription}
SELECT t1.*, t2.name 
FROM ${dbContexts[0]?.name || 'table1'} t1 
LEFT JOIN ${dbContexts[1]?.name || 'table2'} t2 ON t1.id = t2.foreign_id;`;
    }

    // Default response
    return `-- Query based on: "${userMessage}"
-- Available context: ${contextDescription}
SELECT * FROM ${dbContexts[0]?.name || 'your_table'} 
WHERE condition = 'value'
LIMIT 10;`;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    if (!authState.isConnected) {
      alert('Please connect to GitHub first to use Copilot Chat');
      return;
    }

    if (isUsageLimitReached()) {
      alert('You have reached your monthly usage limit. Please wait for the reset or upgrade your plan.');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Generate SQL query
      const sqlQuery = await generateSQL(input.trim(), contexts);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Here's a SQL query based on your request using ${getSelectedModel()?.name}:`,
        query: sqlQuery,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Simulate token usage (random between 50-200 tokens)
      const tokensUsed = Math.floor(Math.random() * 150) + 50;
      updateUsage(tokensUsed);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error generating the query. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAddContext = () => {
    // Simple dialog for adding database context
    const contextType = prompt('Add context type (database/table):');
    if (!contextType || (contextType !== 'database' && contextType !== 'table')) return;

    const name = prompt(`Enter ${contextType} name:`);
    if (!name) return;

    if (contextType === 'database') {
      addDatabaseContext(name.trim(), 'default');
    } else {
      addTableContext(name.trim(), 'default');
    }
  };

  const handleRemoveContext = (id: string) => {
    removeContext(id);
  };

  const handleCreateQuery = (query: string) => {
    onCreateNewTab(query);
  };

  const handleCopyQuery = (query: string) => {
    navigator.clipboard.writeText(query);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-gray-900 border-l border-gray-700 flex flex-col z-40">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Bot size={20} className="text-green-400" />
          <h2 className="text-lg font-semibold text-white">Copilot Chat</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      {/* Connection Status */}
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
        {authState.isConnected ? (
          <div className="flex items-center space-x-2 text-sm text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Connected as {authState.user?.login}</span>
          </div>
        ) : (
          <div className="text-sm text-gray-400">
            Connect to GitHub to use Copilot Chat
          </div>
        )}
      </div>

      {/* AI Model Selection */}
      {authState.isConnected && (
        <div className="p-4 border-b border-gray-700">
          <div className="mb-2">
            <h3 className="text-sm font-medium text-gray-300 mb-2">AI Model</h3>
            <ModelSelector
              availableModels={availableModels}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          </div>
        </div>
      )}

      {/* Usage Display */}
      {authState.isConnected && (
        <div className="p-4 border-b border-gray-700">
          <UsageDisplay
            usage={usage}
            usagePercentage={getUsagePercentage()}
            remainingTokens={getRemainingTokens()}
            daysUntilReset={getDaysUntilReset()}
            isLimitReached={isUsageLimitReached()}
            isConnectedToGitHub={isConnectedToGitHub}
            realUsageData={realUsageData}
          />
        </div>
      )}

      {/* Context Section */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-300">Database Context</h3>
          <button
            onClick={handleAddContext}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
            title="Add database or table context"
          >
            <Plus size={14} />
          </button>
        </div>
        
        <div className="space-y-1">
          {contexts.map(context => (
            <div key={context.id} className="flex items-center justify-between bg-gray-800 p-2 rounded text-sm">
              <div className="flex items-center space-x-2">
                {context.type === 'database' ? <Database size={14} /> : <Table size={14} />}
                <span className="text-gray-300">{context.name}</span>
              </div>
              <button
                onClick={() => handleRemoveContext(context.id)}
                className="text-gray-500 hover:text-red-400"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {contexts.length === 0 && (
            <p className="text-xs text-gray-500">No context added. Add databases or tables to get better suggestions.</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div key={message.id} className="space-y-2">
            <div className={`flex items-start space-x-2 ${message.type === 'user' ? 'justify-end' : ''}`}>
              {message.type === 'assistant' && <Bot size={16} className="text-green-400 mt-1" />}
              <div className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-200'
              }`}>
                <p className="text-sm">{message.content}</p>
                {message.query && (
                  <div className="mt-3 p-3 bg-gray-900 rounded border border-gray-600">
                    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                      {message.query}
                    </pre>
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => handleCreateQuery(message.query!)}
                        className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white"
                      >
                        <FileText size={12} />
                        <span>New Query Tab</span>
                      </button>
                      <button
                        onClick={() => handleCopyQuery(message.query!)}
                        className="flex items-center space-x-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300"
                      >
                        <Copy size={12} />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {message.type === 'user' && <User size={16} className="text-blue-400 mt-1" />}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-start space-x-2">
            <Bot size={16} className="text-green-400 mt-1" />
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        {isUsageLimitReached() && authState.isConnected && (
          <div className="mb-3 p-2 bg-red-900 border border-red-700 rounded text-sm text-red-200">
            ⚠️ Monthly usage limit reached. Resets in {getDaysUntilReset()} {getDaysUntilReset() === 1 ? 'day' : 'days'}.
          </div>
        )}
        
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              !authState.isConnected 
                ? "Connect to GitHub first..."
                : isUsageLimitReached()
                ? "Usage limit reached..."
                : "Ask me to generate SQL queries..."
            }
            disabled={!authState.isConnected || isUsageLimitReached()}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || !authState.isConnected || isUsageLimitReached()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-white"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default CopilotSidebar;
