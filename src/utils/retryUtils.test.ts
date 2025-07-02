import { retry, getRetryErrorMessage } from './retryUtils';

describe('retry utility', () => {
  it('resolves on first success', async () => {
    const op = jest.fn().mockResolvedValue('ok');
    const result = await retry(op, { maxAttempts: 3, baseDelay: 1 });
    expect(result.success).toBe(true);
    expect(result.data).toBe('ok');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    let count = 0;
    const op = jest.fn().mockImplementation(() => {
      count++;
      if (count < 2) throw { status: 500 };
      return Promise.resolve('done');
    });
    const result = await retry(op, { maxAttempts: 3, baseDelay: 1 });
    expect(result.success).toBe(true);
    expect(result.data).toBe('done');
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('fails after max attempts', async () => {
    const op = jest.fn().mockRejectedValue({ status: 500 });
    const result = await retry(op, { maxAttempts: 2, baseDelay: 1 });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('does not retry if retryCondition returns false', async () => {
    const op = jest.fn().mockRejectedValue({ status: 400 });
    const result = await retry(op, { maxAttempts: 3, baseDelay: 1, retryCondition: (e) => e.status === 500 });
    expect(result.success).toBe(false);
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('getRetryErrorMessage returns correct messages', () => {
    expect(getRetryErrorMessage({ status: 429 }, 2, 3)).toMatch(/Too many requests/);
    expect(getRetryErrorMessage({ status: 500 }, 2, 3)).toMatch(/Server error/);
    expect(getRetryErrorMessage({ name: 'TypeError', message: 'fetch failed' }, 2, 3)).toMatch(/Network error/);
    expect(getRetryErrorMessage({}, 3, 3)).toMatch(/failed after 3 attempts/);
  });
}); 