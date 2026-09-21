"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RegistrationFormProps = {
  isPending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

type RegistrationFormValues = {
  name: string;
  email: string;
  nik: string;
  claimedNip: string;
  password: string;
  confirmPassword: string;
  phone: string;
};

type RegistrationField = keyof RegistrationFormValues;
type RegistrationErrors = Partial<Record<RegistrationField, string>>;
type RegistrationTouched = Partial<Record<RegistrationField, boolean>>;

const initialValues: RegistrationFormValues = {
  name: "",
  email: "",
  nik: "",
  claimedNip: "",
  password: "",
  confirmPassword: "",
  phone: "",
};

const helperText: Record<RegistrationField, string> = {
  name: "Isi sesuai nama lengkap pegawai.",
  email: "Gunakan email aktif untuk menerima kode OTP.",
  nik: "Isi NIK 16 digit angka jika tidak memakai NIP.",
  claimedNip: "Isi NIP minimal 10 digit angka jika tidak memakai NIK.",
  password: "Minimal 8 karakter.",
  confirmPassword: "Ulangi password yang sama.",
  phone: "Gunakan format nomor HP aktif.",
};

function validateRegistrationForm(values: RegistrationFormValues) {
  const errors: RegistrationErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const nik = values.nik.trim();
  const claimedNip = values.claimedNip.trim();
  const password = values.password;
  const confirmPassword = values.confirmPassword;
  const phone = values.phone.trim();

  if (name.length < 2) errors.name = "Nama minimal 2 karakter.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Format email tidak valid.";
  if (!nik && !claimedNip) errors.nik = "Isi minimal salah satu: NIK atau NIP.";
  if (nik && !/^\d{16}$/.test(nik)) errors.nik = "NIK harus 16 digit angka.";
  if (claimedNip && !/^\d{10,32}$/.test(claimedNip)) errors.claimedNip = "NIP minimal 10 digit angka.";
  if (password.length < 8) errors.password = "Password minimal 8 karakter.";
  if (confirmPassword.length < 8) errors.confirmPassword = "Konfirmasi password minimal 8 karakter.";
  if (confirmPassword.length >= 8 && password !== confirmPassword) {
    errors.confirmPassword = "Konfirmasi password tidak sesuai.";
  }
  if (phone && !/^[0-9+\-\s]{6,32}$/.test(phone)) errors.phone = "Format nomor HP tidak valid.";

  return errors;
}

function getFieldHint(input: {
  field: RegistrationField;
  errors: RegistrationErrors;
  touched: RegistrationTouched;
  values: RegistrationFormValues;
}) {
  const shouldShowError = input.touched[input.field] || input.values[input.field].trim().length > 0;
  return shouldShowError && input.errors[input.field] ? input.errors[input.field] : helperText[input.field];
}

function getHintClassName(input: {
  field: RegistrationField;
  errors: RegistrationErrors;
  touched: RegistrationTouched;
  values: RegistrationFormValues;
}) {
  const shouldShowError = input.touched[input.field] || input.values[input.field].trim().length > 0;
  return shouldShowError && input.errors[input.field] ? "text-xs text-destructive" : "text-xs text-muted-foreground";
}

export function RegistrationForm({ isPending, onSubmit }: RegistrationFormProps) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<RegistrationTouched>({});
  const errors = useMemo(() => validateRegistrationForm(values), [values]);
  const isValid = Object.keys(errors).length === 0;

  const updateField = (field: RegistrationField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const markTouched = (field: RegistrationField) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const getHintProps = (field: RegistrationField) => ({
    id: `${field}-hint`,
    className: getHintClassName({ field, errors, touched, values }),
  });

  const getAriaInvalid = (field: RegistrationField) => Boolean((touched[field] || values[field].trim()) && errors[field]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!isValid) {
      event.preventDefault();
      setTouched({
        name: true,
        email: true,
        nik: true,
        claimedNip: true,
        password: true,
        confirmPassword: true,
        phone: true,
      });
      return;
    }
    onSubmit(event);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nama lengkap <span className="text-destructive">*</span></Label>
          <Input
            id="name"
            name="name"
            className="h-10"
            required
            disabled={isPending}
            autoComplete="name"
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            onBlur={() => markTouched("name")}
            aria-invalid={getAriaInvalid("name")}
            aria-describedby="name-hint"
          />
          <p {...getHintProps("name")}>{getFieldHint({ field: "name", errors, touched, values })}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email aktif <span className="text-destructive">*</span></Label>
          <Input
            id="email"
            name="email"
            type="email"
            className="h-10"
            required
            disabled={isPending}
            autoComplete="email"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            onBlur={() => markTouched("email")}
            aria-invalid={getAriaInvalid("email")}
            aria-describedby="email-hint"
          />
          <p {...getHintProps("email")}>{getFieldHint({ field: "email", errors, touched, values })}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nik">NIK <span className="text-destructive">*</span></Label>
          <Input
            id="nik"
            name="nik"
            className="h-10"
            inputMode="numeric"
            placeholder="16 digit"
            disabled={isPending}
            value={values.nik}
            onChange={(event) => updateField("nik", event.target.value.replace(/\D/g, "").slice(0, 16))}
            onBlur={() => markTouched("nik")}
            aria-invalid={getAriaInvalid("nik")}
            aria-describedby="nik-hint"
          />
          <p {...getHintProps("nik")}>{getFieldHint({ field: "nik", errors, touched, values })}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="claimedNip">NIP</Label>
          <Input
            id="claimedNip"
            name="claimedNip"
            className="h-10"
            inputMode="numeric"
            placeholder="Jika ada"
            disabled={isPending}
            value={values.claimedNip}
            onChange={(event) => updateField("claimedNip", event.target.value.replace(/\D/g, "").slice(0, 32))}
            onBlur={() => markTouched("claimedNip")}
            aria-invalid={getAriaInvalid("claimedNip")}
            aria-describedby="claimedNip-hint"
          />
          <p {...getHintProps("claimedNip")}>{getFieldHint({ field: "claimedNip", errors, touched, values })}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
          <Input
            id="password"
            name="password"
            type="password"
            className="h-10"
            required
            minLength={8}
            disabled={isPending}
            autoComplete="new-password"
            value={values.password}
            onChange={(event) => updateField("password", event.target.value)}
            onBlur={() => markTouched("password")}
            aria-invalid={getAriaInvalid("password")}
            aria-describedby="password-hint"
          />
          <p {...getHintProps("password")}>{getFieldHint({ field: "password", errors, touched, values })}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Konfirmasi Password <span className="text-destructive">*</span></Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className="h-10"
            required
            minLength={8}
            disabled={isPending}
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(event) => updateField("confirmPassword", event.target.value)}
            onBlur={() => markTouched("confirmPassword")}
            aria-invalid={getAriaInvalid("confirmPassword")}
            aria-describedby="confirmPassword-hint"
          />
          <p {...getHintProps("confirmPassword")}>{getFieldHint({ field: "confirmPassword", errors, touched, values })}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Nomor HP <span className="text-destructive">*</span></Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            className="h-10"
            placeholder="08..."
            disabled={isPending}
            autoComplete="tel"
            value={values.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            onBlur={() => markTouched("phone")}
            aria-invalid={getAriaInvalid("phone")}
            aria-describedby="phone-hint"
          />
          <p {...getHintProps("phone")}>{getFieldHint({ field: "phone", errors, touched, values })}</p>
        </div>
      </div>
      <Button type="submit" className="h-10 w-full" disabled={isPending || !isValid}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Daftar
      </Button>
    </form>
  );
}
