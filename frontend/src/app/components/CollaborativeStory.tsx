import { useState, useEffect, useRef } from 'react';
import WebSocketService from '../services/websocket';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';

interface Story {
  id: number;
  title: string;
  content: string;
  created_at?: string;
  author_name?: string;
  last_edited_at?: string;
  last_edited_by?: number;
  last_edited_by_name?: string;
}

interface Props {
  storyId: number;
  userId: number;
  username: string;
  onStoryUpdate?: (story: Story) => void;
}

const CollaborativeStory: React.FC<Props> = ({ storyId, userId, username, onStoryUpdate }) => {
  const [story, setStory] = useState<Story | null>(null);
  const [content, setContent] = useState('');
  const [lastEditedAt, setLastEditedAt] = useState<string | undefined>('');
  const [lastEditedBy, setLastEditedBy] = useState<number | undefined>(undefined);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const ws = WebSocketService.getInstance();
  const isTyping = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Fetch story data
  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await api.get(`/api/stories/${storyId}`);
        setStory(response.data);
        setContent(response.data.content);
        setLastEditedAt(response.data.last_edited_at);
        setLastEditedBy(response.data.last_edited_by);
      } catch (error) {
        setError('Failed to load story');
        console.error('Error fetching story:', error);
      }
    };
    fetchStory();
  }, [storyId]);

  // Handle WebSocket messages
  useEffect(() => {
    const handleMessage = (message: any) => {
      switch (message.type) {
        case 'story_content_updated':
          if (message.storyId === storyId) {
            setContent(message.content);
            setLastEditedAt(message.lastEditedAt);
            setLastEditedBy(message.userId);
            setStory(prev => prev ? {
              ...prev,
              content: message.content,
              last_edited_at: message.lastEditedAt,
              last_edited_by: message.userId,
              last_edited_by_name: message.last_edited_by_name
            } : prev);
            if (onStoryUpdate) {
              onStoryUpdate({
                ...story!,
                content: message.content,
                last_edited_at: message.lastEditedAt,
                last_edited_by: message.userId,
                last_edited_by_name: message.last_edited_by_name
              });
            }
          }
          break;
        case 'typing':
          setTypingUsers(prev => new Set([...prev, message.username]));
          break;
        case 'stop_typing':
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(message.username);
            return newSet;
          });
          break;
      }
    };
    ws.addMessageHandler(handleMessage);
    return () => ws.removeMessageHandler(handleMessage);
  }, [story, storyId, onStoryUpdate, ws]);

  // Debounced send content
  const debouncedSendContent = useRef(
    debounce((newContent: string) => {
      ws.sendMessage({
        type: 'update_story_content',
        storyId,
        content: newContent,
        userId: userId,
        username: username
      });
    }, 500)
  ).current;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    debouncedSendContent(e.target.value);
    if (!isTyping.current) {
      ws.sendMessage({ type: 'typing', storyId, username });
      isTyping.current = true;
    }
    // Stop typing after 1s of inactivity
    setTimeout(() => {
      ws.sendMessage({ type: 'stop_typing', storyId, username });
      isTyping.current = false;
    }, 1000);
  };

  // Auto-expand textarea to fit content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  if (error) {
    return (
      <div className="p-4 text-red-600">
        <p>{error}</p>
        <button
          onClick={() => navigate('/stories')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Stories
        </button>
      </div>
    );
  }

  if (!story) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {(() => {
        const normalizedUsername = username.trim().toLowerCase();
        const othersTyping = Array.from(typingUsers)
          .filter(name => typeof name === 'string' && name.trim().toLowerCase() !== normalizedUsername);
        if (othersTyping.length > 0) {
          return (
            <div className="mb-4 text-gray-600 italic">
              {othersTyping.join(', ')} {othersTyping.length === 1 ? 'is' : 'are'} typing...
            </div>
          );
        }
        return null;
      })()}
      <textarea
        ref={textareaRef}
        className="w-full p-4 border rounded min-h-[200px] resize-none"
        value={content}
        onChange={handleContentChange}
        style={{ overflow: 'hidden' }}
      />
      <div className="mt-2 text-sm text-gray-500">
        Last edited at: {lastEditedAt ? new Date(lastEditedAt).toLocaleString() : 'N/A'}
        {lastEditedBy && (
          <span> by {story?.last_edited_by_name || story?.author_name}</span>
        )}
      </div>
    </div>
  );
};

export default CollaborativeStory; 