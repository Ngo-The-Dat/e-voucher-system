import test from 'node:test';
import assert from 'node:assert';

test('Phone validation regex logic', async (t) => {
  // Admin personal phone validation: Vietnam mobile regex
  const personalPhoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

  const validPersonalPhones = [
    '0901234567',
    '0389998888',
    '0521234567',
    '0701234567',
    '0861234567',
    '+84901234567',
    '+84389998888',
  ];

  const invalidPersonalPhones = [
    '123',
    '0123456789', // đầu 01 cũ không còn là di động 10 số
    '090123456', // 9 số (thiếu)
    '09012345678', // 11 số (thừa)
    'abcdefghij',
    '090123456a',
  ];

  for (const phone of validPersonalPhones) {
    const clean = phone.trim().replace(/\s/g, '');
    assert.strictEqual(personalPhoneRegex.test(clean), true, `Should be valid: ${phone}`);
  }

  for (const phone of invalidPersonalPhones) {
    const clean = phone.trim().replace(/\s/g, '');
    assert.strictEqual(personalPhoneRegex.test(clean), false, `Should be invalid: ${phone}`);
  }

  // Branch phone validation: 8-15 chars, allowing digits, spaces, hyphens, plus
  const branchPhoneRegex = /^[0-9+]{8,15}$/;

  const validBranchPhones = [
    '02439349999',
    '02838221122',
    '0901234567',
    '19001234',
    '18006868',
    '024-3934-9999',
    '+842439349999',
  ];

  const invalidBranchPhones = [
    '123',
    '1234567', // 7 chars
    '1234567890123456', // 16 chars
    'branch-hotline',
    '024abc1234',
  ];

  for (const phone of validBranchPhones) {
    const clean = phone.trim().replace(/[\s-]/g, '');
    assert.strictEqual(branchPhoneRegex.test(clean), true, `Branch phone should be valid: ${phone}`);
  }

  for (const phone of invalidBranchPhones) {
    const clean = phone.trim().replace(/[\s-]/g, '');
    assert.strictEqual(branchPhoneRegex.test(clean), false, `Branch phone should be invalid: ${phone}`);
  }

  // CCCD/CMND validation: 9 digits (CMND) or 12 digits (CCCD)
  const identityNoRegex = /^([0-9]{9}|[0-9]{12})$/;

  const validIdentityNos = [
    '001099123456', // 12 digits
    '079201001234', // 12 digits
    '123456789',    // 9 digits
  ];

  const invalidIdentityNos = [
    '123',
    '12345678',     // 8 digits
    '1234567890',   // 10 digits
    '12345678901',  // 11 digits
    '1234567890123',// 13 digits
    '00109912345a', // contains letters
    'abcdefghi',    // 9 letters
  ];

  for (const idNo of validIdentityNos) {
    assert.strictEqual(identityNoRegex.test(idNo.trim()), true, `CCCD/CMND should be valid: ${idNo}`);
  }

  for (const idNo of invalidIdentityNos) {
    assert.strictEqual(identityNoRegex.test(idNo.trim()), false, `CCCD/CMND should be invalid: ${idNo}`);
  }
});
