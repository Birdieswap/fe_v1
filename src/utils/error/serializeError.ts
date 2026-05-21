export type SerializedError = {
  name?: string;
  message?: string;
  shortMessage?: string;
  details?: string;
  cause?: unknown;
  stack?: string;
  status?: number;
  code?: string | number;
  rawType?: string;
  rawString?: string;
  ownProps?: Record<string, unknown>;
};

export function serializeError(error: unknown): SerializedError {
  if (!error) {
    return {
      message: String(error),
      rawType: typeof error,
      rawString: String(error),
    };
  }

  if (error instanceof Error) {
    const anyError = error as Error & Record<string, unknown>;
    const ownProps: Record<string, unknown> = {};
    for (const key of Object.getOwnPropertyNames(error)) {
      ownProps[key] = anyError[key];
    }
    return {
      name: error.name,
      message: error.message,
      shortMessage:
        typeof anyError.shortMessage === "string"
          ? anyError.shortMessage
          : undefined,
      details:
        typeof anyError.details === "string" ? anyError.details : undefined,
      cause: anyError.cause,
      stack: error.stack,
      status:
        typeof anyError.status === "number" ? anyError.status : undefined,
      code:
        typeof anyError.code === "string" || typeof anyError.code === "number"
          ? anyError.code
          : undefined,
      rawType: typeof error,
      rawString: String(error),
      ownProps,
    };
  }

  if (typeof error === "object") {
    try {
      const ownProps: Record<string, unknown> = {};
      for (const key of Object.getOwnPropertyNames(error)) {
        ownProps[key] = (error as Record<string, unknown>)[key];
      }
      const json = JSON.parse(JSON.stringify(error));
      return {
        ...(typeof json === "object" && json ? json : {}),
        rawType: typeof error,
        rawString: String(error),
        ownProps,
      };
    } catch {
      return {
        message: String(error),
        rawType: typeof error,
        rawString: String(error),
      };
    }
  }

  return {
    message: String(error),
    rawType: typeof error,
    rawString: String(error),
  };
}

export function isRateLimitError(error: unknown): boolean {
  const text = JSON.stringify(serializeError(error)).toLowerCase();
  return (
    text.includes("429") ||
    text.includes("rate limit") ||
    text.includes("over rate limit")
  );
}

export function stringifyForLog(value: unknown): string {
  try {
    return JSON.stringify(
      value,
      (_key, currentValue) =>
        typeof currentValue === "bigint"
          ? currentValue.toString()
          : currentValue,
      2,
    );
  } catch {
    return String(value);
  }
}
