/**
 * Event-related MCP Tools
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
export declare class EventTools {
    private omiseClient;
    private logger;
    constructor(omiseClient: OmiseClient, logger: Logger);
    getTools(): Tool[];
    private validateEventId;
    private validateEventType;
    private validateResourceKey;
    private validateDateRange;
    listEvents(params: any): Promise<ToolResult>;
    retrieveEvent(params: any): Promise<ToolResult>;
}
export {};
//# sourceMappingURL=event-tools.d.ts.map