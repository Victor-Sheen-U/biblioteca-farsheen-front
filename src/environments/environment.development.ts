export interface EnvironmentConfig {
  readonly production: boolean;
  readonly apiUrl: string;
}

export const environment: EnvironmentConfig = {
  production: false,
  apiUrl: '/biblioteca/api/v1',
};
