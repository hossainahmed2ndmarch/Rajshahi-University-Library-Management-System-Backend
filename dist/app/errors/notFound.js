"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API Route Not Found!',
        errorSources: [
            {
                path: req.originalUrl,
                message: 'API Route Not Found!',
            },
        ],
    });
};
exports.default = notFound;
