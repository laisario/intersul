import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private endpoint: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    const endpoint = this.configService.get<string>('ENDPOINT_FOR_S3_CLIENTS');
    const publicUrl = this.configService.get<string>('R2_PUBLIC_URL');
    const bucketName = 'intersul';

    if (!accessKeyId || !secretAccessKey || !endpoint) {
      throw new Error('R2 credentials are not configured. Please set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and ENDPOINT_FOR_S3_CLIENTS in your .env file');
    }

    this.bucketName = bucketName;
    this.endpoint = endpoint;
    
    // Use public URL if provided, otherwise fallback to endpoint (may not work for public access)
    // R2_PUBLIC_URL should be in format: https://pub-<account-id>.r2.dev
    this.publicUrl = publicUrl;

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });
  }

  /**
   * Upload a file to R2 storage
   * @param file Buffer or file data
   * @param fileName Name of the file (will be prefixed with folder path)
   * @param folder Folder path in the bucket (e.g., 'steps', 'copy-machines')
   * @param contentType MIME type of the file
   * @returns Public URL of the uploaded file
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    folder: string,
    contentType: string,
  ): Promise<string> {
    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
      // Make the file publicly accessible
      // Note: You may need to configure bucket public access in Cloudflare R2
    });

    await this.s3Client.send(command);

    // Construct the public URL using the R2 public domain
    // R2_PUBLIC_URL format: https://pub-<account-id>.r2.dev
    // Final URL format: https://pub-<account-id>.r2.dev/<bucket-name>/<key>
    const baseUrl = this.publicUrl.replace(/\/$/, '');
    const fileUrl = `${baseUrl}/${this.bucketName}/${key}`;
    
    return fileUrl;
  }

  /**
   * Delete a file from R2 storage
   * @param filePath Path of the file in the bucket (e.g., 'steps/filename.jpg')
   */
  async deleteFile(filePath: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: filePath,
    });

    await this.s3Client.send(command);
  }

  /**
   * Extract the key (path) from a full R2 URL
   * @param url Full URL of the file
   * @returns Key path in the bucket
   */
  extractKeyFromUrl(url: string): string | null {
    try {
      // Remove the endpoint and bucket name from the URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      // Find the bucket name index and get everything after it
      const bucketIndex = pathParts.indexOf(this.bucketName);
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }
      
      // Fallback: try to extract from pathname directly
      if (pathParts.length >= 2) {
        return pathParts.slice(1).join('/');
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
}
