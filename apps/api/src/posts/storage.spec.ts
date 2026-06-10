import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { StorageService } from './storage.service.js';
import exifr from 'exifr';

vi.mock('exifr', () => ({
  default: {
    gps: vi.fn(),
  },
}));

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
