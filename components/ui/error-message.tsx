import React from "react";
import type { FieldError } from "react-hook-form";

interface ErrorMessageProps {
  error?: FieldError | { message?: string } | undefined | null; // Accept FieldError or a simple object with message
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  if (!error || !error.message) {
    return null;
  }

  return <p className="text-xs text-red-500 mt-1">{error.message}</p>;
}
