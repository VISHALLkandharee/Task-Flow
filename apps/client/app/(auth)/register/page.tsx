'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

// ─────────────────────────────────────────
// Validation Schema
// ─────────────────────────────────────────
const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  workspaceName: z
    .string()
    .min(2, 'Workspace name must be at least 2 characters'),
});

type RegisterInput = z.infer<typeof RegisterSchema>;

// ─────────────────────────────────────────
// Register Page
// ─────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setWorkspace } = useAuthStore();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      setServerError('');
      const response = await api.post('/auth/register', data);

      // Save to global store
      setUser(response.data.user);
      setWorkspace(response.data.workspace);
      useAuthStore.getState().setWorkspaces([{
        ...response.data.workspace,
        role: 'OWNER'
      }]);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      setServerError(
        error.response?.data?.message || 'Something went wrong'
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-1">
        Create your account
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        Start managing your team in minutes
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Server Error */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
            {serverError}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            {...register('name')}
            type="text"
            placeholder="Hitesh Kumar"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            placeholder:text-gray-400"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            {...register('email')}
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
            {...register('password')}
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

        {/* Workspace Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Workspace Name
          </label>
          <input
            {...register('workspaceName')}
            type="text"
            placeholder="My Startup"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            placeholder:text-gray-400"
          />
          {errors.workspaceName && (
            <p className="text-red-500 text-xs mt-1">
              {errors.workspaceName.message}
            </p>
          )}
          <p className="text-gray-400 text-xs mt-1">
            This will be your team's workspace
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm
          font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2
          focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50
          disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>

      </form>

      {/* Login link */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-indigo-600 font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}