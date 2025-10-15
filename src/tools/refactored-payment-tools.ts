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
import { MCPError, ErrorCode } from '../types/errors';
import { 
  CreateChargeRequest, 
  OmiseCharge, 
  OmiseListResponse,
  OmiseMetadata 
} from '../types/omise';

/**
 * Create Charge Tool Handler
 */
export class CreateChargeTool extends BaseToolHandler {
  readonly name = 'create_charge';
  readonly description = 'Create a new charge for payment processing';
  readonly inputSchema: JSONSchema7 = {
    type: 'object',
    properties: {
      amount: {
        type: 'number',
        description: 'Amount in the smallest currency unit (satang for THB, cents for USD)',
        minimum: 1
      },
      currency: {
        type: 'string',
        description: 'Currency code (THB, USD, JPY, etc.)',
        pattern: '^[A-Z]{3}$'
      },
      description: {
        type: 'string',
        description: 'Description of the charge',
        maxLength: 255
      },
      customer: {
        type: 'string',
        description: 'Customer ID for the charge'
      },
      card: {
        type: 'string',
        description: 'Card token for payment'
      },
      source: {
        type: 'string',
        description: 'Source ID for payment'
      },
      capture: {
        type: 'boolean',
        description: 'Whether to capture the charge immediately (default: true)',
        default: true
      },
      return_uri: {
        type: 'string',
        description: 'Return URI for 3D Secure authentication',
        format: 'uri'
      },
      metadata: {
        type: 'object',
        description: 'Additional metadata for the charge',
        additionalProperties: {
          type: 'string'
        }
      }
    },
    required: ['amount', 'currency']
  };

  async execute(args: any, context: RequestContext): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      this.logExecutionStart(args, context);
      this.validateInput(args);

      // Check rate limits
      if (this.isRateLimited()) {
        await this.waitForRateLimit();
      }

      // Prepare charge request
      const chargeRequest: CreateChargeRequest = {
        amount: args.amount,
        currency: args.currency,
        description: args.description,
        customer: args.customer,
        card: args.card,
        source: args.source,
        capture: args.capture !== false, // Default to true
        return_uri: args.return_uri,
        metadata: args.metadata
      };

      // Execute with retry logic
      const charge = await this.executeWithRetry(
        () => this.omiseClient.createCharge(chargeRequest),
        3,
        1000
      );

      const duration = Date.now() - startTime;
      this.logExecutionComplete(duration, context);

      return this.createSuccessResult(
        charge,
        'Charge created successfully',
        context
      );

    } catch (error) {
      return this.handleError(error as Error, context);
    }
  }
}

/**
 * Retrieve Charge Tool Handler
 */
export class RetrieveChargeTool extends BaseToolHandler {
  readonly name = 'retrieve_charge';
  readonly description = 'Retrieve charge information by ID';
  readonly inputSchema: JSONSchema7 = {
    type: 'object',
    properties: {
      charge_id: {
        type: 'string',
        description: 'Charge ID to retrieve'
      }
    },
    required: ['charge_id']
  };

  async execute(args: any, context: RequestContext): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      this.logExecutionStart(args, context);
      this.validateInput(args);

      const charge = await this.executeWithRetry(
        () => this.omiseClient.retrieveCharge(args.charge_id),
        3,
        1000
      );

      const duration = Date.now() - startTime;
      this.logExecutionComplete(duration, context);

      return this.createSuccessResult(
        charge,
        'Charge retrieved successfully',
        context
      );

    } catch (error) {
      return this.handleError(error as Error, context);
    }
  }
}

/**
 * List Charges Tool Handler
 */
export class ListChargesTool extends BaseToolHandler {
  readonly name = 'list_charges';
  readonly description = 'List charges with optional filtering';
  readonly inputSchema: JSONSchema7 = {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Number of items to retrieve (default: 20, max: 100)',
        minimum: 1,
        maximum: 100,
        default: 20
      },
      offset: {
        type: 'number',
        description: 'Offset for pagination (default: 0)',
        minimum: 0,
        default: 0
      },
      order: {
        type: 'string',
        description: 'Sort order',
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
        description: 'Filter by charge status',
        enum: ['pending', 'failed', 'successful']
      },
      customer: {
        type: 'string',
        description: 'Filter by customer ID'
      },
      card: {
        type: 'string',
        description: 'Filter by card ID'
      }
    }
  };

  async execute(args: any, context: RequestContext): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      this.logExecutionStart(args, context);
      this.validateInput(args);

      const listParams = {
        limit: args.limit || 20,
        offset: args.offset || 0,
        order: args.order || 'chronological',
        from: args.from,
        to: args.to,
        status: args.status,
        customer: args.customer,
        card: args.card
      };

      const charges = await this.executeWithRetry(
        () => this.omiseClient.listCharges(listParams),
        3,
        1000
      );

      const duration = Date.now() - startTime;
      this.logExecutionComplete(duration, context);

      return this.createSuccessResult(
        charges,
        `Retrieved ${charges.data.length} charges`,
        context
      );

    } catch (error) {
      return this.handleError(error as Error, context);
    }
  }
}

