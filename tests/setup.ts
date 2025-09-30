/**
 * Jest テストセットアップ
 */

import { beforeAll, afterAll, afterEach } from '@jest/globals';
import { server } from './mocks/server';

// MSW サーバーのセットアップ
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// 環境変数の設定
process.env.NODE_ENV = 'test';
process.env.OMISE_PUBLIC_KEY = 'pkey_test_1234567890';
process.env.OMISE_SECRET_KEY = 'skey_test_1234567890';
process.env.OMISE_ENVIRONMENT = 'test';
process.env.OMISE_API_VERSION = '2017-11-02';
process.env.OMISE_BASE_URL = 'https://api.omise.co';
process.env.OMISE_TIMEOUT = '30000';
process.env.OMISE_RETRY_ATTEMPTS = '3';
process.env.OMISE_RETRY_DELAY = '1000';
process.env.LOG_LEVEL = 'error';
process.env.LOG_FORMAT = 'simple';
process.env.LOG_REQUESTS = 'false';
process.env.LOG_RESPONSES = 'false';
process.env.RATE_LIMIT_ENABLED = 'false';
