import { Request, Response } from 'express';
import multer from 'multer';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler';
import ApiError from '../utils/ApiError';
import env from '../config/env';

describe('errorHandler middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;
  const originalNodeEnv = env.NODE_ENV;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    env.NODE_ENV = 'test';
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    env.NODE_ENV = originalNodeEnv;
  });

  it('handles ApiError response shape', () => {
    const err = ApiError.badRequest('Invalid request');

    errorHandler(err, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid request',
    });
  });

  it('handles mongoose validation errors', () => {
    const err = new Error('Validation failed');
    err.name = 'ValidationError';

    errorHandler(err, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation failed',
    });
  });

  it('handles multer file size errors', () => {
    const err = new multer.MulterError('LIMIT_FILE_SIZE');

    errorHandler(err, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'CSV file is too large. Maximum size is 2MB.',
    });
  });

  it('handles custom invalid csv file type errors', () => {
    const err = new Error('Invalid file type. Only CSV files are allowed.');

    errorHandler(err, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid file type. Only CSV files are allowed.',
    });
  });

  it('handles duplicate key errors', () => {
    const err = Object.assign(new Error('Duplicate key'), {
      code: 11000,
      keyValue: { email: 'test@example.com' },
    });

    errorHandler(err, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'An account with this email already exists.',
    });
  });

  it('handles cast errors', () => {
    const err = new Error('Cast to ObjectId failed');
    err.name = 'CastError';

    errorHandler(err, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid ID format.',
    });
  });

  it('includes stack trace in development mode', () => {
    env.NODE_ENV = 'development';
    const err = new Error('Boom');

    errorHandler(err, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Internal Server Error',
        stack: expect.any(String),
      })
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error:',
      expect.objectContaining({
        statusCode: 500,
        message: 'Boom',
      })
    );
  });

  it('logs unexpected non-operational errors outside development', () => {
    env.NODE_ENV = 'production';
    const err = new Error('Unexpected');

    errorHandler(err, mockReq as Request, mockRes as Response, nextFunction);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Unexpected Error:', err);
  });
});

describe('notFoundHandler middleware', () => {
  it('forwards ApiError.notFound to next', () => {
    const req = { originalUrl: '/missing-route' } as Request;
    const res = {} as Response;
    const next = jest.fn();

    notFoundHandler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const forwardedError = next.mock.calls[0][0];
    expect(forwardedError).toBeInstanceOf(ApiError);
    expect(forwardedError.statusCode).toBe(404);
    expect(forwardedError.message).toBe('Route /missing-route not found');
  });
});
