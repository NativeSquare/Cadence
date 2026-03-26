import { ConvexError } from "convex/values";

export function getConvexErrorMessage(error: unknown) {
  if (error instanceof ConvexError) {
    return (error.data as { message: string }).message;
  }
  return "Unknown error occurred";
}
