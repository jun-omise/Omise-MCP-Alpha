/**
 * Omise API v2017-11-02 Comprehensive Type Definitions
 */
export interface OmiseConfig {
    publicKey: string;
    secretKey: string;
    environment: 'production' | 'test';
    apiVersion: string;
}
export interface OmiseError {
    object: 'error';
    location: string;
    code: string;
    message: string;
}
export interface OmiseResponse<T> {
    object: string;
    data?: T;
    error?: OmiseError;
}
export interface OmiseListResponse<T> {
    object: 'list';
    data: T[];
    total: number;
    limit: number;
    offset: number;
    order: 'chronological' | 'reverse_chronological';
    location: string;
}
export interface OmiseBaseObject {
    id: string;
    object: string;
    livemode: boolean;
    location: string;
    created: string;
    created_at: string;
    updated_at: string;
}
export interface OmiseMetadata {
    [key: string]: string | number | boolean | null;
}
export interface OmiseCharge extends OmiseBaseObject {
    object: 'charge';
    amount: number;
    currency: string;
    description?: string;
    status: 'pending' | 'failed' | 'successful';
    capture: boolean;
    authorized: boolean;
    paid: boolean;
    transaction?: string;
    card?: OmiseCard;
    source?: OmiseSource;
    customer?: string;
    ip?: string;
    failure_code?: string;
    failure_message?: string;
    return_uri?: string;
    authorize_uri?: string;
    metadata?: OmiseMetadata;
}
export interface OmiseCustomer extends OmiseBaseObject {
    object: 'customer';
    default_card?: string;
    email?: string;
    description?: string;
    metadata?: OmiseMetadata;
    cards?: OmiseListResponse<OmiseCard>;
}
export interface OmiseCard extends OmiseBaseObject {
    object: 'card';
    country: string;
    city?: string;
    postal_code?: string;
    financing: string;
    bank: string;
    last_digits: string;
    brand: string;
    expiration_month: number;
    expiration_year: number;
    fingerprint: string;
    name?: string;
    security_code_check: boolean;
}
export interface OmiseToken extends OmiseBaseObject {
    object: 'token';
    used: boolean;
    card: OmiseCard;
}
export interface OmiseTransfer extends OmiseBaseObject {
    object: 'transfer';
    amount: number;
    currency: string;
    sent: boolean;
    paid: boolean;
    sendable: boolean;
    failure_code?: string;
    failure_message?: string;
    transaction?: string;
    metadata?: OmiseMetadata;
}
export interface OmiseRecipient extends OmiseBaseObject {
    object: 'recipient';
    verified: boolean;
    active: boolean;
    name: string;
    email?: string;
    description?: string;
    type: 'individual' | 'corporation';
    tax_id?: string;
    bank_account?: OmiseBankAccount;
    failure_code?: string;
    metadata?: OmiseMetadata;
}
export interface OmiseBankAccount {
    object: 'bank_account';
    brand: string;
    last_digits: string;
    name: string;
    created: string;
}
export interface OmiseTransaction extends OmiseBaseObject {
    object: 'transaction';
    type: 'credit' | 'debit';
    amount: number;
    currency: string;
    direction: 'credit' | 'debit';
    key: string;
    origin?: string;
    transferable?: string;
    created_at: string;
}
export interface OmiseRefund extends OmiseBaseObject {
    object: 'refund';
    amount: number;
    currency: string;
    charge: string;
    transaction?: string;
    voided: boolean;
    metadata?: OmiseMetadata;
}
export interface OmiseDispute extends OmiseBaseObject {
    object: 'dispute';
    amount: number;
    currency: string;
    status: 'open' | 'pending' | 'closed';
    message?: string;
    charge: string;
    admin_message?: string;
    reason_code?: string;
    reason_message?: string;
    admin_reason_code?: string;
    admin_reason_message?: string;
    documents?: OmiseDisputeDocument[];
    metadata?: OmiseMetadata;
}
export interface OmiseDisputeDocument {
    object: 'dispute_document';
    filename: string;
    created: string;
}
export interface OmiseEvent extends OmiseBaseObject {
    object: 'event';
    key: string;
    data: OmiseEventData;
}
export interface OmiseEventData {
    object: string;
    id: string;
    livemode: boolean;
    created: string;
}
export interface OmiseSchedule extends OmiseBaseObject {
    object: 'schedule';
    status: 'active' | 'expiring' | 'expired' | 'deleted' | 'suspended';
    every: number;
    period: 'day' | 'week' | 'month';
    on?: OmiseScheduleOn;
    in_words?: string;
    start_date: string;
    end_date?: string;
    next_occurrence_on?: string;
    occurrences?: OmiseListResponse<OmiseOccurrence>;
    occurrences_total?: number;
    metadata?: OmiseMetadata;
}
export interface OmiseScheduleOn {
    weekdays?: number[];
    days_of_month?: number[];
}
export interface OmiseOccurrence extends OmiseBaseObject {
    object: 'occurrence';
    schedule: string;
    processed_at?: string;
    scheduled_on: string;
    retry_date?: string;
    status: 'successful' | 'failed' | 'skipped';
    message?: string;
    result?: string;
}
export interface OmiseLink extends OmiseBaseObject {
    object: 'link';
    amount: number;
    currency: string;
    used: boolean;
    used_at?: string;
    description?: string;
    title?: string;
    link_type: 'payment';
    payment_uri: string;
    charges?: OmiseListResponse<OmiseCharge>;
    metadata?: OmiseMetadata;
}
export interface OmiseSource extends OmiseBaseObject {
    object: 'source';
    type: string;
    flow: string;
    amount: number;
    currency: string;
    charge_status: 'unknown' | 'failed' | 'expired' | 'pending' | 'reversed' | 'successful';
    receipt?: OmiseReceipt;
    references?: OmiseReferences;
    metadata?: OmiseMetadata;
}
export interface OmiseReceipt {
    number?: string;
    method?: string;
    reference?: string;
    reference_number?: string;
    reference_type?: string;
    customer_reference?: string;
    customer_reference_number?: string;
    customer_reference_type?: string;
    authorization_code?: string;
    note?: string;
    subnote?: string;
    note_th?: string;
    subnote_th?: string;
}
export interface OmiseReferences {
    [key: string]: string;
}
export interface OmiseCapability extends OmiseBaseObject {
    object: 'capability';
    banks: OmiseBank[];
    payment_methods: OmisePaymentMethod[];
}
export interface OmiseBank {
    code: string;
    name: string;
    active: boolean;
    country: string;
    currency: string;
    installment_terms: number[];
}
export interface OmisePaymentMethod {
    currency: string;
    supported_currencies: string[];
    country_codes: string[];
    installment_terms: number[];
    banks: string[];
}
export interface OmiseChain extends OmiseBaseObject {
    object: 'chain';
    revoked: boolean;
    email: string;
    key: string;
    webhook_uri?: string;
    metadata?: OmiseMetadata;
}
export interface CreateChargeRequest {
    amount: number;
    currency: string;
    description?: string;
    capture?: boolean;
    card?: string;
    customer?: string;
    source?: string;
    return_uri?: string;
    metadata?: OmiseMetadata;
}
export interface CreateCustomerRequest {
    email?: string;
    description?: string;
    card?: string;
    metadata?: OmiseMetadata;
}
export interface CreateTokenRequest {
    card: {
        name: string;
        number: string;
        expiration_month: number;
        expiration_year: number;
        city?: string;
        postal_code?: string;
        security_code?: string;
    };
}
export interface CreateTransferRequest {
    amount: number;
    recipient: string;
    metadata?: OmiseMetadata;
}
export interface CreateRecipientRequest {
    name: string;
    email?: string;
    description?: string;
    type: 'individual' | 'corporation';
    tax_id?: string;
    bank_account: {
        brand: string;
        number: string;
        name: string;
    };
    metadata?: OmiseMetadata;
}
export interface CreateRefundRequest {
    amount?: number;
    metadata?: OmiseMetadata;
}
export interface CreateLinkRequest {
    amount: number;
    currency: string;
    description?: string;
    title?: string;
    metadata?: OmiseMetadata;
}
export interface CreateSourceRequest {
    type: string;
    amount: number;
    currency: string;
    metadata?: OmiseMetadata;
}
export interface CreateScheduleRequest {
    every: number;
    period: 'day' | 'week' | 'month';
    on?: OmiseScheduleOn;
    start_date: string;
    end_date?: string;
    charge: {
        customer: string;
        amount: number;
        currency: string;
        description?: string;
    };
    metadata?: OmiseMetadata;
}
export interface UpdateCustomerRequest {
    email?: string;
    description?: string;
    default_card?: string;
    metadata?: OmiseMetadata;
}
export interface UpdateRecipientRequest {
    name?: string;
    email?: string;
    description?: string;
    tax_id?: string;
    bank_account?: {
        brand: string;
        number: string;
        name: string;
    };
    metadata?: OmiseMetadata;
}
export interface UpdateScheduleRequest {
    every?: number;
    period?: 'day' | 'week' | 'month';
    on?: OmiseScheduleOn;
    end_date?: string;
    metadata?: OmiseMetadata;
}
export interface OmiseSearchParams {
    limit?: number;
    offset?: number;
    order?: 'chronological' | 'reverse_chronological';
    from?: string;
    to?: string;
}
export interface OmiseChargeSearchParams extends OmiseSearchParams {
    status?: 'pending' | 'failed' | 'successful';
    customer?: string;
    card?: string;
}
export interface OmiseTransactionSearchParams extends OmiseSearchParams {
    type?: 'credit' | 'debit';
    direction?: 'credit' | 'debit';
}
export interface OmiseDisputeSearchParams extends OmiseSearchParams {
    status?: 'open' | 'pending' | 'closed';
}
export interface OmiseWebhook {
    object: 'webhook';
    id: string;
    livemode: boolean;
    location: string;
    url: string;
    disabled: boolean;
    created: string;
    created_at: string;
    updated_at: string;
}
export interface OmiseWebhookEndpoint extends OmiseBaseObject {
    object: 'webhook_endpoint';
    url: string;
    disabled: boolean;
    events: string[];
}
export interface CreateWebhookEndpointRequest {
    url: string;
    events: string[];
    disabled?: boolean;
    metadata?: OmiseMetadata;
}
export interface UpdateWebhookEndpointRequest {
    url?: string;
    events?: string[];
    disabled?: boolean;
    metadata?: OmiseMetadata;
}
export interface CreateDisputeRequest {
    charge: string;
    amount?: number;
    reason?: string;
    metadata?: OmiseMetadata;
}
export interface UpdateDisputeRequest {
    message?: string;
    metadata?: OmiseMetadata;
}
export interface CreateEventRequest {
    type: string;
    data: any;
    metadata?: OmiseMetadata;
}
export interface CreateChainRequest {
    name: string;
    description?: string;
    steps: OmiseChainStep[];
    metadata?: OmiseMetadata;
}
export interface CreateCapabilityRequest {
    name: string;
    description?: string;
    features: string[];
    metadata?: OmiseMetadata;
}
export interface OmiseChainRevision extends OmiseBaseObject {
    object: 'chain_revision';
    chain: string;
    step_id: string;
    status: 'pending' | 'completed' | 'failed';
    result?: any;
    error?: string;
}
export interface OmiseChainStep {
    id: string;
    action: string;
    parameters?: any;
    condition?: any;
}
export interface OmiseScheduleOccurrence extends OmiseBaseObject {
    object: 'schedule_occurrence';
    schedule: string;
    processed_at: string;
    status: 'successful' | 'failed';
    result?: any;
    error?: string;
}
export interface OmiseCapability extends OmiseBaseObject {
    object: 'capability';
    features: string[];
    payment_methods: OmisePaymentMethod[];
    currencies: OmiseCurrency[];
    default_currency: string;
    limits: {
        max_charge_amount: number;
        max_transfer_amount: number;
        max_refund_amount: number;
        max_schedule_count: number;
        max_webhook_endpoints: number;
    };
    rate_limits: {
        requests_per_minute: number;
        requests_per_hour: number;
        requests_per_day: number;
    };
}
export interface OmisePaymentMethod {
    name: string;
    type: string;
    supported_currencies: string[];
    supported_countries: string[];
    features: string[];
}
export interface OmiseCurrency {
    code: string;
    name: string;
    symbol: string;
    exponent: number;
    supported: boolean;
}
export interface CreateWebhookRequest {
    url: string;
    metadata?: OmiseMetadata;
}
export interface UpdateWebhookRequest {
    url?: string;
    disabled?: boolean;
    metadata?: OmiseMetadata;
}
//# sourceMappingURL=omise.d.ts.map