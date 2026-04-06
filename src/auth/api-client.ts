/**
 * geobuk-shared/auth - API Client Factory
 *
 * 환경변수를 코드 안에 직접 박지 않고, 각 앱이 초기화 시 설정을 주입합니다.
 *
 * 사용예시 (Hub-Frontend):
 *   import { createGeobukApiClient } from 'geobuk-shared/auth';
 *   const { publicClient, authClient } = createGeobukApiClient({
 *     baseURL: import.meta.env.VITE_API_URL,
 *     onLogout: () => { window.location.href = '/auth/login'; }
 *   });
 *
 * 사용예시 (ExamHub / Susi):
 *   const { publicClient, authClient } = createGeobukApiClient({
 *     baseURL: process.env.NEXT_PUBLIC_API_URL,
 *     onLogout: () => router.push('/login'),
 *   });
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { camelizeKeys, decamelizeKeys } from 'humps';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  clearTokens,
} from './token-manager.js';

export interface GeobukApiClientConfig {
  /** Hub Backend API URL (e.g. https://ts-back-nest-479305.du.r.appspot.com) */
  baseURL: string;
  /** 인증만료/로그아웃 시 실행할 콜백 (각 앱의 라우터에 맞게 주입) */
  onLogout?: () => void;
  /** 로그인 페이지 경로 - 이 경로에서는 자동 로그아웃 처리하지 않음 (default: /auth/) */
  loginPathPrefix?: string;
  /** 토큰 만료 에러 코드 (default: 'C401') */
  tokenExpiredCode?: string;
  /** 유효하지 않은 토큰 에러 코드 (default: 'C999') */
  invalidTokenCode?: string;
  /** 세션 만료 에러 코드 (default: 'C5050') */
  sessionExpiredCode?: string;
}

export interface GeobukApiClients {
  /** 인증 불필요 API (로그인, 회원가입 등) */
  publicClient: AxiosInstance;
  /** 인증 필요 API (JWT 자동 첨부 및 갱신) */
  authClient: AxiosInstance;
}

/**
 * 거북스쿨 Axios 클라이언트 팩토리
 * Hub 생태계의 모든 앱에서 동일한 방식으로 인증된 API 통신을 처리합니다.
 */
export function createGeobukApiClient(config: GeobukApiClientConfig): GeobukApiClients {
  const {
    baseURL,
    onLogout,
    loginPathPrefix = '/auth/',
    tokenExpiredCode = 'C401',
    invalidTokenCode = 'C999',
    sessionExpiredCode = 'C5050',
  } = config;

  // --- 공통 인터셉터 함수 ---

  const handleLogout = () => {
    if (window.location.pathname.startsWith(loginPathPrefix)) return;
    clearTokens();
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = loginPathPrefix + 'login';
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return null;
      const response = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
      const data = response.data?.data || response.data;
      const newToken = data?.accessToken;
      if (newToken) {
        setAccessToken(newToken);
        return newToken;
      }
      return null;
    } catch {
      return null;
    }
  };

  const requestInterceptor = (cfg: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getAccessToken();
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    if (cfg.data) cfg.data = decamelizeKeys(cfg.data);
    if (cfg.params) cfg.params = decamelizeKeys(cfg.params);
    return cfg;
  };

  const responseSuccessInterceptor = (response: AxiosResponse): AxiosResponse => {
    if (response.data && typeof response.data === 'object' && !(response.data instanceof Blob)) {
      response.data = camelizeKeys(response.data);
    }
    return response;
  };

  const responseErrorInterceptor = async (error: AxiosError): Promise<never> => {
    const originalRequest = error.config as any;
    if (error.response?.data) {
      error.response.data = camelizeKeys(error.response.data as object);
    }
    if (error.response?.status === 401) {
      const errorData = error.response.data as any;
      const errorCode = errorData?.detailCode;

      if (errorCode === tokenExpiredCode && !originalRequest._retry) {
        originalRequest._retry = true;
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios.request({ ...originalRequest }) as Promise<never>;
        } else {
          handleLogout();
        }
      }
      if ([invalidTokenCode, sessionExpiredCode].includes(errorCode)) {
        handleLogout();
      }
    }
    return Promise.reject(error);
  };

  // --- publicClient: 인증 불필요, camelCase 변환만 ---
  const publicClient = axios.create({ baseURL, timeout: 30000, headers: { 'Content-Type': 'application/json' }, withCredentials: true });
  publicClient.interceptors.request.use(
    (cfg) => { if (cfg.data) cfg.data = decamelizeKeys(cfg.data); if (cfg.params) cfg.params = decamelizeKeys(cfg.params); return cfg; },
    (err) => Promise.reject(err),
  );
  publicClient.interceptors.response.use(responseSuccessInterceptor, (err) => Promise.reject(err));

  // --- authClient: JWT 자동 첨부 + 갱신 ---
  const authClient = axios.create({ baseURL, timeout: 30000, headers: { 'Content-Type': 'application/json' }, withCredentials: true });
  authClient.interceptors.request.use(requestInterceptor, (err) => Promise.reject(err));
  authClient.interceptors.response.use(responseSuccessInterceptor, responseErrorInterceptor);

  return { publicClient, authClient };
}
