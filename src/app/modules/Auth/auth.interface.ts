export type TLoginUser = {
  email: string;
  password: string;
};

export type TRefreshToken = {
  refreshToken: string;
};

export type TChangePassword = {
  oldPassword: string;
  newPassword: string;
};

export type TForgotPassword = {
  email: string;
};

export type TResetPassword = {
  id: number;
  newPassword: string;
};
