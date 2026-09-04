"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from "@/hooks/useComments";
import { useAuthStore } from "@/store/authStore";

interface TaskCommentsPanelProps {
  taskId: string;
}

export default function TaskCommentsPanel({ taskId }: TaskCommentsPanelProps) {
  const [content, setContent] = useState("");
  const { user } = useAuthStore();
  const isOptimistic = taskId.startsWith("temp-");
  const { data: comments, isLoading } = useComments(taskId);
  const { mutate: createComment, isPending } = useCreateComment(taskId);
  const { mutate: deleteComment } = useDeleteComment(taskId);

  if (isOptimistic) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Comments (0)
        </label>
        <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
          Saving task on server... You can comment once saved.
        </p>
      </div>
    );
  }

  const submitComment = () => {
    if (!content.trim()) return;
    createComment(content.trim(), {
      onSuccess: () => setContent(""),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitComment();
    }
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000,
    );
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div>
      <label
        className="block text-xs font-medium text-gray-500
        uppercase tracking-wide mb-3"
      >
        Comments ({comments?.length || 0})
      </label>

      {/* Comment list */}
      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 size={16} className="animate-spin text-gray-400" />
          </div>
        ) : comments?.length === 0 ? (
          <p
            className="text-xs text-gray-400 text-center py-4
            bg-gray-50 rounded-lg border border-gray-200"
          >
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments?.map((comment) => (
            <div key={comment.id} className="flex gap-2.5 group">
              {/* Avatar */}
              <div
                className="w-6 h-6 bg-indigo-100 rounded-full flex
                items-center justify-center shrink-0 mt-0.5"
              >
                <span className="text-xs font-medium text-indigo-700">
                  {comment.author.name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-900">
                    {comment.author.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {timeAgo(comment.createdAt)}
                  </span>
                  {comment.author.id === user?.id && (
                    <button
                      type="button"
                      onClick={() => deleteComment(comment.id)}
                      className="opacity-0 group-hover:opacity-100
                      text-gray-300 hover:text-red-500 transition-all
                      ml-auto"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
                <p
                  className="text-xs text-gray-700 leading-relaxed
                  bg-gray-50 rounded-lg px-3 py-2 border border-gray-200"
                >
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add comment form */}
      <div className="flex gap-2">
        <div
          className="w-6 h-6 bg-indigo-100 rounded-full flex
          items-center justify-center shrink-0 mt-1"
        >
          <span className="text-xs font-medium text-indigo-700">
            {user?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-1.5 text-xs border
            border-gray-200 rounded-lg text-gray-900 bg-white
            focus:outline-none focus:ring-1 focus:ring-indigo-500
            placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={submitComment}
            disabled={isPending || !content.trim()}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs
            rounded-lg hover:bg-indigo-700 disabled:opacity-50
            disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              "Send"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
