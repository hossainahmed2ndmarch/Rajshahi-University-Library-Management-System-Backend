import { Request, Response } from 'express';

const notFound = (req: Request, res: Response): void => {
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

export default notFound;
