"use client";

import { useRef, useState, useTransition } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadDocumentAction } from "@/modules/document/actions";

type DocumentTypeOption = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isMandatory: boolean;
  allowedFormats: string;
  maxSizeMb: number;
  requiresDocumentNumber: boolean;
  requiresIssueDate: boolean;
  requiresExpiryDate: boolean;
};

type DocumentUploadFormProps = {
  documentTypes: DocumentTypeOption[];
};

export function DocumentUploadForm({ documentTypes }: DocumentUploadFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [documentTypeId, setDocumentTypeId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await uploadDocumentAction(formData);
      if (!result.ok) {
        setMessage(result.error.message);
        return;
      }

      formRef.current?.reset();
      setDocumentTypeId("");
      setMessage("Dokumen berhasil diunggah dan menunggu verifikasi.");
    });
  }

  return (
    <Card className="border-dashed bg-muted/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <UploadCloud className="size-5" />
          </div>
          <div>
            <CardTitle>Unggah dokumen</CardTitle>
            <CardDescription>Pilih jenis dokumen, isi metadata, lalu unggah file yang valid.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="documentTypeId">Jenis dokumen</Label>
            <Select
              id="documentTypeId"
              name="documentTypeId"
              value={documentTypeId}
              onValueChange={(value) => setDocumentTypeId(value ?? "")}
              required
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Pilih jenis dokumen" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} · {type.allowedFormats.toUpperCase()} · maks {type.maxSizeMb}MB
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input id="title" name="title" placeholder="Contoh: KTP terbaru" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="documentNumber">Nomor dokumen</Label>
            <Input id="documentNumber" name="documentNumber" placeholder="Opsional" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issueDate">Tanggal terbit</Label>
            <Input id="issueDate" name="issueDate" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Tanggal kedaluwarsa</Label>
            <Input id="expiryDate" name="expiryDate" type="date" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="file">File</Label>
            <Input id="file" name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png" />
          </div>

          {message ? <p className="text-sm text-muted-foreground md:col-span-2">{message}</p> : null}

          <div className="md:col-span-2">
            <Button type="submit" disabled={isPending || documentTypes.length === 0}>
              {isPending ? "Mengunggah..." : "Unggah"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
