import { ConvexError } from "convex/values";

export function getConvexErrorMessage(error: unknown): string {
  if (error instanceof ConvexError) {
    const data = error.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object" && "message" in data) {
      return (data as { message: string }).message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "An unexpected error occurred";
}
