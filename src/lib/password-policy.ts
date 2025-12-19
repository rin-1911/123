export function isPasswordStrong(password: string): boolean {
  if (typeof password !== "string") return false;
  if (password.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigit = /\d/.test(password);
  return hasLetter && hasDigit;
}

// 弱密码定义：纯数字（符合何总要求的提示规则）
export function isWeakPassword(password: string): boolean {
  if (typeof password !== "string") return false;
  return /^\d+$/.test(password);
}



