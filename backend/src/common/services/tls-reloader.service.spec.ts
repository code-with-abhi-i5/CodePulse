import { TlsReloaderService } from './tls-reloader.service';
import * as https from 'https';

/* eslint-disable @typescript-eslint/unbound-method */

describe('TlsReloaderService', () => {
  let service: TlsReloaderService;

  beforeEach(() => {
    service = new TlsReloaderService();
  });

  it('should initialize with empty servers and null context', () => {
    const status = service.getStatus();
    expect(status.hasActiveContext).toBe(false);
    expect(status.registeredServerCount).toBe(0);
    expect(status.lastReloadedAt).toBeNull();
    expect(status.lastError).toBeNull();
  });

  it('should register and unregister https/tls servers', () => {
    const mockServer = {
      setSecureContext: jest.fn(),
    } as unknown as https.Server;

    service.registerServer(mockServer);
    expect(service.getStatus().registeredServerCount).toBe(1);

    service.unregisterServer(mockServer);
    expect(service.getStatus().registeredServerCount).toBe(0);
  });

  it('should hot-reload certificates into registered servers via setSecureContext', () => {
    const mockServer1 = {
      setSecureContext: jest.fn(),
    } as unknown as https.Server;
    const mockServer2 = {
      setSecureContext: jest.fn(),
    } as unknown as https.Server;

    service.registerServer(mockServer1);
    service.registerServer(mockServer2);

    const dummyCtx = { context: { test: true } };
    const createContextSpy = jest
      .spyOn(service, 'createContext')
      .mockReturnValue(dummyCtx);

    const result = service.reload('MOCK_CERT_PEM', 'MOCK_KEY_PEM');

    expect(result.success).toBe(true);
    expect(result.activeServerCount).toBe(2);
    expect(mockServer1.setSecureContext).toHaveBeenCalledWith(dummyCtx.context);
    expect(mockServer2.setSecureContext).toHaveBeenCalledWith(dummyCtx.context);

    const status = service.getStatus();
    expect(status.hasActiveContext).toBe(true);
    expect(status.lastError).toBeNull();
    expect(status.lastReloadedAt).toBeDefined();

    createContextSpy.mockRestore();
  });

  it('should apply existing secureContext immediately when a new server registers', () => {
    const dummyCtx = { context: { test: true } };
    const createContextSpy = jest
      .spyOn(service, 'createContext')
      .mockReturnValue(dummyCtx);

    service.reload('MOCK_CERT', 'MOCK_KEY');

    const newServer = {
      setSecureContext: jest.fn(),
    } as unknown as https.Server;

    service.registerServer(newServer);
    expect(newServer.setSecureContext).toHaveBeenCalledWith(dummyCtx.context);

    createContextSpy.mockRestore();
  });

  it('should capture and handle errors when TLS context creation fails', () => {
    const createContextSpy = jest
      .spyOn(service, 'createContext')
      .mockImplementation(() => {
        throw new Error('Invalid RSA private key');
      });

    const result = service.reload('BAD_CERT', 'BAD_KEY');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid RSA private key');
    expect(result.activeServerCount).toBe(0);

    const status = service.getStatus();
    expect(status.lastError).toContain('Invalid RSA private key');

    createContextSpy.mockRestore();
  });
});
