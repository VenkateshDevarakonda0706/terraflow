import { Injectable, Logger, BadRequestException, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import exifr from 'exifr';
import * as fs from 'fs';
import * as path from 'path';
import { ALLOWED_MIME_TYPES } from '@terraflow/shared';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private gcsStorage?: Storage;
  private bucketName?: string;
  private localUploadsDir = path.join(process.cwd(), 'public', 'uploads');

  private getPublicApiOrigin(): string {
    return (
      process.env.API_PUBLIC_URL ||
      process.env.SERVER_URL ||
      `http://localhost:${process.env.PORT || 4000}`
    ).replace(/\/$/, '');
  }

  onModuleInit() {
    const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    this.bucketName = process.env.GCS_BUCKET_NAME || 'terraflow-memories-bucket';

    // Verify if environment variables are placeholders or stubs
    const hasCreds = credsPath && fs.existsSync(credsPath);

    if (hasCreds) {
      try {
        this.gcsStorage = new Storage({ keyFilename: credsPath });
        this.logger.log(`☁️  [Terraflow GCS]: Google Cloud Storage engine initialized on bucket: ${this.bucketName}`);
      } catch (err) {
        this.logger.warn('⚠️  [Terraflow Storage Warning]: GCS failed initialization. Falling back to local storage.', err);
      }
    } else {
      this.logger.log('ℹ️  [Terraflow Storage]: GOOGLE_APPLICATION_CREDENTIALS not found or invalid. Using Local Filesystem Engine.');
      
      // Ensure local uploads directory exists
      if (!fs.existsSync(this.localUploadsDir)) {
        fs.mkdirSync(this.localUploadsDir, { recursive: true });
      }
    }
  }

  async uploadFile(file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<string> {
    // Validate File Types
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      throw new BadRequestException('Unsupported file format. Please upload JPEG, PNG, WEBP images, or MP4 videos only.');
    }

    // Validate size boundaries (10MB images, 50MB videos)
    const isVideo = file.mimetype.startsWith('video');
    const limit = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.buffer.length > limit) {
      if (isVideo) {
        throw new BadRequestException('Video size exceeds the limit of 50MB.');
      } else {
        throw new BadRequestException('Image size exceeds the limit of 10MB.');
      }
    }

    const fileExt = path.extname(file.originalname);
    const uniqueFilename = `${Date.now()}-${Math.floor(Math.random() * 10000)}${fileExt}`;

    // 1. Google Cloud Storage engine upload
    if (this.gcsStorage && this.bucketName) {
      try {
        const bucket = this.gcsStorage.bucket(this.bucketName);
        const blob = bucket.file(uniqueFilename);
        
        await blob.save(file.buffer, {
          contentType: file.mimetype,
          resumable: false,
        });

        return `https://storage.googleapis.com/${this.bucketName}/${uniqueFilename}`;
      } catch (err) {
        this.logger.error('GCS Upload Error, trying local fallback...', err);
      }
    }

    // 2. Local Filesystem fallback
    try {
      const destPath = path.join(this.localUploadsDir, uniqueFilename);
      fs.writeFileSync(destPath, file.buffer);
      
      return `${this.getPublicApiOrigin()}/uploads/${uniqueFilename}`;
    } catch (err) {
      throw new InternalServerErrorException('Failed to write media binary to local disk.');
    }
  }

  async extractExifGPS(buffer: Buffer): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const gps = await exifr.gps(buffer);
      if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
        const { latitude, longitude } = gps;
        if (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
          return { latitude, longitude };
        }
      }
      return null;
    } catch (err) {
      this.logger.warn('Failed parsing EXIF meta tags.', err);
      return null;
    }
  }
}
