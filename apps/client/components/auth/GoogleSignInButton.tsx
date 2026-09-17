"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

interface GoogleSignInButtonProps {
  onError?: (message: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}

export default function GoogleSignInButton({
  onError,
  text = "continue_with",
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const { setUser, setWorkspace, setWorkspaces } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      onError?.("Failed to retrieve Google credentials. Please try again.");
      return;
    }

    try {
      setIsProcessing(true);
      const response = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });

      // Clear existing session state first
      useAuthStore.getState().logout();

      setUser(response.data.user);

      if (response.data.workspaces && response.data.workspaces.length > 0) {
        setWorkspaces(response.data.workspaces);
      }

      if (response.data.workspace) {
        setWorkspace(response.data.workspace);
        router.push("/dashboard");
      } else {
        router.push("/create-workspace");
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || "Google authentication failed. Please try again.";
      onError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleError = () => {
    onError?.("Google sign-in was canceled or failed.");
  };

  return (
    <div className="w-full flex justify-center">
      {isProcessing ? (
        <div className="w-full flex items-center justify-center py-2.5 px-4 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2" />
          Signing in with Google...
        </div>
      ) : (
        <div className="w-full flex justify-center [&>div]:w-full">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap={false}
            theme="outline"
            size="large"
            text={text}
            shape="rectangular"
            width="100%"
          />
        </div>
      )}
    </div>
  );
}
