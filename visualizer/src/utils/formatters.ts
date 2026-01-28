// Converts algorithm names to display format (e.g., MlKem → ML-KEM, Aes → AES)
export function formatAlgorithmName(name: string): string {
  const specialCases: Record<string, string> = {
    'MlKem': 'ML-KEM',
    'MlDsa': 'ML-DSA',
    'SlhDsa': 'SLH-DSA',
    'Pbkdf2': 'PBKDF2',
    'Aes': 'AES',
    'Sm4': 'SM4',
    'Des': 'DES',
    'TripleDes': '3DES',
    'Rsa': 'RSA',
    'Ecdsa': 'ECDSA',
    'Ecdh': 'ECDH',
    'Sha256': 'SHA-256',
    'Sha384': 'SHA-384',
    'Sha512': 'SHA-512',
    'Sha3': 'SHA-3',
    'Hmac': 'HMAC',
  };

  if (specialCases[name]) {
    return specialCases[name];
  }

  for (const [key, value] of Object.entries(specialCases)) {
    if (name.startsWith(key)) {
      const suffix = name.slice(key.length);
      if (suffix.startsWith('-')) {
        return value + suffix;
      } else if (/^\d/.test(suffix)) {
        return value + '-' + suffix;
      }
      return value + suffix;
    }
  }

  return name;
}

// Converts operation names to display format (e.g., keyGen → Key Generation)
export function formatOperationName(name: string): string {
  const operationMap: Record<string, string> = {
    'keyGen': 'Key Generation',
    'encrypt': 'Encrypt',
    'decrypt': 'Decrypt',
    'sign': 'Sign',
    'verify': 'Verify',
    'deriveKey': 'Key Derivation',
    'encapsulate': 'Encapsulate',
    'decapsulate': 'Decapsulate',
  };

  return operationMap[name] || name.charAt(0).toUpperCase() + name.slice(1);
}

export function formatNodeName(name: string, context?: 'algorithm' | 'operation' | 'category'): string {
  if (context === 'operation') return formatOperationName(name);
  if (context === 'algorithm') return formatAlgorithmName(name);
  return name;
}

export function formatVariantName(name: string): string {
  if (name === 'default') return 'Default';
  return formatAlgorithmName(name);
}

export function buildDisplayPath(parts: string[]): string {
  return parts
    .map((part, index) => {
      if (index === 0) return part;
      if (index === 1) return formatAlgorithmName(part);
      if (index === 2) return formatOperationName(part);
      return formatVariantName(part);
    })
    .join(' / ');
}

function toSuperscript(num: number): string {
  const superscriptDigits: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '-': '⁻', '+': '⁺'
  };
  return String(num).split('').map(c => superscriptDigits[c] || c).join('');
}

// Formats number in power of 10 notation (e.g., 2.7560 × 10⁻⁷)
export function formatPowerOfTen(value: number, decimals: number = 4): string {
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / Math.pow(10, exp);
  return `${mantissa.toFixed(decimals)} × 10${toSuperscript(exp)}`;
}

// Uses power of 10 for large (>=1000) and small (<0.01) values
export function formatScoreValue(value: number | null, decimals: number = 4): string {
  if (value === null) return 'N/A';
  if (value >= 1000 || (value > 0 && value < 0.01)) {
    return formatPowerOfTen(value);
  }
  return value.toFixed(decimals);
}

export function formatErrorMargin(value: number | null): string {
  if (value === null) return 'N/A';
  return '+/- ' + formatScoreValue(value);
}

export function formatScoreWithUnit(value: number | null, unit: string): string {
  if (value === null) return 'N/A';

  if (value >= 1000 || (value > 0 && value < 0.01)) {
    return `${formatPowerOfTen(value)} ${unit}`;
  }
  return `${value.toFixed(4)} ${unit}`;
}

export function formatTooltipError(value: number): string {
  if (value >= 1000 || (value > 0 && value < 0.01)) {
    return formatPowerOfTen(value);
  }
  return value.toFixed(4);
}

export function formatRatio(value: number | null, decimals: number = 2): string {
  if (value === null) return 'N/A';
  return value.toFixed(decimals) + 'x';
}
