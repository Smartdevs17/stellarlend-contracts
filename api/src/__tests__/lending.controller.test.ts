import request from 'supertest';
import { StellarService } from '../services/stellar.service';

jest.mock('../services/stellar.service');

// Get the mocked instance that will be created when the controller module loads
const mockStellarServiceInstance = {
  buildDepositTransaction: jest.fn(),
  buildBorrowTransaction: jest.fn(),
  buildRepayTransaction: jest.fn(),
  buildWithdrawTransaction: jest.fn(),
  submitTransaction: jest.fn(),
  monitorTransaction: jest.fn(),
  healthCheck: jest.fn(),
};

(StellarService as jest.Mock).mockImplementation(() => mockStellarServiceInstance);

// Import app AFTER setting up the mock implementation so the controller gets our mock
import app from '../app';

describe('Lending Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/lending/deposit', () => {
    it('should successfully process a deposit', async () => {
      const mockTxXdr = 'mock_tx_xdr';
      const mockTxHash = 'mock_tx_hash';

      mockStellarServiceInstance.buildDepositTransaction.mockResolvedValue(mockTxXdr);
      mockStellarServiceInstance.submitTransaction.mockResolvedValue({
        success: true,
        transactionHash: mockTxHash,
        status: 'success',
      });
      mockStellarServiceInstance.monitorTransaction.mockResolvedValue({
        success: true,
        transactionHash: mockTxHash,
        status: 'success',
        ledger: 12345,
      });

      const response = await request(app)
        .post('/api/lending/deposit')
        .send({
          userAddress: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
          amount: '1000000',
          userSecret: 'SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transactionHash).toBe(mockTxHash);
    });

    it('should return 400 for invalid amount', async () => {
      const response = await request(app)
        .post('/api/lending/deposit')
        .send({
          userAddress: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
          amount: '0',
          userSecret: 'SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/lending/deposit')
        .send({
          userAddress: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/lending/borrow', () => {
    it('should successfully process a borrow', async () => {
      const mockTxXdr = 'mock_tx_xdr';
      const mockTxHash = 'mock_tx_hash';

      mockStellarServiceInstance.buildBorrowTransaction.mockResolvedValue(mockTxXdr);
      mockStellarServiceInstance.submitTransaction.mockResolvedValue({
        success: true,
        transactionHash: mockTxHash,
        status: 'success',
      });
      mockStellarServiceInstance.monitorTransaction.mockResolvedValue({
        success: true,
        transactionHash: mockTxHash,
        status: 'success',
        ledger: 12345,
      });

      const response = await request(app)
        .post('/api/lending/borrow')
        .send({
          userAddress: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
          amount: '500000',
          userSecret: 'SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle transaction failure', async () => {
      mockStellarServiceInstance.buildBorrowTransaction.mockResolvedValue('mock_tx_xdr');
      mockStellarServiceInstance.submitTransaction.mockResolvedValue({
        success: false,
        status: 'failed',
        error: 'Insufficient collateral',
      });

      const response = await request(app)
        .post('/api/lending/borrow')
        .send({
          userAddress: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
          amount: '500000',
          userSecret: 'SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/lending/repay', () => {
    it('should successfully process a repayment', async () => {
      const mockTxXdr = 'mock_tx_xdr';
      const mockTxHash = 'mock_tx_hash';

      mockStellarServiceInstance.buildRepayTransaction.mockResolvedValue(mockTxXdr);
      mockStellarServiceInstance.submitTransaction.mockResolvedValue({
        success: true,
        transactionHash: mockTxHash,
        status: 'success',
      });
      mockStellarServiceInstance.monitorTransaction.mockResolvedValue({
        success: true,
        transactionHash: mockTxHash,
        status: 'success',
        ledger: 12345,
      });

      const response = await request(app)
        .post('/api/lending/repay')
        .send({
          userAddress: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
          amount: '250000',
          userSecret: 'SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/lending/withdraw', () => {
    it('should successfully process a withdrawal', async () => {
      const mockTxXdr = 'mock_tx_xdr';
      const mockTxHash = 'mock_tx_hash';

      mockStellarServiceInstance.buildWithdrawTransaction.mockResolvedValue(mockTxXdr);
      mockStellarServiceInstance.submitTransaction.mockResolvedValue({
        success: true,
        transactionHash: mockTxHash,
        status: 'success',
      });
      mockStellarServiceInstance.monitorTransaction.mockResolvedValue({
        success: true,
        transactionHash: mockTxHash,
        status: 'success',
        ledger: 12345,
      });

      const response = await request(app)
        .post('/api/lending/withdraw')
        .send({
          userAddress: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
          amount: '100000',
          userSecret: 'SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle undercollateralization error', async () => {
      mockStellarServiceInstance.buildWithdrawTransaction.mockResolvedValue('mock_tx_xdr');
      mockStellarServiceInstance.submitTransaction.mockResolvedValue({
        success: false,
        status: 'failed',
        error: 'Withdrawal would violate minimum collateral ratio',
      });

      const response = await request(app)
        .post('/api/lending/withdraw')
        .send({
          userAddress: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
          amount: '1000000',
          userSecret: 'SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/health', () => {
    it('should return healthy status when all services are up', async () => {
      mockStellarServiceInstance.healthCheck.mockResolvedValue({
        horizon: true,
        sorobanRpc: true,
      });

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.services.horizon).toBe(true);
      expect(response.body.services.sorobanRpc).toBe(true);
    });

    it('should return unhealthy status when services are down', async () => {
      mockStellarServiceInstance.healthCheck.mockResolvedValue({
        horizon: false,
        sorobanRpc: false,
      });

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unhealthy');
    });
  });
});
