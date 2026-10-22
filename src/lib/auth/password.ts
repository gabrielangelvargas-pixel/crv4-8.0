import bcrypt from "bcryptjs";

const COSTO = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COSTO);
}

export function verificarPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
