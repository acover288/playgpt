"use client"

import React, { useEffect, useState } from 'react';
import { ChatCompletionRequestMessage, ChatCompletionResponseMessage, Configuration, OpenAIApi } from 'openai';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import useKeypress from 'react-use-keypress';

type ChatMessageType = ChatCompletionRequestMessage | ChatCompletionResponseMessage;

function tryParseJson(jsonText: string) {
  try {
    jsonText = `~~~json\n${JSON.stringify(JSON.parse(jsonText), undefined, 4)}\n~~~`;
  } catch (e) {
  }
  return jsonText;
}

const Message = ({ message }: { message: ChatMessageType }) => {
  if (message.role == 'user') {
    return <div className="msg p-4 mb-4 rounded bg-blue-200 mr-auto">
      <pre>{message.content}</pre>
    </div>
  } else {
    return <div>
      {message.content && <AssistantMessage role={message.role} content={message.content} />}
      {message.function_call?.arguments && <AssistantMessage role={message.role} content={tryParseJson(message.function_call.arguments)} />}
    </div>
  }
}

const AssistantMessage = ({ role, content }: any) => {
  return (
    <div className='msg p-4 mb-4 rounded bg-purple-200 ml-auto'>
      <ReactMarkdown className="dark:text-white" components={{ code: CodeBlock }}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

const CodeBlock = ({ node, inline, className, children }: any) => {
  const [isCopied, setIsCopied] = useState(false);

  const match = /language-(\w+)/.exec(className || '');

  const handleCopy = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (inline || !match) {
    return (
      <code className={className}>
        {children}
      </code>
    );
  }

  const codeContent = String(children).replace(/\n$/, '');

  return (
    <div>
      <CopyToClipboard text={String(children)}>
        <button onClick={handleCopy} className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded ${isCopied ? 'bg-green-500 hover:bg-green-600' : ''
          }`}>{isCopied ? "Copied" : "Copy"}</button>
      </CopyToClipboard>
      <SyntaxHighlighter
        language={match[1]}
        style={materialLight}
        PreTag="div"
      >
        {codeContent}
      </SyntaxHighlighter>
    </div>
  );
};

const ApiKeyInput: React.FC<{ apiKey: string; onApiKeyChange: (apiKey: string) => void }> = ({ apiKey, onApiKeyChange }) => {
  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onApiKeyChange(event.target.value);
  };

  return (
    <input
      type="text"
      id="API-Key"
      placeholder="Enter your API Key here"
      value={apiKey}
      onChange={handleApiKeyChange}
      className="w-full py-2 px-4 rounded border border-gray-300 mb-4 dark:bg-opacity-50 dark:text-black"
    />
  );
};

interface TextAreaInputProps {
  className?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({ className, placeholder, value, onChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      className={className}
    ></textarea>
  );
};

const modelOptions = [
  { value: 'gpt-3.5-turbo', input_cost: 0.0015, output_cost: 0.002, max_tokens: 4096 / 2 },
  { value: 'gpt-4', input_cost: 0.03, output_cost: 0.06, max_tokens: 8192 / 2 },
  // Add more model options as needed
];


const ChatPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [openai, setOpenAI] = useState<OpenAIApi | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [inputMsg, setInputMsg] = useState('');
  const [functionMsg, setFunctionMsg] = useState('');
  const [cost, setCost] = useState(0);
  const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const newApiKey = localStorage.getItem('apiKey');
    if (newApiKey) {
      setApiKey(newApiKey)
    }
  }, []);

  // Update localStorage when API key changes
  useEffect(() => {
    localStorage.setItem('apiKey', apiKey);
    if (apiKey) {
      const configuration = new Configuration({
        apiKey,
      });
      const _openai = new OpenAIApi(configuration);
      setOpenAI(_openai);
    }
  }, [apiKey]);

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value);
  };

  useKeypress(['Enter'], (event: any) => {
    if (event.ctrlKey && !loading) {
      handleSend();
    }
  });

  const handleSend = async () => {
    try {
      const selectedModelOption = modelOptions.find((option) => option.value === selectedModel);
      if (!selectedModelOption) {
        console.error(`invalid model selected ${selectedModel}`)
        return;
      }
      if (!openai) {
        console.error("openai is null");
        return;
      }
      if (loading) {
        console.error("Already loading")
        return;
      }

      setLoading(true);
      const newMessage: ChatMessageType = {
        role: 'user',
        content: inputMsg,
      };

      let newChatHistory = [...chatHistory, newMessage];

      setChatHistory(newChatHistory);
      setInputMsg('');

      const completion = await openai.createChatCompletion({
        model: selectedModel,
        messages: newChatHistory,
        temperature: 1,
        max_tokens: selectedModelOption.max_tokens,
        ...(functionMsg === '' ? {} : { functions: JSON.parse(functionMsg) })
      });

      const promptTokensCost = selectedModelOption.input_cost * (completion.data?.usage?.prompt_tokens || 0) / 1000;
      const completionTokensCost = selectedModelOption.output_cost * (completion.data?.usage?.completion_tokens || 0) / 1000;
      const newCost = cost + promptTokensCost + completionTokensCost;
      setCost(newCost);

      const response = completion.data?.choices[0];
      if (response?.finish_reason !== 'stop') {
        console.error('Error processing text', inputMsg);
      }

      const newAssistantMessage = response.message;

      if (newAssistantMessage) {
        newChatHistory = [...newChatHistory, newAssistantMessage];
        setChatHistory(newChatHistory);
      }
    } catch (error: any) {
      // Consider adjusting the error handling logic for your use case
      if (error.response) {
        console.error(error.response.status, error.response.data);
      } else {
        console.error(`Error with OpenAI API request: ${error.message}`);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex flex-col p-8 dark:bg-gray-800 h-screen">
      <h1 className="text-3xl font-bold mb-4 dark:text-white">GPT-4 Chat API</h1>
      <div className="flex items-center mb-4 dark:text-white">
        <div className="mr-4">
          Total cost: ${cost.toFixed(5)} USD
        </div>
        <select
          value={selectedModel}
          onChange={handleModelChange}
          className="py-2 px-4 rounded border border-gray-300 mr-4 dark:bg-opacity-50 dark:text-black"
        >
          {modelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value}
            </option>
          ))}
        </select>
        <ApiKeyInput apiKey={apiKey} onApiKeyChange={setApiKey} />
      </div>
      <div id="chat-box" className="flex-grow border border-gray-300 rounded p-4 mb-4 h-60 overflow-auto dark:bg-gray-900">
        {chatHistory.map((message, index) => (<Message key={index} message={message} />))}
      </div>
      <div className="input-area">
        <TextAreaInput className="w-full h-20 py-2 px-4 rounded border border-gray-300 dark:bg-opacity-50 dark:text-black"
          placeholder="Type your message here" value={inputMsg} onChange={setInputMsg} />
        <TextAreaInput className="w-full h-20 py-2 px-4 rounded border border-gray-300 dark:bg-opacity-50 dark:text-black"
          placeholder="Type your function definition here" value={functionMsg} onChange={setFunctionMsg} />
        <button id="btn-send" disabled={loading} title="ctrl+enter" onClick={handleSend} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded ml-4 disabled:bg-gray-300 disabled:cursor-not-allowed">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
