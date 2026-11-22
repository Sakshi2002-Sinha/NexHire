import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import AuthLayout from "../components/auth/AuthLayout";
import Input from "../components/ui/Input";
import { ErrorNotice } from "../components/ui/States";
import { clearAuthError, register } from "../store/authSlice";

function RegisterPage() {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleSubmit = (event) => {
    event.preventDefault();
    dispatch(register(form));
  };

  return (
    <AuthLayout title="Create your account" subtitle="Your interview history and progress stay in one place.">
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input label="Name" autoComplete="name" required maxLength={100} value={form.name} onChange={update("name")} />
        <Input label="Email" type="email" autoComplete="email" required value={form.email} onChange={update("email")}
          placeholder="you@example.com" />
        <Input label="Password" type="password" autoComplete="new-password" required minLength={8} maxLength={72}
          value={form.password} onChange={update("password")} hint="At least 8 characters." />
        <ErrorNotice message={error} />
        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? "Creating account..." : "Create account"}
        </button>
        <p className="text-center text-sm text-muted">
          Already registered?{" "}
          <Link to="/login" className="font-medium text-accent-dark underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default RegisterPage;
