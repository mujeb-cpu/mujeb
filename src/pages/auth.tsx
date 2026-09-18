import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function AuthPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/?auth=1", { replace: true });
  }, [navigate]);
  return null;
}
