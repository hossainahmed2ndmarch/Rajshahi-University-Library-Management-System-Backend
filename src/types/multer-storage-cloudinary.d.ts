// Type stubs for multer-storage-cloudinary (no @types package exists)
declare module 'multer-storage-cloudinary' {
  import { StorageEngine } from 'multer';

  interface CloudinaryStorageOptions {
    cloudinary: any;
    params?:
      | Record<string, unknown>
      | ((
          req: Express.Request,
          file: Express.Multer.File
        ) => Promise<Record<string, unknown>> | Record<string, unknown>);
    filename?: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => void;
    folder?: string;
    transformation?: any;
    format?: string;
    allowedFormats?: string[];
  }

  function cloudinaryStorage(opts: CloudinaryStorageOptions): StorageEngine;

  export = cloudinaryStorage;
}
