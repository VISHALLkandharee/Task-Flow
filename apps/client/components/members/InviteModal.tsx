"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Send } from "lucide-react";
import { useSendInvite } from "@/hooks/useMembers";

const InviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER"]),
});

type InviteInput = z.infer<typeof InviteSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteModal({ isOpen, onClose }: Props) {
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { mutate: sendInvite } = useSendInvite();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteInput>({
    resolver: zodResolver(InviteSchema),
    defaultValues: { role: "MEMBER" },
  });

  const onSubmit = async (data: InviteInput) => {
    try {
      setIsLoading(true);
      setServerError("");
      setSuccess("");

      sendInvite(data, {
        onSuccess: () => {
          setSuccess(`Invite sent to ${data.email}!`);
          reset();
        },
        onError: (error: any) => {
          setServerError(
            error.response?.data?.error?.message || "Failed to send invite",
          );
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setServerError("");
    setSuccess("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center
      justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6
        border-b border-gray-200"
        >
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Invite Member
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              They'll receive an email with a join link
            </p>
          </div>
          <button onClick={handleClose}>
            <X size={20} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {serverError && (
            <div
              className="bg-red-50 border border-red-200 text-red-600
            text-sm rounded-lg p-3"
            >
              {serverError}
            </div>
          )}

          {success && (
            <div
              className="bg-green-50 border border-green-200
            text-green-700 text-sm rounded-lg p-3 flex items-center gap-2"
            >
              <span>✅</span> {success}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="colleague@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg
              text-sm text-gray-900 focus:outline-none focus:ring-2
              focus:ring-indigo-500 focus:border-transparent"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              {...register("role")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg
              text-sm text-gray-900 focus:outline-none focus:ring-2
              focus:ring-indigo-500 bg-white"
            >
              <option value="MEMBER">Member — can view and edit tasks</option>
              <option value="ADMIN">Admin — can manage members too</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg
              text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2
              px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm
              font-medium hover:bg-indigo-700 disabled:opacity-50
              transition-colors"
            >
              <Send size={14} />
              {isLoading ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
