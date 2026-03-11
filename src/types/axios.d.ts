import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    _skipAuth?: boolean;
    _retry?: boolean;
    _cooldownKey?: string;
  }
}
