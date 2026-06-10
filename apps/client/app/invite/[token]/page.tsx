'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { invitesApi } from '@/lib/api/members';
import { useAuthStore } from '@/store/authStore';

interface InviteDetails {
  email: string;
  role: string;
  workspace: { id: string; name: string; slug: string };
  invitedBy: { name: string };
}

export default function AcceptInvitePage() {
  const { token } = useParams() as { token: string };
  const router = useRouter();
  const { isAuthenticated, setWorkspace } = useAuthStore();

  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Fetch invite details on load
  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const data = await invitesApi.getByToken(token);
        setInvite(data);
      } catch (err: any) {
        setError(
          err.response?.data?.error?.message || 'Invite not found or expired'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    // Not logged in? redirect to register with token in URL
    if (!isAuthenticated) {
      router.push(`/register?inviteToken=${token}`);
      return;
    }

    try {
      setIsAccepting(true);
      const data = await invitesApi.accept(token);
      setWorkspace(data.workspace);
      setAccepted(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 'Failed to accept invite'
      );
    } finally {
      setIsAccepting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center
      justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center
      justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200
        p-8 max-w-md w-full text-center">
          <XCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Invalid Invite
          </h2>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 text-indigo-600 text-sm font-medium
            hover:underline"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (accepted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center
      justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200
        p-8 max-w-md w-full text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome aboard! 🎉
          </h2>
          <p className="text-gray-500 text-sm">
            You've joined{' '}
            <strong>{invite?.workspace.name}</strong>.
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center
    justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200
      p-8 max-w-md w-full">

        {/* Logo */}
        <h1 className="text-2xl font-bold text-indigo-600 mb-6">
          TaskFlow
        </h1>

        {/* Invite details */}
        <div className="mb-6">
          <p className="text-gray-600 text-sm mb-4">
            <strong>{invite?.invitedBy.name}</strong> has invited you
            to join their workspace on TaskFlow.
          </p>

          <div className="bg-indigo-50 border border-indigo-100
          rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Workspace</span>
              <span className="text-sm font-semibold text-gray-900">
                {invite?.workspace.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Your role</span>
              <span className="text-sm font-medium text-indigo-700">
                {invite?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleAccept}
          disabled={isAccepting}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl
          text-sm font-medium hover:bg-indigo-700 disabled:opacity-50
          transition-colors"
        >
          {isAccepting
            ? 'Joining...'
            : isAuthenticated
            ? 'Accept & Join Workspace'
            : 'Sign up to Accept Invite'}
        </button>

        {!isAuthenticated && (
          <p className="text-center text-xs text-gray-500 mt-3">
            Already have an account?{' '}
            <Link
              href={`/login?inviteToken=${token}`}
              className="text-indigo-600 font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}