// Future integration boundary: File Storage Provider Interface & Mock
// Handles private storage buckets and signed URLs for student documents, question assets, and study materials
export interface UploadUrlOptions {
  bucket: string;
  path: string;
  contentType: string;
  maxSizeBytes?: number;
  expiresInSeconds?: number;
}

export interface UploadUrlResult {
  uploadUrl: string;
  fileKey: string;
  expiresAt: Date;
  headers?: Record<string, string>;
}

export interface DownloadUrlOptions {
  bucket: string;
  path: string;
  expiresInSeconds?: number;
}

export interface FileStorageProvider {
  generateSignedUploadUrl(options: UploadUrlOptions): Promise<UploadUrlResult>;
  getSignedDownloadUrl(options: DownloadUrlOptions): Promise<string>;
  deleteFile(bucket: string, path: string): Promise<boolean>;
}

export class MockFileStorageProvider implements FileStorageProvider {
  async generateSignedUploadUrl(options: UploadUrlOptions): Promise<UploadUrlResult> {
    const expiresAt = new Date(Date.now() + (options.expiresInSeconds || 3600) * 1000);
    return {
      uploadUrl: `https://mock-storage.local/upload/${options.bucket}/${options.path}?token=mock_sig_${Date.now()}`,
      fileKey: `${options.bucket}/${options.path}`,
      expiresAt,
      headers: {
        "Content-Type": options.contentType,
      },
    };
  }

  async getSignedDownloadUrl(options: DownloadUrlOptions): Promise<string> {
    const expiry = Math.floor(Date.now() / 1000) + (options.expiresInSeconds || 3600);
    return `https://mock-storage.local/download/${options.bucket}/${options.path}?expires=${expiry}&sig=mock_token`;
  }

  async deleteFile(bucket: string, path: string): Promise<boolean> {
    return true;
  }
}

export const fileStorageProvider: FileStorageProvider = new MockFileStorageProvider();
