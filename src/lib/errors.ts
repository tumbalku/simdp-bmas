export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public details?: Array<{ path: string; message: string }>
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
