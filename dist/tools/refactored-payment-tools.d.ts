/**
 * Refactored Payment Tools - Using New Architecture
 *
 * This demonstrates how to refactor existing tools to use the new
 * BaseToolHandler and dynamic registration system.
 */
import { JSONSchema7 } from 'json-schema';
import { BaseToolHandler } from '../core/base-tool-handler';
import { OmiseClient } from '../utils/omise-client';
import { Logger } from '../utils/logger';
import { RequestContext, ToolResult } from '../types/mcp';
/**
 * Create Charge Tool Handler
 */
export declare class CreateChargeTool extends BaseToolHandler {
    readonly name = "create_charge";
    readonly description = "Create a new charge for payment processing";
    readonly inputSchema: JSONSchema7;
    execute(args: any, context: RequestContext): Promise<ToolResult>;
}
/**
 * Retrieve Charge Tool Handler
 */
export declare class RetrieveChargeTool extends BaseToolHandler {
    readonly name = "retrieve_charge";
    readonly description = "Retrieve charge information by ID";
    readonly inputSchema: JSONSchema7;
    execute(args: any, context: RequestContext): Promise<ToolResult>;
}
/**
 * List Charges Tool Handler
 */
export declare class ListChargesTool extends BaseToolHandler {
    readonly name = "list_charges";
    readonly description = "List charges with optional filtering";
    readonly inputSchema: JSONSchema7;
    execute(args: any, context: RequestContext): Promise<ToolResult>;
}
/**
 * Update Charge Tool Handler
 */
export declare class UpdateChargeTool extends BaseToolHandler {
    readonly name = "update_charge";
    readonly description = "Update charge information (only for pending charges)";
    readonly inputSchema: JSONSchema7;
    execute(args: any, context: RequestContext): Promise<ToolResult>;
}
/**
 * Capture Charge Tool Handler
 */
export declare class CaptureChargeTool extends BaseToolHandler {
    readonly name = "capture_charge";
    readonly description = "Capture a previously authorized charge";
    readonly inputSchema: JSONSchema7;
    execute(args: any, context: RequestContext): Promise<ToolResult>;
}
/**
 * Reverse Charge Tool Handler
 */
export declare class ReverseChargeTool extends BaseToolHandler {
    readonly name = "reverse_charge";
    readonly description = "Reverse a charge (refund)";
    readonly inputSchema: JSONSchema7;
    execute(args: any, context: RequestContext): Promise<ToolResult>;
}
/**
 * Expire Charge Tool Handler
 */
export declare class ExpireChargeTool extends BaseToolHandler {
    readonly name = "expire_charge";
    readonly description = "Expire a pending charge";
    readonly inputSchema: JSONSchema7;
    execute(args: any, context: RequestContext): Promise<ToolResult>;
}
/**
 * Payment Tools Factory
 *
 * Creates and returns all payment tool handlers
 */
export declare class PaymentToolsFactory {
    static createTools(omiseClient: OmiseClient, logger: Logger): BaseToolHandler[];
}
//# sourceMappingURL=refactored-payment-tools.d.ts.map