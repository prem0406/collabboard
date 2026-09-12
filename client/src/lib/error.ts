export function getErrorMessage(err: any): string {
  const data = err?.response?.data?.error;
  if (typeof data === "string") return data;
  if (data?.fieldErrors) {
    const firstField = Object.values(data.fieldErrors).flat()[0];
    if (firstField) return String(firstField);
  }
  return "Something went wrong";
}
