import { History, LayoutDashboard, LogOut, MessagesSquare } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";

import { logout } from "../store/authSlice";
import Logo from "./ui/Logo";

const LINKS = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/interview", "Interview", MessagesSquare],
  ["/history", "History", History],
];

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
      isActive ? "bg-accent-soft font-medium text-accent-dark" : "text-muted hover:bg-line/40 hover:text-ink"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo to="/dashboard" />
        <nav aria-label="Main" className="flex items-center gap-1">
          {LINKS.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} className={linkClass} aria-label={label}>
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden max-w-32 truncate text-sm text-muted md:block">{user?.name}</span>
          <button onClick={handleLogout} className="btn-quiet px-2.5" aria-label="Log out" title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
