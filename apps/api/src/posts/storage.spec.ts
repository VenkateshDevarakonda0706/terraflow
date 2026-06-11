import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { StorageService } from './storage.service.js';
import exifr from 'exifr';
import * as fs from 'fs';
import { writeFileSync } from 'fs';

vi.mock('exifr', () => ({
  default: {
    gps: vi.fn(),
  },
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    writeFileSync: vi.fn(),
  };
});

describe('StorageService EXIF GPS Extraction', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new StorageService();
    vi.clearAllMocks();
  });

  it('should successfully extract GPS coordinates when valid GPS metadata is present', async () => {
    const mockGps = { latitude: 48.8584, longitude: 2.2945 };
    (exifr.gps as Mock).mockResolvedValue(mockGps);

    const buffer = Buffer.from('mock-image-data-with-exif');
    const result = await storageService.extractExifGPS(buffer);

    expect(result).toEqual({ latitude: 48.8584, longitude: 2.2945 });
    expect(exifr.gps).toHaveBeenCalledWith(buffer);
  });

  it('should return null when GPS metadata is missing', async () => {
    (exifr.gps as Mock).mockResolvedValue(undefined);

    const buffer = Buffer.from('mock-image-data-without-gps');
    const result = await storageService.extractExifGPS(buffer);

    expect(result).toBeNull();
    expect(exifr.gps).toHaveBeenCalledWith(buffer);
  });

  it('should return null and handle errors gracefully when exifr throws an error', async () => {
    (exifr.gps as Mock).mockRejectedValue(new Error('Malformed EXIF data'));

    const buffer = Buffer.from('corrupted-image-data');
    const result = await storageService.extractExifGPS(buffer);

    expect(result).toBeNull();
    expect(exifr.gps).toHaveBeenCalledWith(buffer);
  });

  it('should return null for out-of-range GPS coordinates', async () => {
    (exifr.gps as Mock).mockResolvedValue({ latitude: 999, longitude: 999 });

    const buffer = Buffer.from('mock-image-data-invalid-gps');
    const result = await storageService.extractExifGPS(buffer);

    expect(result).toBeNull();
    expect(exifr.gps).toHaveBeenCalledWith(buffer);
  });
});

describe('StorageService File Upload Validation', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new StorageService();
    storageService.onModuleInit();
    vi.mocked(writeFileSync).mockClear();
  });

  it('should reject unsupported MIME type', async () => {
    const file = {
      buffer: Buffer.from('mock-data'),
      originalname: 'test.gif',
      mimetype: 'image/gif',
    };
    await expect(storageService.uploadFile(file)).rejects.toThrowError(
      'Unsupported file format. Please upload JPEG, PNG, WEBP images, or MP4 videos only.'
    );
  });

  it('should reject image larger than 10MB', async () => {
    const largeBuffer = Buffer.alloc(10 * 1024 * 1024 + 1);
    const file = {
      buffer: largeBuffer,
      originalname: 'large-image.png',
      mimetype: 'image/png',
    };
    await expect(storageService.uploadFile(file)).rejects.toThrowError(
      'Image size exceeds the limit of 10MB.'
    );
  });

  it('should reject video larger than 50MB', async () => {
    const largeBuffer = Buffer.alloc(50 * 1024 * 1024 + 1);
    const file = {
      buffer: largeBuffer,
      originalname: 'large-video.mp4',
      mimetype: 'video/mp4',
    };
    await expect(storageService.uploadFile(file)).rejects.toThrowError(
      'Video size exceeds the limit of 50MB.'
    );
  });

  it('should successfully upload valid image within limits (local fallback)', async () => {
    const file = {
      buffer: Buffer.from('valid-image-data'),
      originalname: 'valid.png',
      mimetype: 'image/png',
    };

    const url = await storageService.uploadFile(file);
    // Uploaded files are served from the public /uploads route.
    expect(url).toContain('/uploads/');
    expect(writeFileSync).toHaveBeenCalled();
  });
});
