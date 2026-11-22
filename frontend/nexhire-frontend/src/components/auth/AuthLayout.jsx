import Logo from "../ui/Logo";

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-7">
        <Logo />
      </div>
      <div className="card w-full max-w-md p-7">
        <h1 className="text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