/**
 * Update Charge Tool Handler
 */
export class UpdateChargeTool extends BaseToolHandler {
  readonly name = 'update_charge';
  readonly description = 'Update charge information (only for pending charges)';
  readonly inputSchema: JSONSchema7 = {
    type: 'object',
    properties: {
      charge_id: {
        type: 'string',
        description: 'Charge ID to update'
      },
      description: {
        type: 'string',
        description: 'New description for the charge',
        maxLength: 255
      },
      metadata: {
        type: 'object',
        description: 'Updated metadata for the charge',
        additionalProperties: {
          type: 'string'
        }
      }
    },
    required: ['charge_id']
  };

  async execute(args: any, context: RequestContext): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      this.logExecutionStart(args, context);
      this.validateInput(args);

      const updateData = {
        description: args.description,
        metadata: args.metadata
      };

      const charge = await this.executeWithRetry(
        () => this.omiseClient.updateCharge(args.charge_id, updateData),
        3,
        1000
      );

      const duration = Date.now() - startTime;
      this.logExecutionComplete(duration, context);

      return this.createSuccessResult(
        charge,
        'Charge updated successfully',
        context
      );

    } catch (error) {
      return this.handleError(error as Error, context);
    }
  }
}

/**
 * Capture Charge Tool Handler
 */
export class CaptureChargeTool extends BaseToolHandler {
  readonly name = 'capture_charge';
  readonly description = 'Capture a previously authorized charge';
  readonly inputSchema: JSONSchema7 = {
    type: 'object',
    properties: {
      charge_id: {
        type: 'string',
        description: 'Charge ID to capture'
      },
      amount: {
        type: 'number',
        description: 'Amount to capture (optional, defaults to full amount)',
        minimum: 1
      }
    },
    required: ['charge_id']
  };

  async execute(args: any, context: RequestContext): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      this.logExecutionStart(args, context);
      this.validateInput(args);

      const captureData = args.amount ? { amount: args.amount } : {};

      const charge = await this.executeWithRetry(
        () => this.omiseClient.captureCharge(args.charge_id, captureData),
        3,
        1000
      );

      const duration = Date.now() - startTime;
      this.logExecutionComplete(duration, context);

      return this.createSuccessResult(
        charge,
        'Charge captured successfully',
        context
      );

    } catch (error) {
      return this.handleError(error as Error, context);
    }
  }
}

/**
 * Reverse Charge Tool Handler
 */
export class ReverseChargeTool extends BaseToolHandler {
  readonly name = 'reverse_charge';
  readonly description = 'Reverse a charge (refund)';
  readonly inputSchema: JSONSchema7 = {
    type: 'object',
    properties: {
      charge_id: {
        type: 'string',
        description: 'Charge ID to reverse'
      },
      amount: {
        type: 'number',
        description: 'Amount to reverse (optional, defaults to full amount)',
        minimum: 1
      }
    },
    required: ['charge_id']
  };

  async execute(args: any, context: RequestContext): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      this.logExecutionStart(args, context);
      this.validateInput(args);

      const reverseData = args.amount ? { amount: args.amount } : {};

      const charge = await this.executeWithRetry(
        () => this.omiseClient.reverseCharge(args.charge_id, reverseData),
        3,
        1000
      );

      const duration = Date.now() - startTime;
      this.logExecutionComplete(duration, context);

      return this.createSuccessResult(
        charge,
        'Charge reversed successfully',
        context
      );

    } catch (error) {
      return this.handleError(error as Error, context);
    }
  }
}

/**
 * Expire Charge Tool Handler
 */
export class ExpireChargeTool extends BaseToolHandler {
  readonly name = 'expire_charge';
  readonly description = 'Expire a pending charge';
  readonly inputSchema: JSONSchema7 = {
    type: 'object',
    properties: {
      charge_id: {
        type: 'string',
        description: 'Charge ID to expire'
      }
    },
    required: ['charge_id']
  };

  async execute(args: any, context: RequestContext): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      this.logExecutionStart(args, context);
      this.validateInput(args);

      const charge = await this.executeWithRetry(
        () => this.omiseClient.expireCharge(args.charge_id),
        3,
        1000
      );

      const duration = Date.now() - startTime;
      this.logExecutionComplete(duration, context);

      return this.createSuccessResult(
        charge,
        'Charge expired successfully',
        context
      );

    } catch (error) {
      return this.handleError(error as Error, context);
    }
  }
}

/**
 * Payment Tools Factory
 * 
 * Creates and returns all payment tool handlers
 */
export class PaymentToolsFactory {
  static createTools(omiseClient: OmiseClient, logger: Logger): BaseToolHandler[] {
    return [
      new CreateChargeTool(omiseClient, logger),
      new RetrieveChargeTool(omiseClient, logger),
      new ListChargesTool(omiseClient, logger),
      new UpdateChargeTool(omiseClient, logger),
      new CaptureChargeTool(omiseClient, logger),
      new ReverseChargeTool(omiseClient, logger),
      new ExpireChargeTool(omiseClient, logger)
    ];
  }
}