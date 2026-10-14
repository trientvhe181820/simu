const MAPPING_OBJECT_ID = 'ff808181a09d98f701a13bed8e9761ff';
let cachedApiUrl: string | null = null;
let resolvingPromise: Promise<string> | null = null;

export async function resolveApiUrl(): Promise<string> {
  // 1. Môi trường local (localhost) -> dùng proxy trực tiếp ''
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '';
  }

  // 2. Biến môi trường VITE_API_URL (nếu có)
  if (import.meta.env.VITE_API_URL) {
    return (import.meta.env.VITE_API_URL as string).replace(/\/$/, '');
  }

  // 3. Bộ nhớ cache
  if (cachedApiUrl) return cachedApiUrl;

  // 4. SessionStorage
  if (typeof window !== 'undefined') {
    const saved = sessionStorage.getItem('MAPPED_API_URL');
    if (saved) {
      cachedApiUrl = saved;
      return saved;
    }
  }

  // 5. Tự động lấy URL BE đã map từ Cloud Registry bằng Mapping Key
  if (resolvingPromise) return resolvingPromise;

  resolvingPromise = (async () => {
    try {
      const res = await fetch(`https://api.restful-api.dev/objects/${MAPPING_OBJECT_ID}`);
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.url) {
          const mapped = json.data.url.replace(/\/$/, '');
          cachedApiUrl = mapped;
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('MAPPED_API_URL', mapped);
          }
          return mapped;
        }
      }
    } catch {
      // ignore
    } finally {
      resolvingPromise = null;
    }
    return '';
  })();

  return resolvingPromise;
}

export function getApiUrl(): string {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '';
  }
  if (cachedApiUrl) return cachedApiUrl;
  if (typeof window !== 'undefined') {
    const saved = sessionStorage.getItem('MAPPED_API_URL');
    if (saved) {
      cachedApiUrl = saved;
      return saved;
    }
  }
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
}

export async function apiRequest(endpoint: string, method: string = 'GET', body?: any) {
  const apiUrl = await resolveApiUrl();
  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

  // Nếu trên môi trường Vercel static mà chưa map được backend API, bỏ qua polling thanh toán ngầm
  if (!apiUrl && isVercel && (endpoint.startsWith('/auth/create-payment-intent') || endpoint.startsWith('/auth/check-payment-status'))) {
    return { success: false, message: 'Standalone mode' };
  }

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': 'true',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${apiUrl}${endpoint}`, options);
  
  // Kiểm tra Content-Type tránh lỗi Unexpected token '<' khi response là HTML 404/405
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return { success: true };
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const authApi = {
  register: (data: any) => apiRequest('/auth/register', 'POST', data),
  login: (data: any) => apiRequest('/auth/login', 'POST', data),
  googleLogin: (data: any) => apiRequest('/auth/google-login', 'POST', data),
  upgradePro: (data: { email: string; months?: number; amount?: number; method?: string; memo?: string }) => apiRequest('/auth/upgrade-pro', 'POST', data),
  getAdminAnalytics: (email: string) => apiRequest('/auth/admin/analytics', 'POST', { email }),
  createPaymentIntent: (data: { email: string; months: number; amount: number; memo: string }) => apiRequest('/auth/create-payment-intent', 'POST', data),
  checkPaymentStatus: (memo: string) => apiRequest(`/auth/check-payment-status?memo=${memo}`, 'GET'),
  pausePro: (email: string) => apiRequest('/auth/pause-pro', 'POST', { email }),
  resumePro: (email: string) => apiRequest('/auth/resume-pro', 'POST', { email }),
};

export const tradingApi = {
  placeOrder: (data: any) => apiRequest('/trading/order', 'POST', data),
  analyzeBehavior: (userId: string) => apiRequest(`/trading/analyze?userId=${userId}`, 'GET'),
  getLeaderboard: () => apiRequest('/trading/leaderboard', 'GET'),
};

export const aiApi = {
  marketAnalysis: (symbol: string, coinName: string) =>
    apiRequest(`/ai/market-analysis?symbol=${symbol}&coinName=${encodeURIComponent(coinName)}`, 'GET'),
};

export const communityApi = {
  getPosts: (category?: string, filter?: string) => {
    let query = '';
    const params = [];
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (filter) params.push(`filter=${encodeURIComponent(filter)}`);
    if (params.length > 0) query = `?${params.join('&')}`;
    return apiRequest(`/community${query}`, 'GET');
  },
  getSidebarData: () => apiRequest('/community/sidebar', 'GET'),
  createPost: (data: { userId: string; title: string; content: string; category?: string }) =>
    apiRequest('/community', 'POST', data),
  toggleLike: (postId: number, userId: string) =>
    apiRequest('/community/like', 'POST', { postId, userId }),
  addComment: (postId: number, userId: string, content: string) =>
    apiRequest('/community/comment', 'POST', { postId, userId, content }),
};

