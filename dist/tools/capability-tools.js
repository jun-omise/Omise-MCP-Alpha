/**
 * Capability-related MCP Tools
 */
export class CapabilityTools {
    omiseClient;
    logger;
    constructor(omiseClient, logger) {
        this.omiseClient = omiseClient;
        this.logger = logger;
    }
    getTools() {
        return [
            {
                name: 'retrieve_capability',
                description: 'Retrieve Omise API capabilities and supported features',
                inputSchema: {
                    type: 'object',
                    properties: {
                        include_payment_methods: {
                            type: 'boolean',
                            description: 'Include detailed payment method information',
                            default: true
                        },
                        include_currencies: {
                            type: 'boolean',
                            description: 'Include supported currencies information',
                            default: true
                        },
                        include_features: {
                            type: 'boolean',
                            description: 'Include feature availability information',
                            default: true
                        }
                    }
                }
            }
        ];
    }
    // ============================================================================
    // Feature Limitation Check
    // ============================================================================
    checkFeatureAvailability(capability, feature) {
        if (!capability.features || !Array.isArray(capability.features)) {
            return false;
        }
        return capability.features.includes(feature);
    }
    checkPaymentMethodAvailability(capability, paymentMethod) {
        if (!capability.payment_methods || !Array.isArray(capability.payment_methods)) {
            return false;
        }
        return capability.payment_methods.some((method) => method.name === paymentMethod);
    }
    checkCurrencySupport(capability, currency) {
        if (!capability.currencies || !Array.isArray(capability.currencies)) {
            return false;
        }
        return capability.currencies.some((curr) => curr.code === currency.toUpperCase());
    }
    // ============================================================================
    // Payment Method Availability Check
    // ============================================================================
    getAvailablePaymentMethods(capability) {
        const result = {
            creditCards: [],
            internetBanking: [],
            convenienceStores: [],
            eWallets: [],
            installments: [],
            other: []
        };
        if (!capability.payment_methods) {
            return result;
        }
        for (const method of capability.payment_methods) {
            switch (method.type) {
                case 'credit_card':
                    result.creditCards.push(method.name);
                    break;
                case 'internet_banking':
                    result.internetBanking.push(method.name);
                    break;
                case 'convenience_store':
                    result.convenienceStores.push(method.name);
                    break;
                case 'e_wallet':
                    result.eWallets.push(method.name);
                    break;
                case 'installment':
                    result.installments.push(method.name);
                    break;
                default:
                    result.other.push(method.name);
            }
        }
        return result;
    }
    // ============================================================================
    // Feature Limitation Confirmation
    // ============================================================================
    checkCapabilityLimits(capability) {
        return {
            maxChargeAmount: capability.limits?.max_charge_amount || 0,
            maxTransferAmount: capability.limits?.max_transfer_amount || 0,
            maxRefundAmount: capability.limits?.max_refund_amount || 0,
            maxScheduleCount: capability.limits?.max_schedule_count || 0,
            maxWebhookEndpoints: capability.limits?.max_webhook_endpoints || 0,
            rateLimits: {
                requestsPerMinute: capability.rate_limits?.requests_per_minute || 0,
                requestsPerHour: capability.rate_limits?.requests_per_hour || 0,
                requestsPerDay: capability.rate_limits?.requests_per_day || 0
            }
        };
    }
    // ============================================================================
    // Currency Support Confirmation
    // ============================================================================
    getSupportedCurrencies(capability) {
        const currencies = capability.currencies?.map((curr) => curr.code) || [];
        const defaultCurrency = capability.default_currency || 'THB';
        const currencyDetails = currencies.map((code) => ({
            code,
            name: this.getCurrencyName(code),
            symbol: this.getCurrencySymbol(code),
            decimalPlaces: this.getCurrencyDecimalPlaces(code),
            minimumAmount: this.getCurrencyMinimumAmount(code)
        }));
        return {
            currencies,
            defaultCurrency,
            currencyDetails
        };
    }
    getCurrencyName(code) {
        const names = {
            'THB': 'Thai Baht',
            'USD': 'US Dollar',
            'JPY': 'Japanese Yen',
            'EUR': 'Euro',
            'GBP': 'British Pound',
            'SGD': 'Singapore Dollar',
            'HKD': 'Hong Kong Dollar',
            'AUD': 'Australian Dollar',
            'CAD': 'Canadian Dollar',
            'CHF': 'Swiss Franc',
            'CNY': 'Chinese Yuan'
        };
        return names[code] || code;
    }
    getCurrencySymbol(code) {
        const symbols = {
            'THB': '฿',
            'USD': '$',
            'JPY': '¥',
            'EUR': '€',
            'GBP': '£',
            'SGD': 'S$',
            'HKD': 'HK$',
            'AUD': 'A$',
            'CAD': 'C$',
            'CHF': 'CHF',
            'CNY': '¥'
        };
        return symbols[code] || code;
    }
    getCurrencyDecimalPlaces(code) {
        // Most currencies have 2 decimal places, JPY has 0
        return code === 'JPY' ? 0 : 2;
    }
    getCurrencyMinimumAmount(code) {
        const minimums = {
            'THB': 1, // 1 satang
            'USD': 1, // 1 cent
            'JPY': 1, // 1 yen
            'EUR': 1, // 1 cent
            'GBP': 1, // 1 penny
            'SGD': 1, // 1 cent
            'HKD': 1, // 1 cent
            'AUD': 1, // 1 cent
            'CAD': 1, // 1 cent
            'CHF': 1, // 1 cent
            'CNY': 1 // 1 cent
        };
        return minimums[code] || 1;
    }
    // ============================================================================
    // Tool Implementation
    // ============================================================================
    async retrieveCapability(params) {
        try {
            this.logger.info('Retrieving Omise capabilities via MCP tool', params);
            const capability = await this.omiseClient.get('/capability');
            // Add detailed information
            const enhancedCapability = {
                ...capability,
                availablePaymentMethods: this.getAvailablePaymentMethods(capability),
                capabilityLimits: this.checkCapabilityLimits(capability),
                supportedCurrencies: this.getSupportedCurrencies(capability),
                featureAvailability: {
                    charges: this.checkFeatureAvailability(capability, 'charges'),
                    customers: this.checkFeatureAvailability(capability, 'customers'),
                    cards: this.checkFeatureAvailability(capability, 'cards'),
                    tokens: this.checkFeatureAvailability(capability, 'tokens'),
                    transfers: this.checkFeatureAvailability(capability, 'transfers'),
                    recipients: this.checkFeatureAvailability(capability, 'recipients'),
                    refunds: this.checkFeatureAvailability(capability, 'refunds'),
                    disputes: this.checkFeatureAvailability(capability, 'disputes'),
                    schedules: this.checkFeatureAvailability(capability, 'schedules'),
                    links: this.checkFeatureAvailability(capability, 'links'),
                    sources: this.checkFeatureAvailability(capability, 'sources'),
                    webhooks: this.checkFeatureAvailability(capability, 'webhooks'),
                    events: this.checkFeatureAvailability(capability, 'events')
                }
            };
            return {
                success: true,
                data: enhancedCapability,
                message: `Omise capabilities retrieved successfully`
            };
        }
        catch (error) {
            this.logger.error('Failed to retrieve Omise capabilities via MCP tool', error, params);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}
//# sourceMappingURL=capability-tools.js.map