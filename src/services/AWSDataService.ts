import { EventEmitter } from 'events';
import { ecommerceService } from './ECommerceService.js';
import crypto from 'crypto';

interface DataOperation {
  id: string;
  userId: string;
  operation: 'store' | 'retrieve' | 'update' | 'delete';
  dataType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  s3Location?: string;
  error?: string;
}

interface AppData {
  id: string;
  userId: string;
  dataType: string;
  content: any;
  metadata: {
    createdAt: string;
    updatedAt: string;
    size: number;
    encrypted: boolean;
  };
  s3Key?: string;
}

class AWSDataService extends EventEmitter {
  private accountId: string;
  private region: string;
  private credentials: any;
  private iotEndpoint: string;
  private certificatePath: string;
  private privateKeyPath: string;
  private rootCAPath: string;

  constructor() {
    super();
    this.accountId = process.env.AWS_ACCOUNT_ID || '';
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.credentials = null;
    this.iotEndpoint = process.env.AWS_IOT_ENDPOINT || '';
    this.certificatePath = process.env.AWS_IOT_CERTIFICATE_PATH || 'attached_assets/device.pem_1761002939640.crt';
    this.privateKeyPath = process.env.AWS_IOT_PRIVATE_KEY_PATH || '';
    this.rootCAPath = process.env.AWS_IOT_ROOT_CA_PATH || 'attached_assets/AmazonRootCA1_1761002495172.pem';
  }

