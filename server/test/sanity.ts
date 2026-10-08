import assert from 'assert';
import { calculateExpiryDate } from '../services/subscriptionService.js';
import { buildWhatsAppLink, formatWhatsAppNumber } from '../services/reminderService.js';
import { renderWhatsAppMessage, WHATSAPP_TEMPLATES } from '../services/whatsappService.js';
import { getDateRange } from '../controllers/adminController.js';
import {
  loginSchema,
  planSchema,
  branchSchema,
  managerPermissionsSchema,
  createStudentSchema,
  adminRegisterSchema,
  batchSchema,
} from '../validators/index.js';

console.log('🧪 Starting Library Automated Sanity Tests...');

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

// 2. Test WhatsApp Link Generation & Template Rendering
console.log('👉 Testing WhatsApp Link Formatter & Templates...');
const formatted10Digit = formatWhatsAppNumber('9876543210');
assert.strictEqual(formatted10Digit, '919876543210');

const formattedWithCountry = formatWhatsAppNumber('+91 98765 43210');
assert.strictEqual(formattedWithCountry, '919876543210');

const waLink = buildWhatsAppLink('9876543210', 'Dear Rahul, your seat expires in 2 days.');
assert(waLink.startsWith('https://wa.me/919876543210?text='));
assert(waLink.includes('expires%20in%202%20days'));

const renderedMsg = renderWhatsAppMessage('EXPIRY_2_DAYS', {
  studentName: 'Rahul',
  libraryName: 'Apex Library',
  expiryDate: '10/10/2026',
  seatNumber: '04',
  batchName: 'Morning Batch',
});
assert(renderedMsg.includes('Rahul'));
assert(renderedMsg.includes('Apex Library'));
assert(renderedMsg.includes('Desk #04') || renderedMsg.includes('Seat #04'));

console.log('  ✅ WhatsApp link and template engine passed.');

// 3. Test Date Ranges for Dashboard Financials (Today, Yesterday, Month, Year, All-Time)
console.log('👉 Testing Financial Filter Date Ranges...');
const todayRange = getDateRange('today');
assert.strictEqual(todayRange.label, 'Today');

const monthRange = getDateRange('this_month');
assert.strictEqual(monthRange.label, 'This Month');

const allTimeRange = getDateRange('all_time');
assert.strictEqual(allTimeRange.label, 'All Time');
assert.strictEqual(allTimeRange.startDate.getTime(), 0);

console.log('  ✅ Financial date range filters passed.');

// 4. Test Student Creation Schema (No creds, required parent & batch & seat details)
console.log('👉 Testing Student Creation Schema...');
const validStudent = createStudentSchema.safeParse({
  name: 'Aman Verma',
  phone: '9876543210',
  parentName: 'Ramesh Verma',
  parentPhone: '9876543211',
  classCourse: 'UPSC Aspirant',
  gender: 'Male',
  branchId: '64d1234567890abcdef12345',
  batchId: '64d1234567890abcdef12346',
  seatId: '64d1234567890abcdef12347',
  planId: '64d1234567890abcdef12348',
});
assert.strictEqual(validStudent.success, true);

// Missing parent phone should fail
const invalidStudent = createStudentSchema.safeParse({
  name: 'Aman Verma',
  phone: '9876543210',
  parentName: 'Ramesh Verma',
  branchId: '64d1234567890abcdef12345',
});
assert.strictEqual(invalidStudent.success, false);

console.log('  ✅ Student validation schema passed.');

// 5. Test Admin Registration with WhatsApp OTP
console.log('👉 Testing Admin Registration with OTP Validation...');
const validAdmin = adminRegisterSchema.safeParse({
  name: 'Library Admin',
  email: 'admin@library.com',
  phone: '9876543210',
  whatsappNumber: '9876543210',
  password: 'password123',
  confirmPassword: 'password123',
  organizationName: 'City Library',
  otp: '123456',
});
assert.strictEqual(validAdmin.success, true);

console.log('  ✅ Admin registration with WhatsApp OTP schema passed.');

// 6. Test Batch Schema
console.log('👉 Testing Batch Timing Schema...');
const validBatch = batchSchema.safeParse({
  name: 'Morning Batch',
  startTime: '08:00 AM',
  endTime: '01:00 PM',
});
assert.strictEqual(validBatch.success, true);
console.log('  ✅ Batch timing schema passed.');

console.log('\n🎉 ALL SANITY TESTS PASSED SUCCESSFULLY! 🚀\n');
