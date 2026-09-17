type UploadActionStateInput = {
  documentType?: unknown;
  allowMultiple: boolean;
  documents: readonly unknown[];
};

export function getDocumentTypeUploadActionState(group: UploadActionStateInput) {
  return {
    isDisabled: !group.documentType || (!group.allowMultiple && group.documents.length > 0),
  };
}
