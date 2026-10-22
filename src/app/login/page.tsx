"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        const roleRoute = data.user.role.toLowerCase().replace(/_/g, "-");
        router.push(`/${roleRoute}`);
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F3157 0%, #1a4473 50%, #0EA5E9 100%)" }}>
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-2xl shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex justify-center">
            <Image
              src="/assets/v-dental-care-web-logo.png"
              alt="V Dental Care"
              width={280}
              height={80}
              priority
              className="object-contain"
            />
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Sign in to access your workspace
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  required
                  className="block w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] outline-none transition-all appearance-none bg-white text-gray-900"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                >
                  <option value="" disabled>Select a role</option>
                  <option value="front-office">Front Office</option>
                  <option value="clinic-head">Clinic Head</option>
                  <option value="working-doctor">Working Doctor</option>
                  <option value="manager">Manager</option>
                  <option value="image-uploader">Image Uploader</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] outline-none transition-all"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center font-medium bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-[#0F3157] hover:bg-[#1a4473] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0EA5E9] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
