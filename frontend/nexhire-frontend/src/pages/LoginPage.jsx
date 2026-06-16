import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";

import axiosClient from "../api/axiosClient";

import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../store/authSlice";

import AuthLayout from "../components/auth/AuthLayout";
import Input from "../components/ui/Input";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading, error } =
    useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      dispatch(loginStart());

      const formData =
        new URLSearchParams();

      formData.append(
        "username",
        email
      );

      formData.append(
        "password",
        password
      );

      const loginResponse =
        await axiosClient.post(
          "/login",
          formData,
          {
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
            },
          }
        );

      const token =
        loginResponse.data.access_token;

      localStorage.setItem(
        "token",
        token
      );

      const meResponse =
        await axiosClient.get("/me");

      dispatch(
        loginSuccess({
          token,
          user: meResponse.data,
        })
      );

      navigate("/dashboard");
    } catch (error) {
      dispatch(
        loginFailure(
          error.response?.data?.detail ||
            "Login failed"
        )
      );
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your interview preparation"
    >
      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4"
      >
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          placeholder="you@example.com"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          placeholder="••••••••"
        />

        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-indigo-600 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading
            ? "Signing In..."
            : "Sign In"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-indigo-600"
          >
            Register
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;