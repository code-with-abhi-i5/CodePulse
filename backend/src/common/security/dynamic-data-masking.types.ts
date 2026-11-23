export interface MaskingConfig {
  aesKeyHex?: string;
}

export interface MaskedRecord {
  plaintextMasked: string;
  tokenCiphertext: string;
  ivHex: string;
}
