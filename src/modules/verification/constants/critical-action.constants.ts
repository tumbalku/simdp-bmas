export function isConfirmationPhraseMatch(value: string, expectedPhrase: string) {
  return value.trim() === expectedPhrase.trim();
}
