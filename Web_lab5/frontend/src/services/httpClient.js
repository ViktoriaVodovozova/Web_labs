import { session$, setSession, getSessionGeneration, updateTokens } from './session';

let refreshing = null;

export class ApiError extends Error {
  constructor(status, message, detail = {}) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}
const messages = {
  400: 'Проверьте параметры запроса.',
  401: 'Сессия истекла. Войдите снова.',
  403: 'Недостаточно прав для этого действия.',
  404: 'Запись не найдена.',
  409: 'Такие данные уже существуют.',
  422: 'Проверьте заполнение полей.',
};
export async function request(path, { token, signal, ...options } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const abort = () => controller.abort(signal.reason);
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  try {
    const response = await fetch(`/api${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data =
      response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok)
      throw new ApiError(
        response.status,
        response.status >= 500
          ? 'Ошибка сервера. Попробуйте позже.'
          : data?.error ||
              messages[response.status] ||
              'Не удалось выполнить запрос.',
        data?.detail
      );
    return {
      data,
      total: Number(response.headers.get('X-Total-Count') || 0),
      pages: Number(response.headers.get('X-Total-Pages') || 0),
    };
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Запрос отменён', 'AbortError');
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      0,
      controller.signal.aborted
        ? 'Сервер не ответил за 15 секунд. Повторите запрос.'
        : 'Сервер недоступен. Проверьте соединение.'
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
async function refresh() {
  if (!refreshing) {
    const revision = getSessionGeneration();
    const session = session$.value;
    if (!session) throw new ApiError(401, messages[401]);
    refreshing = request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })
      .then(({ data }) => {
        if (revision !== getSessionGeneration())
          throw new ApiError(401, messages[401]);
        // Do not advance generation: requests from this same session share the refresh.
        updateTokens(data);
        return data;
      })
      .catch(error => {
        // A network error must not erase an otherwise valid refresh token.
        if (revision === getSessionGeneration() && error.status === 401)
          setSession(null);
        throw error;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}
export async function api(path, options = {}) {
  const session = session$.value;
  if (!session) throw new ApiError(401, messages[401]);
  const revision = getSessionGeneration();
  try {
    return await request(path, { ...options, token: session.accessToken });
  } catch (error) {
    if (error.status !== 401 || revision !== getSessionGeneration()) throw error;
    // Another parallel request may already have refreshed the access token.
    const fresh =
      session$.value?.accessToken !== session.accessToken
        ? session$.value
        : await refresh();
    try {
      return await request(path, { ...options, token: fresh.accessToken });
    } catch (retryError) {
      if (retryError.status === 401 && revision === getSessionGeneration())
        setSession(null);
      throw retryError;
    }
  }
}
