"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handlePrismaError = (err) => {
    var _a, _b, _c;
    let statusCode = 400;
    let message = 'Database Error';
    let errorSources = [];
    switch (err.code) {
        case 'P2002': {
            statusCode = 400;
            message = 'Duplicate Field Value Entered';
            const target = (_a = err.meta) === null || _a === void 0 ? void 0 : _a.target;
            const path = Array.isArray(target) ? target.join(', ') : target || 'field';
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
            const cause = ((_b = err.meta) === null || _b === void 0 ? void 0 : _b.cause) || 'Requested record was not found';
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
            const fieldName = ((_c = err.meta) === null || _c === void 0 ? void 0 : _c.field_name) || 'foreign key';
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
exports.default = handlePrismaError;
