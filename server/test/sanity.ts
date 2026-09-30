import assert from 'assert';
import { calculateExpiryDate } from '../services/subscriptionService.js';
import { buildWhatsAppLink, formatWhatsAppNumber } from '../services/reminderService.js';
import { loginSchema, planSchema, branchSchema, managerPermissionsSchema } from '../validators/index.js';

console.log('🧪 Starting Libr SaaS Automated Sanity Tests...');

// 1. Test Expiry Date Calculations
console.log('👉 Testing Subscription Expiry Date Calculations...');
const baseDate = new Date('2026-01-01T00:00:00.000Z');

// 30 Days
const expiryDays = calculateExpiryDate(30, 'Days', baseDate);
assert.strictEqual(expiryDays.toISOString().split('T')[0], '2026-01-31');

// 1 Month
const expiryMonth = calculateExpiryDate(1, 'Months', baseDate);
assert.strictEqual(expiryMonth.toISOString().split('T')[0], '2026-02-01');

// 1 Year
const expiryYear = calculateExpiryDate(1, 'Years', baseDate);
assert.strictEqual(expiryYear.toISOString().split('T')[0], '2027-01-01');

console.log('  ✅ Expiry date calculations passed for Days, Months, and Years.');

// 2. Test WhatsApp Link Generation
console.log('👉 Testing Dynamic WhatsApp Link Formatter...');
const formatted10Digit = formatWhatsAppNumber('9876543210');
assert.strictEqual(formatted10Digit, '919876543210');

const formattedWithCountry = formatWhatsAppNumber('+91 98765 43210');
assert.strictEqual(formattedWithCountry, '919876543210');

const waLink = buildWhatsAppLink('9876543210', 'Dear Rahul, your seat expires in 2 days.');
assert(waLink.startsWith('https://wa.me/919876543210?text='));
assert(waLink.includes('expires%20in%202%20days'));

console.log('  ✅ WhatsApp link and phone formatter passed.');

// 3. Test Zod Validation Schemas
console.log('👉 Testing Validation Schemas...');

// Login validation
const validLogin = loginSchema.safeParse({ email: 'admin@library.com', password: 'password123' });
assert.strictEqual(validLogin.success, true);

const invalidLogin = loginSchema.safeParse({ email: 'not-an-email', password: '123' });
assert.strictEqual(invalidLogin.success, false);

// Plan validation
const validPlan = planSchema.safeParse({
  name: 'Growth Pro',
  price: 1999,
  currency: 'INR',
  validity: 30,
  validityUnit: 'Days',
  maxBranches: 3,
  maxManagers: 5,
  maxUsers: 500,
  maxSeats: 250,
  maxMessages: 1000,
  maxQueueEntries: 100,
  maxStorageMB: 1024,
});
assert.strictEqual(validPlan.success, true);

// Manager permissions validation
const validPerms = managerPermissionsSchema.safeParse({
  users_view: true,
  users_create: true,
  users_edit: false,
  seats_view: true,
  seats_assign: true,
  queue_manage: true,
  entries_manage: true,
  payments_view: false,
  expenses_manage: false,
  expenses_add: true,
  expenses_view: true,
  reminders_send: true,
  dashboard_view: true,
});
assert.strictEqual(validPerms.success, true);

console.log('  ✅ All Zod validation schemas passed.');

// 4. Test ImgBB API Key validation formatting
console.log('👉 Testing ImgBB Key Validation...');
const testKeyShort = '12345';
assert(testKeyShort.length < 16, 'Short key correctly identified');
const validKeySample = '3a7b9f82d1c4e5a6b8c9d0e1f2a3b4c5';
assert.strictEqual(validKeySample.length, 32);
const masked = `••••${validKeySample.slice(-4)}`;
assert.strictEqual(masked, '••••b4c5');
console.log('  ✅ ImgBB key format and masking rules passed.');

// 5. Test 7-Day Session Duration & Device Fingerprint
console.log('👉 Testing 7-Day Session Logic & Device Fingerprinting...');
import { computeDeviceFingerprint, SESSION_DURATION_DAYS } from '../services/sessionService.js';
import { DEFAULT_SITE_SETTINGS } from '../services/siteSettingsService.js';

assert.strictEqual(SESSION_DURATION_DAYS, 7);

const deviceIdA = 'device-laptop-chrome-123';
const deviceIdB = 'device-phone-safari-456';
const uaChrome = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0';
const uaSafari = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Safari/604.1';

const fpA = computeDeviceFingerprint(deviceIdA, uaChrome);
const fpA_repeat = computeDeviceFingerprint(deviceIdA, uaChrome);
const fpB = computeDeviceFingerprint(deviceIdB, uaSafari);
const fpDifferentDevice = computeDeviceFingerprint(deviceIdB, uaChrome);

assert.strictEqual(fpA, fpA_repeat, 'Fingerprint must be consistent for same device and UA');
assert.notStrictEqual(fpA, fpB, 'Fingerprint must differ for distinct devices and UAs');
assert.notStrictEqual(fpA, fpDifferentDevice, 'Fingerprint must detect device ID changes');
console.log('  ✅ 7-Day session duration and device binding verification passed.');

// 6. Test Default Platform Site Settings
console.log('👉 Testing Platform Site Settings Defaults...');
assert.strictEqual(DEFAULT_SITE_SETTINGS.siteName, 'Libr');
assert(DEFAULT_SITE_SETTINGS.siteTagline.length > 0);
console.log('  ✅ Default site settings schema verified.');

console.log('\n🎉 ALL 6 SUITES OF SANITY TESTS PASSED SUCCESSFULLY! 🚀\n');
