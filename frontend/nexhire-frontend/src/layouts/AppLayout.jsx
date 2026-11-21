import { Suspense } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar";
import { Loading } from "../components/ui/States";

function AppLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

export default AppLayout;
