/**
 * Chain Transaction-related MCP Tools
 */

// MCP Tool Type Definition
interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}
import { OmiseClient } from '../utils/omise-client.js';
import { Logger } from '../utils/logger.js';
import type { ToolResult } from '../types/mcp.js';
import type {
  CreateChainRequest,
  OmiseChain,
  OmiseChainRevision,
  OmiseListResponse,
  OmiseMetadata,
} from '../types/omise.js';

export class ChainTools {
  private omiseClient: OmiseClient;
  private logger: Logger;

  constructor(omiseClient: OmiseClient, logger: Logger) {
    this.omiseClient = omiseClient;
    this.logger = logger;
  }

  getTools(): Tool[] {
    return [
      {
        name: 'create_chain',
        description: 'Create a new payment chain',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Chain name',
              maxLength: 255
            },
            description: {
              type: 'string',
              description: 'Chain description',
              maxLength: 1000
            },
            steps: {
              type: 'array',
              description: 'Chain execution steps',
              items: {
                type: 'object',
                properties: {
                  step_id: {
                    type: 'string',
                    description: 'Unique step identifier',
                    maxLength: 50
                  },
                  action: {
                    type: 'string',
                    description: 'Action to perform',
                    enum: ['charge', 'transfer', 'refund', 'schedule', 'webhook']
                  },
                  parameters: {
                    type: 'object',
                    description: 'Action parameters'
                  },
                  conditions: {
                    type: 'array',
                    description: 'Execution conditions',
                    items: {
                      type: 'object',
                      properties: {
                        field: {
                          type: 'string',
                          description: 'Field to check'
                        },
                        operator: {
                          type: 'string',
                          description: 'Comparison operator',
                          enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'exists']
                        },
                        value: {
                          type: 'string',
                          description: 'Value to compare against'
                        }
                      },
                      required: ['field', 'operator']
                    }
                  },
                  on_failure: {
                    type: 'string',
                    description: 'Action on failure',
                    enum: ['stop', 'continue', 'rollback', 'retry'],
                    default: 'stop'
                  },
                  retry_count: {
                    type: 'number',
                    description: 'Number of retry attempts',
                    minimum: 0,
                    maximum: 5,
                    default: 0
                  },
                  timeout: {
                    type: 'number',
                    description: 'Step timeout in seconds',
                    minimum: 1,
                    maximum: 300,
                    default: 30
                  }
                },
                required: ['step_id', 'action', 'parameters']
              },
              minItems: 1
            },
            rollback_steps: {
              type: 'array',
              description: 'Rollback steps for chain failure',
              items: {
                type: 'object',
                properties: {
                  step_id: {
                    type: 'string',
                    description: 'Step ID to rollback'
                  },
                  action: {
                    type: 'string',
                    description: 'Rollback action',
                    enum: ['refund', 'reverse_transfer', 'cancel_schedule', 'webhook']
                  },
                  parameters: {
                    type: 'object',
                    description: 'Rollback action parameters'
                  }
                },
                required: ['step_id', 'action']
              }
            },
            timeout: {
              type: 'number',
              description: 'Overall chain timeout in seconds',
              minimum: 30,
              maximum: 3600,
              default: 300
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata for the chain',
              additionalProperties: {
                type: 'string'
              }
            }
          },
          required: ['name', 'steps']
        }
      },
      {
        name: 'retrieve_chain',
        description: 'Retrieve chain information by ID',
        inputSchema: {
          type: 'object',
          properties: {
            chain_id: {
              type: 'string',
              description: 'Chain ID to retrieve'
            }
          },
          required: ['chain_id']
        }
      },
      {
        name: 'list_chains',
        description: 'List all chains with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of chains to retrieve (default: 20, max: 100)',
              minimum: 1,
              maximum: 100,
              default: 20
            },
            offset: {
              type: 'number',
              description: 'Number of chains to skip (default: 0)',
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
            status: {
              type: 'string',
              description: 'Filter by chain status',
              enum: ['pending', 'running', 'completed', 'failed', 'cancelled']
            }
          }
        }
      },
      {
        name: 'list_chain_revisions',
        description: 'List chain execution history and revisions',
        inputSchema: {
          type: 'object',
          properties: {
            chain_id: {
              type: 'string',
              description: 'Chain ID to get revisions for'
            },
            limit: {
              type: 'number',
              description: 'Number of revisions to retrieve (default: 20, max: 100)',
              minimum: 1,
              maximum: 100,
              default: 20
            },
            offset: {
              type: 'number',
              description: 'Number of revisions to skip (default: 0)',
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
            step_id: {
              type: 'string',
              description: 'Filter by specific step ID'
            }
          },
          required: ['chain_id']
        }
      }
    ];
  }

  // ============================================================================
  // Validation Functions
  // ============================================================================

  private validateChainId(chainId: string): boolean {
    // Omise chain ID format: chn_xxxxxxxxxxxxxxxx
    return /^chn_[a-zA-Z0-9]{16}$/.test(chainId);
  }

  private validateStepId(stepId: string): boolean {
    // Step ID can only contain alphanumeric characters and underscores
    return /^[a-zA-Z0-9_]{1,50}$/.test(stepId);
  }

  private validateSteps(steps: any[]): { valid: boolean; error?: string } {
    if (!Array.isArray(steps) || steps.length === 0) {
      return { valid: false, error: 'Steps must be a non-empty array' };
    }

    const stepIds = new Set();
    for (const step of steps) {
      if (!step.step_id || !this.validateStepId(step.step_id)) {
        return { valid: false, error: 'Invalid step_id format. Must be 1-50 alphanumeric characters and underscores.' };
      }

      if (stepIds.has(step.step_id)) {
        return { valid: false, error: `Duplicate step_id: ${step.step_id}` };
      }
      stepIds.add(step.step_id);

      const validActions = ['charge', 'transfer', 'refund', 'schedule', 'webhook'];
      if (!validActions.includes(step.action)) {
        return { valid: false, error: `Invalid action: ${step.action}. Must be one of: ${validActions.join(', ')}` };
      }

      if (!step.parameters || typeof step.parameters !== 'object') {
        return { valid: false, error: 'Each step must have parameters object' };
      }

      if (step.conditions) {
        const conditionsValidation = this.validateConditions(step.conditions);
        if (!conditionsValidation.valid) {
          return { valid: false, error: conditionsValidation.error };
        }
      }

      if (step.retry_count && (step.retry_count < 0 || step.retry_count > 5)) {
        return { valid: false, error: 'Retry count must be between 0 and 5' };
      }

      if (step.timeout && (step.timeout < 1 || step.timeout > 300)) {
        return { valid: false, error: 'Step timeout must be between 1 and 300 seconds' };
      }
    }

    return { valid: true };
  }

  private validateConditions(conditions: any[]): { valid: boolean; error?: string } {
    if (!Array.isArray(conditions)) {
      return { valid: false, error: 'Conditions must be an array' };
    }

    for (const condition of conditions) {
      if (!condition.field || typeof condition.field !== 'string') {
        return { valid: false, error: 'Each condition must have a field' };
      }

      const validOperators = ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'exists'];
      if (!validOperators.includes(condition.operator)) {
        return { valid: false, error: `Invalid operator: ${condition.operator}. Must be one of: ${validOperators.join(', ')}` };
      }

      if (condition.operator !== 'exists' && condition.value === undefined) {
        return { valid: false, error: 'Value is required for all operators except "exists"' };
      }
    }

    return { valid: true };
  }

  private validateRollbackSteps(rollbackSteps: any[], originalSteps: any[]): { valid: boolean; error?: string } {
    if (!Array.isArray(rollbackSteps)) {
      return { valid: false, error: 'Rollback steps must be an array' };
    }

    const originalStepIds = new Set(originalSteps.map(step => step.step_id));
    for (const rollbackStep of rollbackSteps) {
      if (!rollbackStep.step_id) {
        return { valid: false, error: 'Each rollback step must have a step_id' };
      }

      if (!originalStepIds.has(rollbackStep.step_id)) {
        return { valid: false, error: `Rollback step_id ${rollbackStep.step_id} does not exist in original steps` };
      }

      const validRollbackActions = ['refund', 'reverse_transfer', 'cancel_schedule', 'webhook'];
      if (!validRollbackActions.includes(rollbackStep.action)) {
        return { valid: false, error: `Invalid rollback action: ${rollbackStep.action}. Must be one of: ${validRollbackActions.join(', ')}` };
      }
    }

    return { valid: true };
  }

  private sanitizeMetadata(metadata: any): OmiseMetadata | undefined {
    if (!metadata || typeof metadata !== 'object') return undefined;
    
    const sanitized: OmiseMetadata = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (value === null) {
        sanitized[key] = null;
      }
    }
    
    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  // ============================================================================
  // Chain Execution Management
  // ============================================================================

  private async executeChainStep(step: any, context: any): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      this.logger.info(`Executing chain step: ${step.step_id}`, { action: step.action });

      // Condition check
      if (step.conditions) {
        const conditionsMet = await this.checkConditions(step.conditions, context);
        if (!conditionsMet) {
          this.logger.info(`Step ${step.step_id} conditions not met, skipping`);
          return { success: true, result: { skipped: true, reason: 'conditions_not_met' } };
        }
      }

      // Execute action
      let result;
      switch (step.action) {
        case 'charge':
          result = await this.executeChargeAction(step.parameters, context);
          break;
        case 'transfer':
          result = await this.executeTransferAction(step.parameters, context);
          break;
        case 'refund':
          result = await this.executeRefundAction(step.parameters, context);
          break;
        case 'schedule':
          result = await this.executeScheduleAction(step.parameters, context);
          break;
        case 'webhook':
          result = await this.executeWebhookAction(step.parameters, context);
          break;
        default:
          throw new Error(`Unknown action: ${step.action}`);
      }

      return { success: true, result };
    } catch (error) {
      this.logger.error(`Chain step ${step.step_id} failed`, error as Error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async checkConditions(conditions: any[], context: any): Promise<boolean> {
    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(condition.field, context);
      const conditionMet = this.evaluateCondition(fieldValue, condition.operator, condition.value);
      
      if (!conditionMet) {
        return false;
      }
    }
    return true;
  }

  private getFieldValue(field: string, context: any): any {
    // ドット記法でネストされたフィールドにアクセス
    return field.split('.').reduce((obj, key) => obj?.[key], context);
  }

  private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'not_equals':
        return fieldValue !== expectedValue;
      case 'greater_than':
        return Number(fieldValue) > Number(expectedValue);
      case 'less_than':
        return Number(fieldValue) < Number(expectedValue);
      case 'contains':
        return String(fieldValue).includes(String(expectedValue));
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return false;
    }
  }

  private async executeChargeAction(parameters: any, context: any): Promise<any> {
    // チャージ実行のロジック
    this.logger.info('Executing charge action', parameters);
    // 実際の実装では、Omise APIを呼び出してチャージを作成
    return { action: 'charge', parameters, context };
  }

  private async executeTransferAction(parameters: any, context: any): Promise<any> {
    // 送金実行のロジック
    this.logger.info('Executing transfer action', parameters);
    return { action: 'transfer', parameters, context };
  }

  private async executeRefundAction(parameters: any, context: any): Promise<any> {
    // 返金実行のロジック
    this.logger.info('Executing refund action', parameters);
    return { action: 'refund', parameters, context };
  }

  private async executeScheduleAction(parameters: any, context: any): Promise<any> {
    // スケジュール実行のロジック
    this.logger.info('Executing schedule action', parameters);
    return { action: 'schedule', parameters, context };
  }

  private async executeWebhookAction(parameters: any, context: any): Promise<any> {
    // Webhook実行のロジック
    this.logger.info('Executing webhook action', parameters);
    return { action: 'webhook', parameters, context };
  }

  // ============================================================================
  // ツール実装
  // ============================================================================

  async createChain(params: any): Promise<ToolResult> {
    try {
      this.logger.info('Creating payment chain via MCP tool', { name: params.name, stepsCount: params.steps.length });

      // バリデーション
      const stepsValidation = this.validateSteps(params.steps);
      if (!stepsValidation.valid) {
        return {
          success: false,
          error: stepsValidation.error
        };
      }

      if (params.rollback_steps) {
        const rollbackValidation = this.validateRollbackSteps(params.rollback_steps, params.steps);
        if (!rollbackValidation.valid) {
          return {
            success: false,
            error: rollbackValidation.error
          };
        }
      }

      if (params.timeout && (params.timeout < 30 || params.timeout > 3600)) {
        return {
          success: false,
          error: 'Chain timeout must be between 30 and 3600 seconds'
        };
      }

      const chainParams: CreateChainRequest = {
        name: params.name,
        description: params.description,
        steps: params.steps,
        rollback_steps: params.rollback_steps,
        timeout: params.timeout || 300,
        metadata: this.sanitizeMetadata(params.metadata)
      };

      const chain = await this.omiseClient.post<OmiseChain>('/chains', chainParams);

      return {
        success: true,
        data: chain,
        message: `Payment chain created successfully with ID: ${chain.id}`
      };
    } catch (error) {
      this.logger.error('Failed to create payment chain via MCP tool', error as Error, params);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async retrieveChain(params: any): Promise<ToolResult> {
    try {
      this.logger.info('Retrieving payment chain via MCP tool', { chainId: params.chain_id });

      if (!this.validateChainId(params.chain_id)) {
        return {
          success: false,
          error: 'Invalid chain ID format. Must be in format: chn_xxxxxxxxxxxxxxxx'
        };
      }

      const chain = await this.omiseClient.get<OmiseChain>(`/chains/${params.chain_id}`);

      return {
        success: true,
        data: chain,
        message: `Payment chain retrieved successfully`
      };
    } catch (error) {
      this.logger.error('Failed to retrieve payment chain via MCP tool', error as Error, { chainId: params.chain_id });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async listChains(params: any): Promise<ToolResult> {
    try {
      this.logger.info('Listing payment chains via MCP tool', params);

      // パラメータのバリデーションとデフォルト値設定
      const queryParams = {
        limit: Math.min(params.limit || 20, 100),
        offset: Math.max(params.offset || 0, 0),
        order: params.order || 'chronological',
        ...(params.from && { from: params.from }),
        ...(params.to && { to: params.to }),
        ...(params.status && { status: params.status })
      };

      const chains = await this.omiseClient.get<OmiseListResponse<OmiseChain>>('/chains', queryParams);

      return {
        success: true,
        data: chains,
        message: `Retrieved ${chains.data.length} payment chains (total: ${chains.total})`
      };
    } catch (error) {
      this.logger.error('Failed to list payment chains via MCP tool', error as Error, params);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async listChainRevisions(params: any): Promise<ToolResult> {
    try {
      this.logger.info('Listing chain revisions via MCP tool', { chainId: params.chain_id });

      if (!this.validateChainId(params.chain_id)) {
        return {
          success: false,
          error: 'Invalid chain ID format. Must be in format: chn_xxxxxxxxxxxxxxxx'
        };
      }

      // パラメータのバリデーションとデフォルト値設定
      const queryParams = {
        limit: Math.min(params.limit || 20, 100),
        offset: Math.max(params.offset || 0, 0),
        order: params.order || 'chronological',
        ...(params.from && { from: params.from }),
        ...(params.to && { to: params.to }),
        ...(params.step_id && { step_id: params.step_id })
      };

      const revisions = await this.omiseClient.get<OmiseListResponse<OmiseChainRevision>>(`/chains/${params.chain_id}/revisions`, queryParams);

      return {
        success: true,
        data: revisions,
        message: `Retrieved ${revisions.data.length} chain revisions (total: ${revisions.total})`
      };
    } catch (error) {
      this.logger.error('Failed to list chain revisions via MCP tool', error as Error, { chainId: params.chain_id });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
