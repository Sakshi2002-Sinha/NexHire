import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute({ children }) {
  const reduxToken = useSelector(
    (state) => state.auth.token
  );

  const token =
    reduxToken ||
    localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
}
export default ProtectedRoute;