/**
 * Event-related MCP Tools
 */
export class EventTools {
    omiseClient;
    logger;
    constructor(omiseClient, logger) {
        this.omiseClient = omiseClient;
        this.logger = logger;
    }
    getTools() {
        return [
            {
                name: 'list_events',
                description: 'List all events with optional filtering',
                inputSchema: {
                    type: 'object',
                    properties: {
                        limit: {
                            type: 'number',
                            description: 'Number of events to retrieve (default: 20, max: 100)',
                            minimum: 1,
                            maximum: 100,
                            default: 20
                        },
                        offset: {
                            type: 'number',
                            description: 'Number of events to skip (default: 0)',
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
                        type: {
                            type: 'string',
                            description: 'Filter by event type',
                            enum: [
                                'charge.create', 'charge.complete', 'charge.reverse',
                                'customer.create', 'customer.update', 'customer.destroy',
                                'card.create', 'card.update', 'card.destroy',
                                'transfer.create', 'transfer.update', 'transfer.destroy',
                                'recipient.create', 'recipient.update', 'recipient.destroy',
                                'refund.create', 'refund.destroy',
                                'dispute.create', 'dispute.update', 'dispute.accept',
                                'schedule.create', 'schedule.destroy',
                                'link.create', 'link.destroy'
                            ]
                        },
                        key: {
                            type: 'string',
                            description: 'Filter by resource key (e.g., charge ID, customer ID)'
                        },
                        livemode: {
                            type: 'boolean',
                            description: 'Filter by live mode (true for production, false for test)'
                        }
                    }
                }
            },
            {
                name: 'retrieve_event',
                description: 'Retrieve event information by ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        event_id: {
                            type: 'string',
                            description: 'Event ID to retrieve'
                        }
                    },
                    required: ['event_id']
                }
            }
        ];
    }
    // ============================================================================
    // Validation Functions
    // ============================================================================
    validateEventId(eventId) {
        // Omise event ID format: evnt_xxxxxxxxxxxxxxxx
        return /^evnt_[a-zA-Z0-9]{16}$/.test(eventId);
    }
    validateEventType(eventType) {
        const validTypes = [
            'charge.create', 'charge.complete', 'charge.reverse',
            'customer.create', 'customer.update', 'customer.destroy',
            'card.create', 'card.update', 'card.destroy',
            'transfer.create', 'transfer.update', 'transfer.destroy',
            'recipient.create', 'recipient.update', 'recipient.destroy',
            'refund.create', 'refund.destroy',
            'dispute.create', 'dispute.update', 'dispute.accept',
            'schedule.create', 'schedule.destroy',
            'link.create', 'link.destroy'
        ];
        return validTypes.includes(eventType);
    }
    validateResourceKey(key) {
        // Resource key format validation (charge, customer, card, transfer, recipient, refund, dispute, schedule, link)
        const resourcePatterns = [
            /^chrg_[a-zA-Z0-9]{16}$/, // charge
            /^cust_[a-zA-Z0-9]{16}$/, // customer
            /^card_[a-zA-Z0-9]{16}$/, // card
            /^trsf_[a-zA-Z0-9]{16}$/, // transfer
            /^rcpt_[a-zA-Z0-9]{16}$/, // recipient
            /^rfnd_[a-zA-Z0-9]{16}$/, // refund
            /^dspt_[a-zA-Z0-9]{16}$/, // dispute
            /^schd_[a-zA-Z0-9]{16}$/, // schedule
            /^link_[a-zA-Z0-9]{16}$/ // link
        ];
        return resourcePatterns.some(pattern => pattern.test(key));
    }
    validateDateRange(from, to) {
        if (from && to) {
            const fromDate = new Date(from);
            const toDate = new Date(to);
            if (fromDate >= toDate) {
                return { valid: false, error: 'From date must be before to date' };
            }
            // Date range is limited to within 1 year
            const oneYearFromFrom = new Date(fromDate);
            oneYearFromFrom.setFullYear(oneYearFromFrom.getFullYear() + 1);
            if (toDate > oneYearFromFrom) {
                return { valid: false, error: 'Date range must be within one year' };
            }
        }
        return { valid: true };
    }
    // ============================================================================
    // Tool Implementation
    // ============================================================================
    async listEvents(params) {
        try {
            this.logger.info('Listing events via MCP tool', params);
            // Validation
            if (params.type && !this.validateEventType(params.type)) {
                return {
                    success: false,
                    error: 'Invalid event type. Must be one of the supported event types.'
                };
            }
            if (params.key && !this.validateResourceKey(params.key)) {
                return {
                    success: false,
                    error: 'Invalid resource key format. Must be a valid Omise resource ID.'
                };
            }
            const dateValidation = this.validateDateRange(params.from, params.to);
            if (!dateValidation.valid) {
                return {
                    success: false,
                    error: dateValidation.error
                };
            }
            // Parameter validation and default value setting
            const queryParams = {
                limit: Math.min(params.limit || 20, 100),
                offset: Math.max(params.offset || 0, 0),
                order: params.order || 'chronological',
                ...(params.from && { from: params.from }),
                ...(params.to && { to: params.to }),
                ...(params.type && { type: params.type }),
                ...(params.key && { key: params.key }),
                ...(params.livemode !== undefined && { livemode: params.livemode })
            };
            const events = await this.omiseClient.get('/events', queryParams);
            return {
                success: true,
                data: events,
                message: `Retrieved ${events.data.length} events (total: ${events.total})`
            };
        }
        catch (error) {
            this.logger.error('Failed to list events via MCP tool', error, params);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async retrieveEvent(params) {
        try {
            this.logger.info('Retrieving event via MCP tool', { eventId: params.event_id });
            if (!this.validateEventId(params.event_id)) {
                return {
                    success: false,
                    error: 'Invalid event ID format. Must be in format: evnt_xxxxxxxxxxxxxxxx'
                };
            }
            const event = await this.omiseClient.get(`/events/${params.event_id}`);
            return {
                success: true,
                data: event,
                message: `Event retrieved successfully`
            };
        }
        catch (error) {
            this.logger.error('Failed to retrieve event via MCP tool', error, { eventId: params.event_id });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}
//# sourceMappingURL=event-tools.js.map