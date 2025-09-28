/**
 * MSW モックサーバー
 */

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers } from './handlers.js';

export const server = setupServer(...handlers);
