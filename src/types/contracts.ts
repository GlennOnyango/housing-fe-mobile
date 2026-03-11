export type UserRole = "owner" | "tenant";

export type BootstrapState =
  | "idle"
  | "bootstrapping"
  | "authenticated"
  | "unauthenticated"
  | "roleUnresolved";

export interface AuthSession {
  accessToken: string | null;
  refreshTokenPresent: boolean;
  role: UserRole | null;
  orgId?: string;
  userId?: string;
  bootstrapState: BootstrapState;
}

export interface ProblemFieldError {
  field?: string;
  message: string;
}

export interface ApiProblem {
  title: string;
  detail: string;
  status: number;
  errors?: ProblemFieldError[];
  requestId?: string;
  raw?: unknown;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
