import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/features/auth/LoginForm";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const invited = searchParams.get("invited") === "1";

  return <LoginForm registered={registered} invited={invited} />;
}
