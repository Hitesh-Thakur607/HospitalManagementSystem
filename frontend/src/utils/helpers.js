export const getErrorMessage = (error) => {
  if (!error) return "Something went wrong";
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  return "Request failed";
};

export const escapeHtml = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
};
