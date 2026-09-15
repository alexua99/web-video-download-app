import { YtDlpError } from "@/lib/errors";

export function isServerlessHost() {
  if (process.env.RAILWAY_ENVIRONMENT) return false;

  return Boolean(
    process.env.NETLIFY ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT,
  );
}

export function assertDownloadHost() {
  if (isServerlessHost()) {
    throw new YtDlpError("hosting_unsupported");
  }
}
