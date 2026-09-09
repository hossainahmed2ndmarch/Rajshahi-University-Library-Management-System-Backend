import bcrypt from 'bcryptjs';

export const hashPassword = async (
  password: string,
  saltRounds: number = 12
): Promise<string> => {
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  givenPassword: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(givenPassword, hash);
};

export const passwordHelpers = {
  hashPassword,
  comparePassword,
};

export default passwordHelpers;
