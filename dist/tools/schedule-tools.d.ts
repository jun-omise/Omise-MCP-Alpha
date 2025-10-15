/**
 * Schedule-related MCP Tools
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
export declare class ScheduleTools {
    private omiseClient;
    private logger;
    constructor(omiseClient: OmiseClient, logger: Logger);
    getTools(): Tool[];
    private validateScheduleId;
    private validateCustomerId;
    private validateCurrency;
    private validateAmount;
    private validateTimezone;
    private validateScheduleDates;
    private validateSchedulePeriod;
    private sanitizeMetadata;
    createSchedule(params: any): Promise<ToolResult>;
    retrieveSchedule(params: any): Promise<ToolResult>;
    listSchedules(params: any): Promise<ToolResult>;
    destroySchedule(params: any): Promise<ToolResult>;
    listScheduleOccurrences(params: any): Promise<ToolResult>;
}
export {};
//# sourceMappingURL=schedule-tools.d.ts.map