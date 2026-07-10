import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function AuthField({
  id,
  label,
  placeholder,
  type = "text",
  helper,
}: {
  id: string;
  label: string;
  placeholder: string;
  type?: string;
  helper?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} placeholder={placeholder} className="h-10" />
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}
