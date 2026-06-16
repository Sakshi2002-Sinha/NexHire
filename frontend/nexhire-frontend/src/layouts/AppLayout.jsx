
import Navbar from "../components/Navbar";
function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-7 py-6">
        {children}
      </main>
    </div>
  );
}

export default AppLayout;


