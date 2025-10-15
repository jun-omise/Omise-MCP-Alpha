/**
 * Transfer-related MCP Tools
 */
export class TransferTools {
    omiseClient;
    logger;
    constructor(omiseClient, logger) {
        this.omiseClient = omiseClient;
        this.logger = logger;
    }
    getTools() {
        return [
            {
                name: 'create_transfer',
                description: 'Create a new transfer to a recipient',
                inputSchema: {
                    type: 'object',
                    properties: {
                        amount: {
                            type: 'number',
                            description: 'Transfer amount in the smallest currency unit',
                            minimum: 1
                        },
                        currency: {
                            type: 'string',
                            description: 'Currency code (THB, USD, etc.)',
                            pattern: '^[A-Z]{3}$'
                        },
                        recipient: {
                            type: 'string',
                            description: 'Recipient ID for the transfer'
                        },
                        description: {
                            type: 'string',
                            description: 'Transfer description',
                            maxLength: 255
                        },
                        scheduled_date: {
                            type: 'string',
                            description: 'Scheduled transfer date (ISO 8601 format)',
                            format: 'date-time'
                        },
                        metadata: {
                            type: 'object',
                            description: 'Additional metadata for the transfer',
                            additionalProperties: {
                                type: 'string'
                            }
                        }
                    },
                    required: ['amount', 'currency', 'recipient']
                }
            },
            {
                name: 'retrieve_transfer',
                description: 'Retrieve transfer information by ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        transfer_id: {
                            type: 'string',
                            description: 'Transfer ID to retrieve'
                        }
                    },
                    required: ['transfer_id']
                }
            },
            {
                name: 'list_transfers',
                description: 'List all transfers with optional filtering',
                inputSchema: {
                    type: 'object',
                    properties: {
                        limit: {
                            type: 'number',
                            description: 'Number of transfers to retrieve (default: 20, max: 100)',
                            minimum: 1,
                            maximum: 100,
                            default: 20
                        },
                        offset: {
                            type: 'number',
                            description: 'Number of transfers to skip (default: 0)',
                            minimum: 0,
                            default: 0
                        },
                        order: {
                            type: 'string',
                            description: 'Order of results',
                            enum: ['chronological', 'reverse_chronological'],
                            default: 'chronological'
                        },
                        from: {
                            type: 'string',
                            description: 'Start date for filtering (ISO 8601 format)',
                            format: 'date-time'
                        },
                        to: {
                            type: 'string',
                            description: 'End date for filtering (ISO 8601 format)',
                            format: 'date-time'
                        },
                        recipient: {
                            type: 'string',
                            description: 'Filter by recipient ID'
                        }
                    }
                }
            },
            {
                name: 'update_transfer',
                description: 'Update transfer information (only for pending transfers)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        transfer_id: {
                            type: 'string',
                            description: 'Transfer ID to update'
                        },
                        amount: {
                            type: 'number',
                            description: 'New transfer amount',
                            minimum: 1
                        },
                        description: {
                            type: 'string',
                            description: 'New transfer description',
                            maxLength: 255
                        },
                        scheduled_date: {
                            type: 'string',
                            description: 'New scheduled transfer date (ISO 8601 format)',
                            format: 'date-time'
                        },
                        metadata: {
                            type: 'object',
                            description: 'New metadata for the transfer',
                            additionalProperties: {
                                type: 'string'
                            }
                        }
                    },
                    required: ['transfer_id']
                }
            },
            {
                name: 'destroy_transfer',
                description: 'Delete a transfer (only for pending transfers)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        transfer_id: {
                            type: 'string',
                            description: 'Transfer ID to delete'
                        },
                        confirm: {
                            type: 'boolean',
                            description: 'Confirmation flag to prevent accidental deletion',
                            default: false
                        }
                    },
                    required: ['transfer_id']
                }
            }
        ];
    }
    // ============================================================================
    // Validation Functions
    // ============================================================================
    validateTransferId(transferId) {
        // Omise transfer ID format: trsf_xxxxxxxxxxxxxxxx
        return /^trsf_[a-zA-Z0-9]{16}$/.test(transferId);
    }
    validateRecipientId(recipientId) {
        // Omise recipient ID format: rcpt_xxxxxxxxxxxxxxxx
        return /^rcpt_[a-zA-Z0-9]{16}$/.test(recipientId);
    }
    validateCurrency(currency) {
        const validCurrencies = ['THB', 'USD', 'JPY', 'EUR', 'GBP', 'SGD', 'HKD', 'AUD', 'CAD', 'CHF', 'CNY'];
        return validCurrencies.includes(currency.toUpperCase());
    }
    validateAmount(amount, currency) {
        if (amount <= 0)
            return false;
        // Check minimum amount by currency
        const minAmounts = {
            'THB': 1, // 1 satang
            'USD': 1, // 1 cent
            'JPY': 1, // 1 yen
            'EUR': 1, // 1 cent
            'GBP': 1, // 1 penny
        };
        const minAmount = minAmounts[currency] || 1;
        return amount >= minAmount;
    }
    validateScheduledDate(scheduledDate) {
        const date = new Date(scheduledDate);
        const now = new Date();
        // Past dates are invalid
        if (date <= now)
            return false;
        // Only dates within 1 year are allowed
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        return date <= oneYearFromNow;
    }
    sanitizeMetadata(metadata) {
        if (!metadata || typeof metadata !== 'object')
            return undefined;
        const sanitized = {};
        for (const [key, value] of Object.entries(metadata)) {
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                sanitized[key] = value;
            }
            else if (value === null) {
                sanitized[key] = null;
            }
        }
        return Object.keys(sanitized).length > 0 ? sanitized : undefined;
    }
    // ============================================================================
    // Tool Implementation
    // ============================================================================
    async createTransfer(params) {
        try {
            this.logger.info('Creating transfer via MCP tool', {
                amount: params.amount,
                currency: params.currency,
                recipient: params.recipient
            });
            // Validation
            if (!this.validateCurrency(params.currency)) {
                return {
                    success: false,
                    error: `Invalid currency code: ${params.currency}. Must be a valid 3-letter currency code.`
                };
            }
            if (!this.validateAmount(params.amount, params.currency)) {
                return {
                    success: false,
                    error: `Invalid amount: ${params.amount}. Amount must be positive and meet minimum requirements for ${params.currency}.`
                };
            }
            if (!this.validateRecipientId(params.recipient)) {
                return {
                    success: false,
                    error: 'Invalid recipient ID format. Must be in format: rcpt_xxxxxxxxxxxxxxxx'
                };
            }
            if (params.scheduled_date && !this.validateScheduledDate(params.scheduled_date)) {
                return {
                    success: false,
                    error: 'Invalid scheduled date. Must be a future date within one year.'
                };
            }
            const transferParams = {
                amount: params.amount,
                currency: params.currency.toUpperCase(),
                recipient: params.recipient,
                description: params.description,
                scheduled_date: params.scheduled_date,
                metadata: this.sanitizeMetadata(params.metadata)
            };
            const transfer = await this.omiseClient.post('/transfers', transferParams);
            return {
                success: true,
                data: transfer,
                message: `Transfer created successfully with ID: ${transfer.id}`
            };
        }
        catch (error) {
            this.logger.error('Failed to create transfer via MCP tool', error, params);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async retrieveTransfer(params) {
        try {
            this.logger.info('Retrieving transfer via MCP tool', { transferId: params.transfer_id });
            if (!this.validateTransferId(params.transfer_id)) {
                return {
                    success: false,
                    error: 'Invalid transfer ID format. Must be in format: trsf_xxxxxxxxxxxxxxxx'
                };
            }
            const transfer = await this.omiseClient.get(`/transfers/${params.transfer_id}`);
            return {
                success: true,
                data: transfer,
                message: `Transfer retrieved successfully`
            };
        }
        catch (error) {
            this.logger.error('Failed to retrieve transfer via MCP tool', error, { transferId: params.transfer_id });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async listTransfers(params) {
        try {
            this.logger.info('Listing transfers via MCP tool', params);
            // Parameter validation and default value setting
            const queryParams = {
                limit: Math.min(params.limit || 20, 100),
                offset: Math.max(params.offset || 0, 0),
                order: params.order || 'chronological',
                ...(params.from && { from: params.from }),
                ...(params.to && { to: params.to }),
                ...(params.recipient && { recipient: params.recipient })
            };
            const transfers = await this.omiseClient.get('/transfers', queryParams);
            return {
                success: true,
                data: transfers,
                message: `Retrieved ${transfers.data.length} transfers (total: ${transfers.total})`
            };
        }
        catch (error) {
            this.logger.error('Failed to list transfers via MCP tool', error, params);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async updateTransfer(params) {
        try {
            this.logger.info('Updating transfer via MCP tool', { transferId: params.transfer_id });
            if (!this.validateTransferId(params.transfer_id)) {
                return {
                    success: false,
                    error: 'Invalid transfer ID format. Must be in format: trsf_xxxxxxxxxxxxxxxx'
                };
            }
            if (params.amount && params.amount <= 0) {
                return {
                    success: false,
                    error: 'Transfer amount must be positive'
                };
            }
            if (params.scheduled_date && !this.validateScheduledDate(params.scheduled_date)) {
                return {
                    success: false,
                    error: 'Invalid scheduled date. Must be a future date within one year.'
                };
            }
            const updateData = {};
            if (params.amount !== undefined)
                updateData.amount = params.amount;
            if (params.description !== undefined)
                updateData.description = params.description;
            if (params.scheduled_date !== undefined)
                updateData.scheduled_date = params.scheduled_date;
            if (params.metadata !== undefined)
                updateData.metadata = this.sanitizeMetadata(params.metadata);
            if (Object.keys(updateData).length === 0) {
                return {
                    success: false,
                    error: 'No update data provided. Please provide amount, description, scheduled_date, or metadata to update.'
                };
            }
            const transfer = await this.omiseClient.put(`/transfers/${params.transfer_id}`, updateData);
            return {
                success: true,
                data: transfer,
                message: `Transfer updated successfully`
            };
        }
        catch (error) {
            this.logger.error('Failed to update transfer via MCP tool', error, { transferId: params.transfer_id });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async destroyTransfer(params) {
        try {
            this.logger.info('Destroying transfer via MCP tool', { transferId: params.transfer_id });
            if (!this.validateTransferId(params.transfer_id)) {
                return {
                    success: false,
                    error: 'Invalid transfer ID format. Must be in format: trsf_xxxxxxxxxxxxxxxx'
                };
            }
            if (!params.confirm) {
                return {
                    success: false,
                    error: 'Transfer deletion requires confirmation. Set confirm=true to proceed.'
                };
            }
            const transfer = await this.omiseClient.delete(`/transfers/${params.transfer_id}`);
            return {
                success: true,
                data: transfer,
                message: `Transfer deleted successfully`
            };
        }
        catch (error) {
            this.logger.error('Failed to destroy transfer via MCP tool', error, { transferId: params.transfer_id });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}
//# sourceMappingURL=transfer-tools.js.map