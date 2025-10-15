/**
 * Dynamic Tool Registry System
 *
 * This replaces the monolithic switch statement in main.ts with a dynamic,
 * extensible tool registration system inspired by Stripe's MCP patterns.
 */
export class ToolRegistry {
    tools = new Map();
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Register a tool handler
     */
    registerTool(tool) {
        if (this.tools.has(tool.name)) {
            this.logger.warn(`Tool ${tool.name} is already registered, overwriting`);
        }
        this.tools.set(tool.name, tool);
        this.logger.debug(`Registered tool: ${tool.name}`);
    }
    /**
     * Register multiple tools at once
     */
    registerTools(tools) {
        tools.forEach(tool => this.registerTool(tool));
    }
    /**
     * Register tools from BaseToolHandler instances
     */
    registerToolHandlers(handlers) {
        handlers.forEach(handler => {
            this.registerTool({
                name: handler.name,
                description: handler.description,
                inputSchema: handler.inputSchema,
                execute: handler.execute.bind(handler)
            });
        });
    }
    /**
     * Get a specific tool handler
     */
    getTool(name) {
        return this.tools.get(name);
    }
    /**
     * Get all registered tools
     */
    getAllTools() {
        return Array.from(this.tools.values());
    }
    /**
     * Get tools as MCP Tool format for ListTools response
     */
    getMCPTools() {
        return this.getAllTools().map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
        }));
    }
    /**
     * Execute a tool by name
     */
    async executeTool(name, args, context) {
        const tool = this.getTool(name);
        if (!tool) {
            throw new Error(`Unknown tool: ${name}`);
        }
        this.logger.info(`Executing tool: ${name}`, {
            requestId: context.requestId,
            args: args ? Object.keys(args) : []
        });
        try {
            return await tool.execute(args, context);
        }
        catch (error) {
            this.logger.error(`Tool execution failed: ${name}`, error, {
                requestId: context.requestId,
                args
            });
            throw error;
        }
    }
    /**
     * Check if a tool is registered
     */
    hasTool(name) {
        return this.tools.has(name);
    }
    /**
     * Get tool count
     */
    getToolCount() {
        return this.tools.size;
    }
    /**
     * Get tools by category (based on name prefix)
     */
    getToolsByCategory(category) {
        return this.getAllTools().filter(tool => tool.name.startsWith(category.toLowerCase()));
    }
    /**
     * Clear all registered tools (useful for testing)
     */
    clear() {
        this.tools.clear();
        this.logger.debug('Tool registry cleared');
    }
    /**
     * Get registry statistics
     */
    getStats() {
        const tools = this.getAllTools();
        const categories = {};
        tools.forEach(tool => {
            const category = tool.name.split('_')[0];
            categories[category] = (categories[category] || 0) + 1;
        });
        return {
            totalTools: tools.length,
            categories,
            tools: tools.map(t => t.name)
        };
    }
}
//# sourceMappingURL=tool-registry.js.map