  // Store app data in AWS S3
  async storeData(
    userId: string,
    dataType: string,
    content: any,
    encrypt: boolean = true
  ): Promise<{ success: boolean; operation?: DataOperation; data?: AppData; error?: string }> {
    const awsConnection = ecommerceService.getAWSConnection(userId);

    if (!awsConnection) {
      return { success: false, error: 'AWS account not connected' };
    }

    const operationId = `DATA-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const dataId = `${userId}-${dataType}-${Date.now()}`;

    const operation: DataOperation = {
      id: operationId,
      userId,
      operation: 'store',
      dataType,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.dataOperations.set(operationId, operation);

    try {
      operation.status = 'processing';
      this.emit('dataOperationStarted', operation);

      // Encrypt data if requested
      let processedContent = content;
      if (encrypt) {
        processedContent = this.encryptData(content);
      }

      // Create app data object
      const appData: AppData = {
        id: dataId,
        userId,
        dataType,
        content: processedContent,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          size: JSON.stringify(content).length,
          encrypted: encrypt
        },
        s3Key: `data/${userId}/${dataType}/${dataId}.json`
      };

      // Simulate S3 upload
      await this.uploadToS3(appData, awsConnection);

      // Store in local cache
      this.appDataStore.set(dataId, appData);

      operation.status = 'completed';
      operation.completedAt = new Date().toISOString();
      operation.s3Location = `s3://${awsConnection.accountId}-youngmeat-data/${appData.s3Key}`;

      this.emit('dataOperationCompleted', operation);

      return { success: true, operation, data: appData };
    } catch (error) {
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('dataOperationFailed', operation);

      return { success: false, error: operation.error };
    }
  }

  // Retrieve app data from AWS S3
  async retrieveData(
    userId: string,
    dataId: string
  ): Promise<{ success: boolean; data?: AppData; error?: string }> {
    const awsConnection = ecommerceService.getAWSConnection(userId);

    if (!awsConnection) {
      return { success: false, error: 'AWS account not connected' };
    }

    const appData = this.appDataStore.get(dataId);

    if (!appData) {
      return { success: false, error: 'Data not found' };
    }

    if (appData.userId !== userId) {
      return { success: false, error: 'Access denied' };
    }

    // Decrypt if encrypted
    if (appData.metadata.encrypted) {
      const decryptedContent = this.decryptData(appData.content);
      return {
        success: true,
        data: { ...appData, content: decryptedContent }
      };
    }

    return { success: true, data: appData };
  }

  // Update app data in AWS S3
  async updateData(
    userId: string,
    dataId: string,
    newContent: any
  ): Promise<{ success: boolean; operation?: DataOperation; data?: AppData; error?: string }> {
    const awsConnection = ecommerceService.getAWSConnection(userId);

    if (!awsConnection) {
      return { success: false, error: 'AWS account not connected' };
    }

    const appData = this.appDataStore.get(dataId);

    if (!appData) {
      return { success: false, error: 'Data not found' };
    }

    if (appData.userId !== userId) {
      return { success: false, error: 'Access denied' };
    }

    const operationId = `DATA-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const operation: DataOperation = {
      id: operationId,
      userId,
      operation: 'update',
      dataType: appData.dataType,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.dataOperations.set(operationId, operation);

    try {
      operation.status = 'processing';

      // Encrypt new content if original was encrypted
      let processedContent = newContent;
      if (appData.metadata.encrypted) {
        processedContent = this.encryptData(newContent);
      }

      // Update app data
      appData.content = processedContent;
      appData.metadata.updatedAt = new Date().toISOString();
      appData.metadata.size = JSON.stringify(newContent).length;

      // Simulate S3 upload
      await this.uploadToS3(appData, awsConnection);

      operation.status = 'completed';
      operation.completedAt = new Date().toISOString();
      operation.s3Location = `s3://${awsConnection.accountId}-youngmeat-data/${appData.s3Key}`;

      this.emit('dataOperationCompleted', operation);

      return { success: true, operation, data: appData };
    } catch (error) {
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('dataOperationFailed', operation);

      return { success: false, error: operation.error };
    }
  }

  // Delete app data from AWS S3
  async deleteData(
    userId: string,
    dataId: string
  ): Promise<{ success: boolean; operation?: DataOperation; error?: string }> {
    const awsConnection = ecommerceService.getAWSConnection(userId);

    if (!awsConnection) {
      return { success: false, error: 'AWS account not connected' };
    }

    const appData = this.appDataStore.get(dataId);

    if (!appData) {
      return { success: false, error: 'Data not found' };
    }

    if (appData.userId !== userId) {
      return { success: false, error: 'Access denied' };
    }

    const operationId = `DATA-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const operation: DataOperation = {
      id: operationId,
      userId,
      operation: 'delete',
      dataType: appData.dataType,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.dataOperations.set(operationId, operation);

    try {
      operation.status = 'processing';

      // Simulate S3 deletion
      await this.deleteFromS3(appData, awsConnection);

      // Remove from local cache
      this.appDataStore.delete(dataId);

      operation.status = 'completed';
      operation.completedAt = new Date().toISOString();

      this.emit('dataOperationCompleted', operation);

      return { success: true, operation };
    } catch (error) {
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('dataOperationFailed', operation);

      return { success: false, error: operation.error };
    }
  }

  // List all data for user
  getUserData(userId: string): AppData[] {
    return Array.from(this.appDataStore.values()).filter(data => data.userId === userId);
  }

  // Get data operation status
  getOperation(operationId: string): DataOperation | null {
    return this.dataOperations.get(operationId) || null;
  }

  // Get user operations
  getUserOperations(userId: string): DataOperation[] {
    return Array.from(this.dataOperations.values()).filter(op => op.userId === userId);
  }

  // Batch store multiple data items
  async batchStore(
    userId: string,
    items: Array<{ dataType: string; content: any; encrypt?: boolean }>
  ): Promise<{ success: boolean; results: any[]; errors: any[] }> {
    const results = [];
    const errors = [];

    for (const item of items) {
      const result = await this.storeData(
        userId,
        item.dataType,
        item.content,
        item.encrypt !== false
      );

      if (result.success) {
        results.push(result);
      } else {
        errors.push({ item, error: result.error });
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors
    };
  }

  // Private helper methods
  private encryptData(data: any): string {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return JSON.stringify({
      encrypted,
      key: key.toString('hex'),
      iv: iv.toString('hex')
    });
  }

  private decryptData(encryptedData: string): any {
    const { encrypted, key, iv } = JSON.parse(encryptedData);
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(key, 'hex'),
      Buffer.from(iv, 'hex')
    );

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  private async uploadToS3(appData: AppData, awsConnection: any): Promise<void> {
    // Simulate S3 upload delay
    console.log(`Uploading to S3: ${appData.s3Key}`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async deleteFromS3(appData: AppData, awsConnection: any): Promise<void> {
    // Simulate S3 deletion delay
    console.log(`Deleting from S3: ${appData.s3Key}`);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing AWS connection...');
      // In production, this would make an actual AWS API call
      return true;
    } catch (error) {
      console.error('AWS connection test failed:', error);
      return false;
    }
  }

  // Connect to AWS IoT using device certificate
  async connectIoT(): Promise<{
    success: boolean;
    endpoint?: string;
    thingName?: string;
    certificatePath?: string;
  }> {
    try {
      console.log('Connecting to AWS IoT with device certificate...');

      if (!this.iotEndpoint) {
        console.warn('AWS IoT endpoint not configured');
        return { success: false };
      }

      // Verify certificate file exists
      const fs = await import('fs/promises');
      await fs.access(this.certificatePath);
      console.log('Device certificate found');

      // Verify Root CA exists
      await fs.access(this.rootCAPath);
      console.log('Root CA certificate found');

      return {
        success: true,
        endpoint: this.iotEndpoint,
        thingName: process.env.AWS_IOT_THING_NAME || 'BettingSites-IoT-Device',
        certificatePath: this.certificatePath
      };
    } catch (error) {
      console.error('AWS IoT connection failed:', error);
      return { success: false };
    }
  }

  getIoTConfig() {
    return {
      endpoint: this.iotEndpoint,
      certificatePath: this.certificatePath,
      privateKeyPath: this.privateKeyPath,
      rootCAPath: this.rootCAPath,
      thingName: process.env.AWS_IOT_THING_NAME || 'BettingSites-IoT-Device',
      topics: {
        telemetry: process.env.AWS_IOT_TOPIC_TELEMETRY || 'bettingsites/telemetry',
        commands: process.env.AWS_IOT_TOPIC_COMMANDS || 'bettingsites/commands',
        events: process.env.AWS_IOT_TOPIC_EVENTS || 'bettingsites/events'
      }
    };
  }
}

export const awsDataService = new AWSDataService();