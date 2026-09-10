import { env } from "@/lib/env";
import { RegistrationPage } from "@/modules/registration/components/RegistrationPage";

export default function RegisterPage() {
  return <RegistrationPage enabled={env.PUBLIC_REGISTRATION_ENABLED} />;
}
