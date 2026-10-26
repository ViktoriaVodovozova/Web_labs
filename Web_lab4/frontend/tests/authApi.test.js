import { describe, it, expect, vi } from 'vitest';
import { api } from '../src/services/httpClient';
import { authApi } from '../src/services/authApi';

// Изолируем предметный API от сети и обработки JWT.
vi.mock('../src/services/httpClient', () => ({ api: vi.fn(), request: vi.fn() }));

describe('API профиля', () => {
  it('возвращает профиль и передаёт сигнал отмены HTTP-клиенту', async () => {
    // Arrange
    const profile = { id: 'user-1', username: 'reader', email: 'reader@example.com', role: 'USER' };
    const controller = new AbortController();
    api.mockResolvedValue({ data: profile });

    // Act
    const result = await authApi.getProfile(controller.signal);

    // Assert
    expect(api).toHaveBeenCalledWith('/auth/me', { signal: controller.signal });
    expect(result).toEqual(profile);
  });
});
