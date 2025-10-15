/**
 * Chain Transaction-related MCP Tools
 */
interface Tool {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties?: Record<string, any>;
        required?: string[];
    };
}
import { OmiseClient } from '../utils/omise-client';
import { Logger } from '../utils/logger';
import { ToolResult } from '../types/mcp';
export declare class ChainTools {
    private omiseClient;
    private logger;
    constructor(omiseClient: OmiseClient, logger: Logger);
    getTools(): Tool[];
    private validateChainId;
    private validateStepId;
    private validateSteps;
    private validateConditions;
    private validateRollbackSteps;
    private sanitizeMetadata;
    private executeChainStep;
    private checkConditions;
    private getFieldValue;
    private evaluateCondition;
    private executeChargeAction;
    private executeTransferAction;
    private executeRefundAction;
    private executeScheduleAction;
    private executeWebhookAction;
    createChain(params: any): Promise<ToolResult>;
    retrieveChain(params: any): Promise<ToolResult>;
    listChains(params: any): Promise<ToolResult>;
    listChainRevisions(params: any): Promise<ToolResult>;
}
export {};
//# sourceMappingURL=chain-tools.d.ts.map