/**
 * Dynamic Tool Registry System
 *
 * This replaces the monolithic switch statement in main.ts with a dynamic,
 * extensible tool registration system inspired by Stripe's MCP patterns.
 */
import { Tool } from '@modelcontextprotocol/sdk/types';
import { BaseToolHandler } from './base-tool-handler';
import { Logger } from '../utils/logger';
import { RequestContext, ToolResult } from '../types/mcp';
export interface ToolHandler {
    name: string;
    description: string;
    inputSchema: any;
    execute(args: any, context: RequestContext): Promise<ToolResult>;
}
export declare class ToolRegistry {
    private tools;
    private logger;
    constructor(logger: Logger);
    /**
     * Register a tool handler
     */
    registerTool(tool: ToolHandler): void;
    /**
     * Register multiple tools at once
     */
    registerTools(tools: ToolHandler[]): void;
    /**
     * Register tools from BaseToolHandler instances
     */
    registerToolHandlers(handlers: BaseToolHandler[]): void;
    /**
     * Get a specific tool handler
     */
    getTool(name: string): ToolHandler | undefined;
    /**
     * Get all registered tools
     */
    getAllTools(): ToolHandler[];
    /**
     * Get tools as MCP Tool format for ListTools response
     */
    getMCPTools(): Tool[];
    /**
     * Execute a tool by name
     */
    executeTool(name: string, args: any, context: RequestContext): Promise<ToolResult>;
    /**
     * Check if a tool is registered
     */
    hasTool(name: string): boolean;
    /**
     * Get tool count
     */
    getToolCount(): number;
    /**
     * Get tools by category (based on name prefix)
     */
    getToolsByCategory(category: string): ToolHandler[];
    /**
     * Clear all registered tools (useful for testing)
     */
    clear(): void;
    /**
     * Get registry statistics
     */
    getStats(): {
        totalTools: number;
        categories: Record<string, number>;
        tools: string[];
    };
}
//# sourceMappingURL=tool-registry.d.ts.map