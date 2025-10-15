/**
 * Omise API Client
 */
import axios, { AxiosError } from 'axios';
export class OmiseClient {
    client;
    config;
    logger;
    rateLimitInfo = null;
    requestQueue = [];
    isProcessingQueue = false;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.client = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeout,
            auth: {
                username: config.secretKey,
                password: ''
            },
            headers: {
                'Content-Type': 'application/json',
                'Omise-Version': config.apiVersion,
                'User-Agent': `${config.server?.name || 'omise-mcp-server'}/${config.server?.version || '1.0.0'}`
            }
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use((config) => {
            const requestId = this.generateRequestId();
            const timestamp = new Date().toISOString();
            if (this.config.logging.enableRequestLogging) {
                this.logger.info('Omise API Request', {
                    requestId,
                    method: config.method?.toUpperCase(),
                    url: config.url,
                    headers: config.headers,
                    data: config.data
                });
            }
            // Set request context
            config.metadata = { requestId, timestamp };
            return config;
        }, (error) => {
            this.logger.error('Request interceptor error', error);
            return Promise.reject(error);
        });
        // Response interceptor
        this.client.interceptors.response.use((response) => {
            const requestId = response.config.metadata?.requestId;
            const timestamp = response.config.metadata?.timestamp;
            const duration = Date.now() - new Date(timestamp).getTime();
            if (this.config.logging.enableResponseLogging) {
                this.logger.info('Omise API Response', {
                    requestId,
                    status: response.status,
                    duration,
                    headers: response.headers,
                    data: response.data
                });
            }
            // Update rate limit information
            this.updateRateLimitInfo(response.headers);
            return response;
        }, (error) => {
            const requestId = error.config?.metadata?.requestId;
            const timestamp = error.config?.metadata?.timestamp;
            const duration = timestamp ? Date.now() - new Date(timestamp).getTime() : 0;
            this.logger.error('Omise API Error', error, {
                requestId,
                status: error.response?.status,
                duration,
                data: error.response?.data,
                headers: error.response?.headers
            });
            // Handle rate limit errors
            if (error.response?.status === 429) {
                this.handleRateLimitError(error);
            }
            return Promise.reject(this.handleApiError(error));
        });
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    updateRateLimitInfo(headers) {
        const remaining = headers['x-ratelimit-remaining'];
        const resetTime = headers['x-ratelimit-reset'];
        const limit = headers['x-ratelimit-limit'];
        if (remaining !== undefined && resetTime !== undefined && limit !== undefined) {
            this.rateLimitInfo = {
                remaining: parseInt(remaining, 10),
                resetTime: parseInt(resetTime, 10),
                limit: parseInt(limit, 10)
            };
        }
    }
    handleRateLimitError(error) {
        const retryAfter = error.response?.headers['retry-after'];
        if (retryAfter) {
            const delay = parseInt(retryAfter, 10) * 1000;
            this.logger.warn(`Rate limit exceeded. Retrying after ${delay}ms`);
            // Add to retry queue
            setTimeout(() => {
                this.processQueue();
            }, delay);
        }
    }
    handleApiError(error) {
        if (error.response?.data) {
            const omiseError = error.response.data;
            return new Error(`Omise API Error: ${omiseError.message} (${omiseError.code})`);
        }
        if (error.code === 'ECONNABORTED') {
            return new Error('Request timeout');
        }
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return new Error('Network error: Unable to connect to Omise API');
        }
        return new Error(`Request failed: ${error.message}`);
    }
    async executeWithRetry(operation) {
        let lastError;
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                // Do not retry rate limit errors or client errors
                if (error instanceof AxiosError && error.response?.status && error.response.status < 500) {
                    throw error;
                }
                if (attempt < this.config.retryAttempts) {
                    const delay = this.config.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                    this.logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, { error: lastError.message });
                    await this.sleep(delay);
                }
            }
        }
        throw lastError;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async processQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
        }
        this.isProcessingQueue = true;
        while (this.requestQueue.length > 0) {
            const operation = this.requestQueue.shift();
            if (operation) {
                try {
                    await operation();
                }
                catch (error) {
                    this.logger.error('Queue operation failed', error);
                }
            }
        }
        this.isProcessingQueue = false;
    }
    getRateLimitInfo() {
        return this.rateLimitInfo;
    }
    // ============================================================================
    // Charge API
    // ============================================================================
    async createCharge(params) {
        return this.executeWithRetry(async () => {
            this.logger.info('Creating charge', { amount: params.amount, currency: params.currency });
            const response = await this.client.post('/charges', params);
            if (response.data.error) {
                throw new Error(`Omise API Error: ${response.data.error.message}`);
            }
            this.logger.info('Charge created successfully', { chargeId: response.data.data?.id });
            return response.data.data;
        });
    }
    async getCharge(chargeId) {
        return this.executeWithRetry(async () => {
            this.logger.info('Retrieving charge', { chargeId });
            const response = await this.client.get(`/charges/${chargeId}`);
            if (response.data.error) {
                throw new Error(`Omise API Error: ${response.data.error.message}`);
            }
            return response.data.data;
        });
    }
    async listCharges(params) {
        return this.executeWithRetry(async () => {
            this.logger.info('Listing charges', params);
            const response = await this.client.get('/charges', { params });
            return response.data;
        });
    }
    // ============================================================================
    // Customer API
    // ============================================================================
    async createCustomer(params) {
        return this.executeWithRetry(async () => {
            this.logger.info('Creating customer', { email: params.email });
            const response = await this.client.post('/customers', params);
            if (response.data.error) {
                throw new Error(`Omise API Error: ${response.data.error.message}`);
            }
            this.logger.info('Customer created successfully', { customerId: response.data.data?.id });
            return response.data.data;
        });
    }
    async getCustomer(customerId) {
        return this.executeWithRetry(async () => {
            this.logger.info('Retrieving customer', { customerId });
            const response = await this.client.get(`/customers/${customerId}`);
            if (response.data.error) {
                throw new Error(`Omise API Error: ${response.data.error.message}`);
            }
            return response.data.data;
        });
    }
    async listCustomers(params) {
        return this.executeWithRetry(async () => {
            this.logger.info('Listing customers', params);
            const response = await this.client.get('/customers', { params });
            return response.data;
        });
    }
    // ============================================================================
    // Token API
    // ============================================================================
    async createToken(params) {
        return this.executeWithRetry(async () => {
            this.logger.info('Creating token', { cardNumber: params.card.number.replace(/\d(?=\d{4})/g, '*') });
            const response = await this.client.post('/tokens', params);
            if (response.data.error) {
                throw new Error(`Omise API Error: ${response.data.error.message}`);
            }
            this.logger.info('Token created successfully', { tokenId: response.data.data?.id });
            return response.data.data;
        });
    }
    async getToken(tokenId) {
        return this.executeWithRetry(async () => {
            this.logger.info('Retrieving token', { tokenId });
            const response = await this.client.get(`/tokens/${tokenId}`);
            if (response.data.error) {
                throw new Error(`Omise API Error: ${response.data.error.message}`);
            }
            return response.data.data;
        });
    }
    // ============================================================================
    // Generic API methods
    // ============================================================================
    async get(endpoint, params) {
        return this.executeWithRetry(async () => {
            this.logger.info('GET request', { endpoint, params });
            const response = await this.client.get(endpoint, { params });
            return response.data;
        });
    }
    async post(endpoint, data) {
        return this.executeWithRetry(async () => {
            this.logger.info('POST request', { endpoint, data });
            const response = await this.client.post(endpoint, data);
            return response.data;
        });
    }
    async put(endpoint, data) {
        return this.executeWithRetry(async () => {
            this.logger.info('PUT request', { endpoint, data });
            const response = await this.client.put(endpoint, data);
            return response.data;
        });
    }
    async delete(endpoint) {
        return this.executeWithRetry(async () => {
            this.logger.info('DELETE request', { endpoint });
            const response = await this.client.delete(endpoint);
            return response.data;
        });
    }
}
//# sourceMappingURL=omise-client.js.map