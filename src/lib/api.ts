export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('CUSTOM_API_URL');
    if (custom) return custom.replace(/\/$/, '');
  }
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
}

export async function apiRequest(endpoint: string, method: string = 'GET', body?: any) {
  const apiUrl = getApiUrl();
  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

  // Nếu trên môi trường Vercel static mà không có backend API riêng, bỏ qua các call ngầm để tránh 405
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

