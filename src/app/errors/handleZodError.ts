import { ZodError, ZodIssue } from 'zod';

export type TErrorSource = {
  path: string | number;
  message: string;
};

export type TGenericErrorResponse = {
  statusCode: number;
  message: string;
  errorSources: TErrorSource[];
};

const handleZodError = (err: ZodError): TGenericErrorResponse => {
  const errorSources: TErrorSource[] = err.issues.map((issue: ZodIssue) => {
    const rawPath = issue.path[issue.path.length - 1];
    return {
      path: rawPath !== undefined ? String(rawPath) : '',
      message: issue.message,
    };
  });

  const statusCode = 400;

  return {
    statusCode,
    message: 'Validation Error',
    errorSources,
  };
};

export default handleZodError;
