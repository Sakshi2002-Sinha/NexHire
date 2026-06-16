import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import axiosClient from "../api/axiosClient";

function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError(null);
      setIsLoading(true);

      await axiosClient.post(
        "/register",
        {
          name,
          email,
          password,
        }
      );

      navigate("/login");
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Registration failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center py-10">
      <div
        className="
          w-full
          max-w-md
          rounded-2xl
          border border-slate-200
          bg-white
          p-8
          shadow-sm
        "
      >
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Create Account
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Start practicing interviews with NexHire
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
              className="
                w-full
                rounded-lg
                border border-slate-300
                px-3 py-2
                outline-none
                focus:border-indigo-500
              "
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              className="
                w-full
                rounded-lg
                border border-slate-300
                px-3 py-2
                outline-none
                focus:border-indigo-500
              "
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              className="
                w-full
                rounded-lg
                border border-slate-300
                px-3 py-2
                outline-none
                focus:border-indigo-500
              "
            />
          </div>

          {error && (
            <div
              className="
                rounded-lg
                bg-red-50
                px-3 py-2
                text-sm
                text-red-600
              "
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="
              w-full
              rounded-lg
              bg-indigo-600
              py-2.5
              font-medium
              text-white
              hover:bg-indigo-700
            "
          >
            {isLoading
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;