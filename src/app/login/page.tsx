"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/frontend/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserGraduate,
  faUser,
  faLock,
  faEye,
  faEyeSlash,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await login({ usernameOrEmail: username, password });

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError("Credenciales incorrectas. Por favor, intente de nuevo.");
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white px-8 py-10 shadow-xl shadow-rose-100/50">
          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-50">
              <FontAwesomeIcon
                icon={faUserGraduate}
                className="text-2xl text-[#6b1631]"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-1 text-center text-2xl font-bold text-gray-900">
            MiCicata
          </h1>
          <p className="mb-6 text-center text-sm text-gray-500">
            Plataforma de Gestión Académica
          </p>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <FontAwesomeIcon
                icon={faExclamationCircle}
                className="shrink-0 text-amber-500"
              />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Usuario
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FontAwesomeIcon icon={faUser} className="text-sm" />
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej. jdoe@cicata.edu"
                  required
                  autoComplete="username"
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#6b1631] focus:outline-none focus:ring-2 focus:ring-[#6b1631]/20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Contraseña
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FontAwesomeIcon icon={faLock} className="text-sm" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese su contraseña"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#6b1631] focus:outline-none focus:ring-2 focus:ring-[#6b1631]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    className="text-sm"
                  />
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <button
                type="button"
                className="text-sm font-medium text-[#6b1631] hover:text-[#8b2040] transition-colors"
              >
                ¿Olvidó su contraseña?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-[#6b1631] py-3 text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-[#8b2040] focus:outline-none focus:ring-2 focus:ring-[#6b1631]/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
