import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokens';

const BASE_URL = 'http://127.0.0.1:8000/api/';

const api = axios.create({ baseURL: BASE_URL });

// Ajoute le token JWT sur chaque requête, s'il existe.
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// En cas de 401 (access token expiré), on tente UNE fois de le rafraîchir
// via le refresh token, puis on rejoue la requête d'origine.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    if (response?.status !== 401 || config._retried) {
      return Promise.reject(error);
    }

    const refresh = getRefreshToken();
    if (!refresh) {
      clearTokens();
      return Promise.reject(error);
    }

    config._retried = true;

    try {
      // Plusieurs requêtes peuvent échouer en même temps : on ne lance
      // qu'un seul appel de rafraîchissement, les autres l'attendent.
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${BASE_URL}token/refresh/`, { refresh })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const { data } = await refreshPromise;
      setTokens({ access: data.access });
      config.headers.Authorization = `Bearer ${data.access}`;
      return api(config);
    } catch (refreshError) {
      clearTokens();
      return Promise.reject(refreshError);
    }
  }
);

export default api;
