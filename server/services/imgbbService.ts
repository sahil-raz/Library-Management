import { SystemConfig } from '../models/SystemConfig.js';

const IMGBB_CONFIG_KEY = 'imgbb_api_keys';

/**
 * Retrieves all configured ImgBB API keys from the database
 */
export async function getImgbbApiKeys(): Promise<string[]> {
  const config = await SystemConfig.findOne({ key: IMGBB_CONFIG_KEY });
  if (!config || !Array.isArray(config.value)) {
    return [];
  }
  return config.value.map((k) => String(k).trim()).filter(Boolean);
}

/**
 * Updates the complete list of ImgBB API keys
 */
export async function setImgbbApiKeys(keys: string[]): Promise<string[]> {
  const cleanKeys = Array.from(new Set(keys.map((k) => String(k).trim()).filter(Boolean)));
  await SystemConfig.findOneAndUpdate(
    { key: IMGBB_CONFIG_KEY },
    { key: IMGBB_CONFIG_KEY, value: cleanKeys },
    { upsert: true, new: true }
  );
  return cleanKeys;
}

/**
 * Adds a new ImgBB API key to the pool
 */
export async function addImgbbApiKey(key: string): Promise<string[]> {
  const cleanKey = String(key || '').trim();
  if (!cleanKey) {
    throw new Error('API key cannot be empty');
  }
  if (cleanKey.length < 16) {
    throw new Error('ImgBB API key is too short. Please provide a valid 32-character key from api.imgbb.com');
  }

  const current = await getImgbbApiKeys();
  if (!current.includes(cleanKey)) {
    current.push(cleanKey);
    await setImgbbApiKeys(current);
  }
  return current;
}

/**
 * Removes an ImgBB API key from the pool
 */
export async function removeImgbbApiKey(key: string): Promise<string[]> {
  const cleanKey = String(key || '').trim();
  const current = await getImgbbApiKeys();
  const updated = current.filter((k) => k !== cleanKey);
  await setImgbbApiKeys(updated);
  return updated;
}

/**
 * Shuffles an array randomly using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface ImgbbUploadResult {
  url: string;
  displayUrl: string;
  deleteUrl?: string;
  keyUsedMasked: string;
}

/**
 * Uploads an image buffer to ImgBB with random selection and automatic key failover
 */
export async function uploadToImgbb(
  fileBuffer: Buffer,
  fileName?: string
): Promise<ImgbbUploadResult> {
  const keys = await getImgbbApiKeys();

  if (keys.length === 0) {
    const error: any = new Error(
      'No ImgBB API key configured. The Super Admin must add at least one ImgBB API key in the Super Admin Settings panel.'
    );
    error.code = 'IMGBB_NOT_CONFIGURED';
    error.status = 400;
    throw error;
  }

  // Pick randomly by shuffling the key pool
  const randomizedKeys = shuffleArray(keys);
  let lastError: Error | null = null;
  const base64Data = fileBuffer.toString('base64');

  for (let i = 0; i < randomizedKeys.length; i++) {
    const key = randomizedKeys[i];
    const maskedKey = `••••${key.slice(-4)}`;

    try {
      const form = new URLSearchParams();
      form.append('image', base64Data);
      if (fileName) {
        form.append('name', fileName.replace(/\.[^/.]+$/, ''));
      }

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      });

      const data: any = await response.json().catch(() => null);

      if (response.ok && data?.success && data?.data) {
        return {
          url: data.data.url,
          displayUrl: data.data.display_url || data.data.url,
          deleteUrl: data.data.delete_url,
          keyUsedMasked: maskedKey,
        };
      }

      const errorMsg = data?.error?.message || `ImgBB rejected upload with status ${response.status}`;
      console.warn(
        `⚠️ [ImgBB] Key ${maskedKey} failed (attempt ${i + 1}/${randomizedKeys.length}): ${errorMsg}`
      );
      lastError = new Error(errorMsg);
    } catch (err: any) {
      console.warn(
        `⚠️ [ImgBB] Network failure using key ${maskedKey} (attempt ${i + 1}/${randomizedKeys.length}): ${err.message}`
      );
      lastError = err;
    }
  }

  throw (
    lastError ||
    new Error('Failed to upload image. All configured ImgBB API keys were exhausted or failed.')
  );
}

/**
 * Tests an ImgBB API key by uploading a 1x1 transparent test pixel
 */
export async function testImgbbApiKey(key: string): Promise<{ valid: boolean; message: string }> {
  const cleanKey = String(key || '').trim();
  if (!cleanKey) {
    return { valid: false, message: 'API key is required' };
  }

  try {
    // 1x1 transparent GIF base64
    const testPixel = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const form = new URLSearchParams();
    form.append('image', testPixel);
    form.append('name', 'test_ping');

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(cleanKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    const data: any = await res.json().catch(() => null);
    if (res.ok && data?.success) {
      return { valid: true, message: 'API Key is verified and working with ImgBB!' };
    }
    return {
      valid: false,
      message: data?.error?.message || `Validation failed (status: ${res.status})`,
    };
  } catch (err: any) {
    return { valid: false, message: `Connection error reaching ImgBB: ${err.message}` };
  }
}
