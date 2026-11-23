import { DynamicDataMaskingService } from './dynamic-data-masking.service';

describe('DynamicDataMaskingService', () => {
  let masking: DynamicDataMaskingService;

  beforeEach(() => {
    masking = new DynamicDataMaskingService();
  });

  it('should mask PII email addresses', () => {
    const masked = masking.maskEmail('student.alex@university.edu');
    expect(masked).toBe('s***x@university.edu');
  });

  it('should encrypt and detokenize PII using AES-256-GCM', () => {
    const original = 'secret_student_name';
    const record = masking.tokenizeAndEncrypt(original);

    expect(record.tokenCiphertext).not.toContain(original);
    const decrypted = masking.detokenize(record);
    expect(decrypted).toBe(original);
  });
});
