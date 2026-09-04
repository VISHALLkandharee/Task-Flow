"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

// ─────────────────────────────────────────
// Validation Schema
// ─────────────────────────────────────────
const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginInput = z.infer<typeof LoginSchema>;

// ─────────────────────────────────────────
// Login Page
// ─────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const { setUser, setWorkspace } = useAuthStore();
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

    const onSubmit = async (data: LoginInput) => {
    try {
      setIsLoading(true);
      setServerError("");

      const response = await api.post("/auth/login", data);

      // Clear old data first
      useAuthStore.getState().logout();

      setUser(response.data.user);

      // Save ALL workspaces
      if (response.data.workspaces) {
        useAuthStore.getState().setWorkspaces(response.data.workspaces);
      }

      // Check if user has a workspace
      if (response.data.workspace) {
        setWorkspace(response.data.workspace);
        router.push("/dashboard");
      } else {
        // Workspace was deleted — send to create one
        router.push("/create-workspace");
      }
    } catch (error: any) {
      setServerError(
        error.response?.data?.message || "Invalid email or password",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-1">
        Welcome back
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        Sign in to your account to continue
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Server Error */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
            {serverError}
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="you@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            placeholder:text-gray-400"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            placeholder:text-gray-400"
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg
  text-sm font-medium hover:bg-indigo-700 disabled:opacity-50
  disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {/* Register link */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have an account?{" "}
        <Link
          href="/register"
          className="text-indigo-600 font-medium hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
