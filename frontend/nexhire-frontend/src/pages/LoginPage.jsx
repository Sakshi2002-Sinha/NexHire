import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import AuthLayout from "../components/auth/AuthLayout";
import Input from "../components/ui/Input";
import { ErrorNotice } from "../components/ui/States";
import { clearAuthError, login } from "../store/authSlice";

function LoginPage() {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleSubmit = (event) => {
    event.preventDefault();
    dispatch(login({ email, password }));
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue your interview practice.">
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input label="Email" type="email" autoComplete="email" required value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <Input label="Password" type="password" autoComplete="current-password" required value={password}
          onChange={(e) => setPassword(e.target.value)} />
        <ErrorNotice message={error} />
        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
        <p className="text-center text-sm text-muted">
          New to NexHire?{" "}
          <Link to="/register" className="font-medium text-accent-dark underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
