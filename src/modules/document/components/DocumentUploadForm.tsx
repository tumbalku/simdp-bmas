"use client";

import { DragEvent, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
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
import { replaceDocumentFileAction, uploadDocumentAction } from "@/modules/document";
import type { DocumentTypeOption } from "@/modules/document";

type DocumentUploadInitialValues = {
  title?: string | null;
  documentNumber?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
};

type DocumentUploadFormProps = {
  documentTypes: DocumentTypeOption[];
  initialDocumentTypeId?: string;
  initialValues?: DocumentUploadInitialValues;
  lockDocumentType?: boolean;
  submitLabel?: string;
  onSuccess?: () => void;
  compact?: boolean;
  replaceDocumentId?: string;
};

function formatDateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function getAcceptedFormats(documentType?: DocumentTypeOption) {
  const formats = documentType?.allowedFormats || "pdf,jpg,jpeg,png";
  return formats
    .split(",")
    .map((format) => format.trim().toLowerCase())
    .filter(Boolean)
    .map((format) => `.${format}`)
    .join(",");
}

export function DocumentUploadForm({
  documentTypes,
  initialDocumentTypeId = "",
  initialValues,
  lockDocumentType = false,
  submitLabel = "Unggah",
  onSuccess,
  compact = false,
  replaceDocumentId,
}: DocumentUploadFormProps) {
  const fileInputId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentTypeId, setDocumentTypeId] = useState(initialDocumentTypeId);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [documentNumber, setDocumentNumber] = useState(initialValues?.documentNumber ?? "");
  const [issueDate, setIssueDate] = useState(formatDateInput(initialValues?.issueDate));
  const [expiryDate, setExpiryDate] = useState(formatDateInput(initialValues?.expiryDate));
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setTitle(initialValues?.title ?? "");
    setDocumentNumber(initialValues?.documentNumber ?? "");
    setIssueDate(formatDateInput(initialValues?.issueDate));
    setExpiryDate(formatDateInput(initialValues?.expiryDate));
  }, [initialValues?.documentNumber, initialValues?.expiryDate, initialValues?.issueDate, initialValues?.title]);

  const selectedDocumentType = useMemo(
    () => documentTypes.find((type) => type.id === documentTypeId),
    [documentTypeId, documentTypes],
  );

  function handleFileList(files: FileList | null) {
    const file = files?.[0];
    setSelectedFileName(file?.name ?? null);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file || !fileInputRef.current) return;

    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileInputRef.current.files = transfer.files;
    handleFileList(transfer.files);
  }

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      if (replaceDocumentId) {
        formData.set("documentId", replaceDocumentId);
      }

      const result = replaceDocumentId
        ? await replaceDocumentFileAction(formData)
        : await uploadDocumentAction(formData);
      if (!result.ok) {
        setMessage(result.error.message);
        return;
      }

      formRef.current?.reset();
      setSelectedFileName(null);
      setTitle(initialValues?.title ?? "");
      setDocumentNumber(initialValues?.documentNumber ?? "");
      setIssueDate(formatDateInput(initialValues?.issueDate));
      setExpiryDate(formatDateInput(initialValues?.expiryDate));
      setDocumentTypeId(lockDocumentType ? initialDocumentTypeId : "");
      setMessage(
        replaceDocumentId
          ? "File dokumen berhasil diganti dan menunggu verifikasi ulang."
          : "Dokumen berhasil diunggah dan menunggu verifikasi.",
      );
      onSuccess?.();
    });
  }

  const shouldShowDocumentNumber = selectedDocumentType?.requiresDocumentNumber === true;
  const shouldShowIssueDate = selectedDocumentType?.requiresIssueDate === true;
  const shouldShowExpiryDate = selectedDocumentType?.requiresExpiryDate === true;
  const acceptedFormats = getAcceptedFormats(selectedDocumentType);

  const formContent = (
    <form ref={formRef} action={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="documentTypeId">Jenis dokumen</Label>
        {lockDocumentType ? (
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
            <input type="hidden" name="documentTypeId" value={documentTypeId} />
            <div className="font-medium">{selectedDocumentType?.name ?? "Jenis dokumen"}</div>
            <div className="text-xs text-muted-foreground">
              {selectedDocumentType
                ? `${selectedDocumentType.allowedFormats.toUpperCase()} · maks ${selectedDocumentType.maxSizeMb}MB`
                : "Ikuti aturan jenis dokumen yang dipilih."}
            </div>
          </div>
        ) : (
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
        )}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="title">Judul</Label>
        <Input
          id="title"
          name="title"
          placeholder="Contoh: KTP terbaru"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      {shouldShowDocumentNumber ? (
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="documentNumber">Nomor surat / dokumen</Label>
          <Input
            id="documentNumber"
            name="documentNumber"
            placeholder="Masukkan nomor dokumen"
            value={documentNumber}
            onChange={(event) => setDocumentNumber(event.target.value)}
            required
          />
        </div>
      ) : null}

      {shouldShowIssueDate ? (
        <div className="space-y-2">
          <Label htmlFor="issueDate">Tanggal terbit</Label>
          <Input
            id="issueDate"
            name="issueDate"
            type="date"
            value={issueDate}
            onChange={(event) => setIssueDate(event.target.value)}
            required
          />
        </div>
      ) : null}

      {shouldShowExpiryDate ? (
        <div className="space-y-2">
          <Label htmlFor="expiryDate">Tanggal kedaluwarsa</Label>
          <Input
            id="expiryDate"
            name="expiryDate"
            type="date"
            value={expiryDate}
            onChange={(event) => setExpiryDate(event.target.value)}
            required
          />
        </div>
      ) : null}

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={fileInputId}>File</Label>
        <label
          htmlFor={fileInputId}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:bg-muted/40"
          }`}
        >
          <UploadCloud className="mb-2 size-6 text-primary" />
          <span className="text-sm font-medium">
            {selectedFileName ?? "Klik untuk browse atau tarik file ke sini"}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            {selectedDocumentType
              ? `${selectedDocumentType.allowedFormats.toUpperCase()} · maksimal ${selectedDocumentType.maxSizeMb}MB`
              : "PDF, JPG, JPEG, atau PNG"}
          </span>
        </label>
        <Input
          ref={fileInputRef}
          id={fileInputId}
          name="file"
          type="file"
          required
          accept={acceptedFormats}
          className="sr-only"
          onChange={(event) => handleFileList(event.target.files)}
        />
      </div>

      {message ? <p className="text-sm text-muted-foreground md:col-span-2">{message}</p> : null}

      <div className="flex justify-end md:col-span-2">
        <Button type="submit" disabled={isPending || documentTypes.length === 0 || !documentTypeId || !selectedFileName}>
          {isPending ? "Mengunggah..." : submitLabel}
        </Button>
      </div>
    </form>
  );

  if (compact) {
    return formContent;
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
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
