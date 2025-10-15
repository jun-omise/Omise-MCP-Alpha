/**
 * Dispute-related MCP Tools
 */
export class DisputeTools {
    omiseClient;
    logger;
    constructor(omiseClient, logger) {
        this.omiseClient = omiseClient;
        this.logger = logger;
    }
    getTools() {
        return [
            {
                name: 'list_disputes',
                description: 'List all disputes with optional filtering',
                inputSchema: {
                    type: 'object',
                    properties: {
                        limit: {
                            type: 'number',
                            description: 'Number of disputes to retrieve (default: 20, max: 100)',
                            minimum: 1,
                            maximum: 100,
                            default: 20
                        },
                        offset: {
                            type: 'number',
                            description: 'Number of disputes to skip (default: 0)',
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
                        status: {
                            type: 'string',
                            description: 'Filter by dispute status',
                            enum: ['open', 'pending', 'closed']
                        },
                        charge: {
                            type: 'string',
                            description: 'Filter by charge ID'
                        }
                    }
                }
            },
            {
                name: 'retrieve_dispute',
                description: 'Retrieve dispute information by ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        dispute_id: {
                            type: 'string',
                            description: 'Dispute ID to retrieve'
                        }
                    },
                    required: ['dispute_id']
                }
            },
            {
                name: 'accept_dispute',
                description: 'Accept a dispute (accept the chargeback)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        dispute_id: {
                            type: 'string',
                            description: 'Dispute ID to accept'
                        },
                        message: {
                            type: 'string',
                            description: 'Message for accepting the dispute',
                            maxLength: 255
                        },
                        metadata: {
                            type: 'object',
                            description: 'Additional metadata for the acceptance',
                            additionalProperties: {
                                type: 'string'
                            }
                        }
                    },
                    required: ['dispute_id']
                }
            },
            {
                name: 'update_dispute',
                description: 'Update dispute information',
                inputSchema: {
                    type: 'object',
                    properties: {
                        dispute_id: {
                            type: 'string',
                            description: 'Dispute ID to update'
                        },
                        message: {
                            type: 'string',
                            description: 'New message for the dispute',
                            maxLength: 255
                        },
                        metadata: {
                            type: 'object',
                            description: 'New metadata for the dispute',
                            additionalProperties: {
                                type: 'string'
                            }
                        }
                    },
                    required: ['dispute_id']
                }
            },
            {
                name: 'list_dispute_documents',
                description: 'List all documents for a dispute',
                inputSchema: {
                    type: 'object',
                    properties: {
                        dispute_id: {
                            type: 'string',
                            description: 'Dispute ID to list documents for'
                        },
                        limit: {
                            type: 'number',
                            description: 'Number of documents to retrieve (default: 20, max: 100)',
                            minimum: 1,
                            maximum: 100,
                            default: 20
                        },
                        offset: {
                            type: 'number',
                            description: 'Number of documents to skip (default: 0)',
                            minimum: 0,
                            default: 0
                        }
                    },
                    required: ['dispute_id']
                }
            },
            {
                name: 'retrieve_dispute_document',
                description: 'Retrieve a specific dispute document',
                inputSchema: {
                    type: 'object',
                    properties: {
                        dispute_id: {
                            type: 'string',
                            description: 'Dispute ID'
                        },
                        document_id: {
                            type: 'string',
                            description: 'Document ID to retrieve'
                        }
                    },
                    required: ['dispute_id', 'document_id']
                }
            },
            {
                name: 'upload_dispute_document',
                description: 'Upload a document for a dispute',
                inputSchema: {
                    type: 'object',
                    properties: {
                        dispute_id: {
                            type: 'string',
                            description: 'Dispute ID to upload document for'
                        },
                        filename: {
                            type: 'string',
                            description: 'Document filename',
                            maxLength: 255
                        },
                        content: {
                            type: 'string',
                            description: 'Document content (base64 encoded)'
                        },
                        content_type: {
                            type: 'string',
                            description: 'Document content type',
                            enum: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'text/plain'],
                            default: 'application/pdf'
                        },
                        description: {
                            type: 'string',
                            description: 'Document description',
                            maxLength: 255
                        }
                    },
                    required: ['dispute_id', 'filename', 'content']
                }
            },
            {
                name: 'destroy_dispute_document',
                description: 'Delete a dispute document',
                inputSchema: {
                    type: 'object',
                    properties: {
                        dispute_id: {
                            type: 'string',
                            description: 'Dispute ID'
                        },
                        document_id: {
                            type: 'string',
                            description: 'Document ID to delete'
                        },
                        confirm: {
                            type: 'boolean',
                            description: 'Confirmation flag to prevent accidental deletion',
                            default: false
                        }
                    },
                    required: ['dispute_id', 'document_id']
                }
            }
        ];
    }
    // ============================================================================
    // Validation Functions
    // ============================================================================
    validateDisputeId(disputeId) {
        // Omise dispute ID format: dspt_xxxxxxxxxxxxxxxx
        return /^dspt_[a-zA-Z0-9]{16}$/.test(disputeId);
    }
    validateDocumentId(documentId) {
        // Omise document ID format: docu_xxxxxxxxxxxxxxxx
        return /^docu_[a-zA-Z0-9]{16}$/.test(documentId);
    }
    validateContentType(contentType) {
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'text/plain'];
        return validTypes.includes(contentType);
    }
    validateBase64Content(content) {
        try {
            // Base64 format validation
            const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
            if (!base64Regex.test(content))
                return false;
            // Decode and check size
            const buffer = Buffer.from(content, 'base64');
            return buffer.length > 0 && buffer.length <= 10 * 1024 * 1024; // 10MB limit
        }
        catch {
            return false;
        }
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
    async listDisputes(params) {
        try {
            this.logger.info('Listing disputes via MCP tool', params);
            // Parameter validation and default value setting
            const queryParams = {
                limit: Math.min(params.limit || 20, 100),
                offset: Math.max(params.offset || 0, 0),
                order: params.order || 'chronological',
                ...(params.from && { from: params.from }),
                ...(params.to && { to: params.to }),
                ...(params.status && { status: params.status }),
                ...(params.charge && { charge: params.charge })
            };
            const disputes = await this.omiseClient.get('/disputes', queryParams);
            return {
                success: true,
                data: disputes,
                message: `Retrieved ${disputes.data.length} disputes (total: ${disputes.total})`
            };
        }
        catch (error) {
            this.logger.error('Failed to list disputes via MCP tool', error, params);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async retrieveDispute(params) {
        try {
            this.logger.info('Retrieving dispute via MCP tool', { disputeId: params.dispute_id });
            if (!this.validateDisputeId(params.dispute_id)) {
                return {
                    success: false,
                    error: 'Invalid dispute ID format. Must be in format: dspt_xxxxxxxxxxxxxxxx'
                };
            }
            const dispute = await this.omiseClient.get(`/disputes/${params.dispute_id}`);
            return {
                success: true,
                data: dispute,
                message: `Dispute retrieved successfully`
            };
        }
        catch (error) {
            this.logger.error('Failed to retrieve dispute via MCP tool', error, { disputeId: params.dispute_id });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async acceptDispute(params) {
        try {
            this.logger.info('Accepting dispute via MCP tool', { disputeId: params.dispute_id });
            if (!this.validateDisputeId(params.dispute_id)) {
                return {
                    success: false,
                    error: 'Invalid dispute ID format. Must be in format: dspt_xxxxxxxxxxxxxxxx'
                };
            }
            const acceptData = {};
            if (params.message)
                acceptData.message = params.message;
            if (params.metadata)
                acceptData.metadata = this.sanitizeMetadata(params.metadata);
            const dispute = await this.omiseClient.post(`/disputes/${params.dispute_id}/accept`, acceptData);
            return {
                success: true,
                data: dispute,
                message: `Dispute accepted successfully`
            };
        }
        catch (error) {
            this.logger.error('Failed to accept dispute via MCP tool', error, { disputeId: params.dispute_id });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async updateDispute(params) {
        try {
            this.logger.info('Updating dispute via MCP tool', { disputeId: params.dispute_id });
            if (!this.validateDisputeId(params.dispute_id)) {
                return {
                    success: false,
                    error: 'Invalid dispute ID format. Must be in format: dspt_xxxxxxxxxxxxxxxx'
                };
            }
            const updateData = {};
            if (params.message !== undefined)
                updateData.message = params.message;
            if (params.metadata !== undefined)
                updateData.metadata = this.sanitizeMetadata(params.metadata);
            if (Object.keys(updateData).length === 0) {
                return {
                    success: false,
                    error: 'No update data provided. Please provide message or metadata to update.'
                };
            }
            const dispute = await this.omiseClient.put(`/disputes/${params.dispute_id}`, updateData);
            return {
                success: true,
                data: dispute,
                message: `Dispute updated successfully`
            };
        }
        catch (error) {
            this.logger.error('Failed to update dispute via MCP tool', error, { disputeId: params.dispute_id });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async listDisputeDocuments(params) {
        try {
            this.logger.info('Listing dispute documents via MCP tool', { disputeId: params.dispute_id });
            if (!this.validateDisputeId(params.dispute_id)) {
                return {
                    success: false,
                    error: 'Invalid dispute ID format. Must be in format: dspt_xxxxxxxxxxxxxxxx'
                };
            }
            const queryParams = {
                limit: Math.min(params.limit || 20, 100),
                offset: Math.max(params.offset || 0, 0)
            };
            const documents = await this.omiseClient.get(`/disputes/${params.dispute_id}/documents`, queryParams);
            return {
                success: true,
                data: documents,
                message: `Retrieved ${documents.data.length} documents for dispute (total: ${documents.total})`
            };
        }
        catch (error) {
            this.logger.error('Failed to list dispute documents via MCP tool', error, { disputeId: params.dispute_id });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async retrieveDisputeDocument(params) {
        try {
            this.logger.info('Retrieving dispute document via MCP tool', { disputeId: params.dispute_id, documentId: params.document_id });
            if (!this.validateDisputeId(params.dispute_id)) {
                return {
                    success: false,
                    error: 'Invalid dispute ID format. Must be in format: dspt_xxxxxxxxxxxxxxxx'
                };
            }
            if (!this.validateDocumentId(params.document_id)) {
                return {
                    success: false,
                    error: 'Invalid document ID format. Must be in format: docu_xxxxxxxxxxxxxxxx'
                };
            }
            const document = await this.omiseClient.get(`/disputes/${params.dispute_id}/documents/${params.document_id}`);
            return {
                success: true,
                data: document,
                message: `Dispute document retrieved successfully`
            };
        }
        catch (error) {
            this.logger.error('Failed to retrieve dispute document via MCP tool', error, { disputeId: params.dispute_id, documentId: params.document_id });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async uploadDisputeDocument(params) {
        try {
            this.logger.info('Uploading dispute document via MCP tool', { disputeId: params.dispute_id, filename: params.filename });
            if (!this.validateDisputeId(params.dispute_id)) {
                return {
                    success: false,
                    error: 'Invalid dispute ID format. Must be in format: dspt_xxxxxxxxxxxxxxxx'
                };
            }
            if (!this.validateBase64Content(params.content)) {
                return {
                    success: false,
                    error: 'Invalid document content. Must be valid base64 encoded data (max 10MB)'
                };
            }
            if (params.content_type && !this.validateContentType(params.content_type)) {
                return {
                    success: false,
                    error: 'Invalid content type. Must be one of: application/pdf, image/jpeg, image/png, image/gif, text/plain'
                };
            }
            const uploadData = {
                filename: params.filename,
                content: params.content,
                content_type: params.content_type || 'application/pdf',
                ...(params.description && { description: params.description })
            };
            const document = await this.omiseClient.post(`/disputes/${params.dispute_id}/documents`, uploadData);
            return {
                success: true,
                data: document,
                message: `Dispute document uploaded successfully with ID: ${document.id}`
            };
        }
        catch (error) {
            this.logger.error('Failed to upload dispute document via MCP tool', error, { disputeId: params.dispute_id, filename: params.filename });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async destroyDisputeDocument(params) {
        try {
            this.logger.info('Destroying dispute document via MCP tool', { disputeId: params.dispute_id, documentId: params.document_id });
            if (!this.validateDisputeId(params.dispute_id)) {
                return {
                    success: false,
                    error: 'Invalid dispute ID format. Must be in format: dspt_xxxxxxxxxxxxxxxx'
                };
            }
            if (!this.validateDocumentId(params.document_id)) {
                return {
                    success: false,
                    error: 'Invalid document ID format. Must be in format: docu_xxxxxxxxxxxxxxxx'
                };
            }
            if (!params.confirm) {
                return {
                    success: false,
                    error: 'Document deletion requires confirmation. Set confirm=true to proceed.'
                };
            }
            const document = await this.omiseClient.delete(`/disputes/${params.dispute_id}/documents/${params.document_id}`);
            return {
                success: true,
                data: document,
                message: `Dispute document deleted successfully`
            };
        }
        catch (error) {
            this.logger.error('Failed to destroy dispute document via MCP tool', error, { disputeId: params.dispute_id, documentId: params.document_id });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}
//# sourceMappingURL=dispute-tools.js.map