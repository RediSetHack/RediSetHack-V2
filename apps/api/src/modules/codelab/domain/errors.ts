export class UnsupportedLanguageError extends Error {
  constructor(language: string) {
    super(`Unsupported language: ${language}`);
    this.name = "UnsupportedLanguageError";
  }
}
