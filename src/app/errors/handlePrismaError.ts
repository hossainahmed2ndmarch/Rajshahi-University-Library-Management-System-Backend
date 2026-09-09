import { Prisma } from '@prisma/client';
import { TErrorSource, TGenericErrorResponse } from './handleZodError';

const handlePrismaError = (
  err: Prisma.PrismaClientKnownRequestError
): TGenericErrorResponse => {
  let statusCode = 400;
  let message = 'Database Error';
  let errorSources: TErrorSource[] = [];

  switch (err.code) {
    case 'P2002': {
      statusCode = 400;
      message = 'Duplicate Field Value Entered';
      const target = err.meta?.target;
      const path = Array.isArray(target) ? target.join(', ') : (target as string) || 'field';
      errorSources = [
        {
          path,
          message: `${path} already exists`,
        },
      ];
      break;
    }
    case 'P2025': {
      statusCode = 404;
      message = 'Record Not Found';
      const cause = (err.meta?.cause as string) || 'Requested record was not found';
      errorSources = [
        {
          path: '',
          message: cause,
        },
      ];
      break;
    }
    case 'P2003': {
      statusCode = 400;
      message = 'Foreign Key Constraint Failed';
      const fieldName = (err.meta?.field_name as string) || 'foreign key';
      errorSources = [
        {
          path: fieldName,
          message: `Invalid reference on ${fieldName}`,
        },
      ];
      break;
    }
    case 'P2000': {
      statusCode = 400;
      message = 'Value Too Long';
      errorSources = [
        {
          path: '',
          message: 'The provided value is too long for the column type',
        },
      ];
      break;
    }
    default: {
      statusCode = 400;
      message = err.message || 'Database Operation Failed';
      errorSources = [
        {
          path: '',
          message: err.message,
        },
      ];
      break;
    }
  }

  return {
    statusCode,
    message,
    errorSources,
  };
};

export default handlePrismaError;
