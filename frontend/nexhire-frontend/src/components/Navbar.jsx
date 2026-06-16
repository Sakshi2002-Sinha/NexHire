import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard,
  History,
  Brain,
  LogOut,
} from "lucide-react";

import { logout } from "../store/authSlice";

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(
    (state) => state.auth.user
  );

const token =
  useSelector((state) => state.auth.token) ||
  localStorage.getItem("token");
  const initials =
    user?.name?.charAt(0)?.toUpperCase() || "U";

  const handleLogout = () => {
    localStorage.removeItem("token");

    dispatch(logout());

    navigate("/login");
  };

  const navClass = ({ isActive }) =>
  isActive
    ? "px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-medium"
    : "px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-50";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-7">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
  <span className="h-2 w-2 rounded-full bg-indigo-600" />

  <span className="font-semibold text-[17px] text-indigo-600">
    NexHire
  </span>
</div>

          
        </div>

        <nav className="flex items-center gap-2">
        {token ? (
          <>
            <NavLink
              to="/dashboard"
              className={navClass}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard size={18} />
                Dashboard
              </div>
            </NavLink>

            <NavLink
              to="/interview"
              className={navClass}
            >
              <div className="flex items-center gap-2">
                <Brain size={18} />
                Interview
              </div>
            </NavLink>

            <NavLink
              to="/history"
              className={navClass}
            >
              <div className="flex items-center gap-2">
                <History size={18} />
                History
              </div>
            </NavLink>
    </>
  ) : (
    <>
      <NavLink
        to="/login"
        className={navClass}
      >
        Login
      </NavLink>

      <NavLink
        to="/register"
        className={navClass}
      >
        Register
      </NavLink>
    </>
  )}
</nav>

        <div className="flex items-center gap-4">
         {token ? (
            <div className="flex items-center gap-4">
              <div
                className="
                  flex h-9 w-9 items-center
                  justify-center rounded-full
                  bg-indigo-600 text-sm
                  font-medium text-white
                "
              >
                {initials}
              </div>

              <button
                onClick={handleLogout}
                className="
                  flex items-center gap-2
                  rounded-xl border border-slate-200
                  px-3 py-2
                  hover:bg-slate-50
                "
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;