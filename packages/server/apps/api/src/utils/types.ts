export type UserDetails = {
  id: number;
  email: string;
  avatar: string;
  name: string;
};

export type JwtPayload = {
  sub: number;
  iat: number;
  exp: number;
};
export type ExceptionResponse = {
  errorCode?: string;
  message?: string | string[];
  error?: string;
};
