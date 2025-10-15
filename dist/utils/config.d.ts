/**
 * Configuration Management
 */
import { ServerConfig } from '../types/mcp';
export declare function loadConfig(): ServerConfig;
export declare function validateOmiseKeys(config: ServerConfig): void;
export declare function getServerInfo(config: ServerConfig): {
    name: string;
    version: string;
    description: string;
    capabilities: {
        tools: string[];
        resources: string[];
    };
    supportedTools: string[];
    supportedResources: string[];
};
//# sourceMappingURL=config.d.ts.map