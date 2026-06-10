"use client";

import { useState } from "react";
import { UserPlus, Crown, Shield, User, Loader2, Trash2 } from "lucide-react";
import { useMembers, useRemoveMember, useUpdateRole } from "@/hooks/useMembers";
import { useAuthStore } from "@/store/authStore";
import InviteModal from "@/components/members/InviteModal";
import { cn } from "@/lib/utils";

const ROLE_CONFIG = {
  OWNER: {
    label: "Owner",
    icon: Crown,
    style: "bg-yellow-100 text-yellow-700",
  },
  ADMIN: {
    label: "Admin",
    icon: Shield,
    style: "bg-blue-100 text-blue-700",
  },
  MEMBER: {
    label: "Member",
    icon: User,
    style: "bg-gray-100 text-gray-700",
  },
};

export default function MembersPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const { data: members, isLoading } = useMembers();
  const { mutate: removeMember } = useRemoveMember();
  const { mutate: updateRole } = useUpdateRole();
  const { user } = useAuthStore();

  // Find current user's role
  const currentMember = members?.find((m) => m.user.id === user?.id);
  const isOwner = currentMember?.role === "OWNER";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-500 text-sm mt-1">
            {members?.length || 0} member
            {members?.length !== 1 ? "s" : ""} in this workspace
          </p>
        </div>

        {/* Only OWNER/ADMIN can invite */}
        {(isOwner || currentMember?.role === "ADMIN") && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white
            px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700
            transition-colors"
          >
            <UserPlus size={16} />
            Invite Member
          </button>
        )}
      </div>

      {/* Members List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {members?.map((member) => {
            const roleConfig = ROLE_CONFIG[member.role];
            const RoleIcon = roleConfig.icon;
            const isCurrentUser = member.user.id === user?.id;

            return (
              <div
                key={member.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between
                px-6 py-4 hover:bg-gray-50 transition-colors gap-3"
              >
                {/* Avatar + Info */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 bg-indigo-100 rounded-full
                  flex items-center justify-center shrink-0"
                  >
                    <span className="text-sm font-semibold text-indigo-700">
                      {member.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {member.user.name}
                      </p>
                      {isCurrentUser && (
                        <span
                          className="text-xs bg-gray-100 text-gray-500
                        px-1.5 py-0.5 rounded-full"
                        >
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{member.user.email}</p>
                  </div>
                </div>

                {/* Role + Actions */}
                <div className="flex items-center gap-3 justify-end sm:justify-start">
                  {/* Role badge */}
                  <span
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-medium",
                      "px-2.5 py-1 rounded-full",
                      roleConfig.style,
                    )}
                  >
                    <RoleIcon size={11} />
                    {roleConfig.label}
                  </span>

                  {/* Role change (owner only, not for self, not for other owners) */}
                  {isOwner && !isCurrentUser && member.role !== "OWNER" && (
                    <select
                      value={member.role}
                      onChange={(e) =>
                        updateRole({ id: member.id, role: e.target.value })
                      }
                      className="text-xs border border-gray-200 rounded-lg
                      px-2 py-1 text-gray-600 bg-white focus:outline-none
                      focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  )}

                  {/* Remove button (owner only, not self, not other owners) */}
                  {isOwner && !isCurrentUser && member.role !== "OWNER" && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${member.user.name}?`)) {
                          removeMember(member.id);
                        }
                      }}
                      className="text-gray-400 hover:text-red-500
                      transition-colors p-1 rounded"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />
    </div>
  );
}
