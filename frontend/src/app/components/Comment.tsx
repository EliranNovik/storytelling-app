import { formatDistanceToNow } from 'date-fns';

interface CommentProps {
  content: string;
  author_name: string;
  created_at: string;
}

const Comment = ({ content, author_name, created_at }: CommentProps) => {
  return (
    <div className="bg-base-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium">{author_name}</span>
        <span className="text-sm text-gray-500">•</span>
        <span className="text-sm text-gray-500">
          {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
        </span>
      </div>
      <p className="text-sm">{content}</p>
    </div>
  );
};

export default Comment; 