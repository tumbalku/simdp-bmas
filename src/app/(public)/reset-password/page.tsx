import { Suspense } from "react";
import { ResetPasswordPage as ResetPasswordPageComponent } from "@/modules/auth/components";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <ResetPasswordPageComponent />
    </Suspense>
  );
}
