import { Link } from "react-router-dom";

function Logo({ to = "/" }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent font-display text-base font-bold text-white">
        N
      </span>
      <span className="font-display text-lg font-bold">NexHire</span>
    </Link>
  );
}

export default Logo;
