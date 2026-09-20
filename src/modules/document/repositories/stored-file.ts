type StoredFileMetadata = {
  fileName: string;
  filePath: string;
  fileSize: bigint;
  mimeType: string;
  fileHash: string;
  storageProvider: "LOCAL" | "SUPABASE" | "S3";
};

export function withStoredFileMetadata<T extends { storedFile?: StoredFileMetadata }>(record: T) {
  if (!record.storedFile) return record as T & StoredFileMetadata;

  return {
    ...record,
    fileName: record.storedFile.fileName,
    filePath: record.storedFile.filePath,
    fileSize: record.storedFile.fileSize,
    mimeType: record.storedFile.mimeType,
    fileHash: record.storedFile.fileHash,
    storageProvider: record.storedFile.storageProvider,
  } as T & StoredFileMetadata;
}
