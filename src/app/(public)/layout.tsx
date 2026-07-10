import { PublicAuthLayout } from "@/modules/auth/components";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PublicAuthLayout>{children}</PublicAuthLayout>;
}
