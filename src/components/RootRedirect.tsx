import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

function RootRedirect() {
  // Aquí puedes decidir la lógica:
  // Ejemplo: si quieres que siempre vaya a login-user
  // return <Navigate to="/login-user" replace />;

  // O si quieres diferenciar por rol/flag en el store:
  const { userType } = useAuthStore(); // supongamos que guardas "empleado" o "usuario"

  if (userType === "usuario") {
    return <Navigate to="/login-user" replace />;
  }
  return <Navigate to="/login" replace />;
}

export default RootRedirect;
