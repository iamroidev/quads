import { Request, Response } from 'express';
import { sanitizeInput, validateObjectId, validateAuthInput } from '../middleware/validateRequest';

describe('Input Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('sanitizeInput', () => {
    it('should strip HTML tags from body', () => {
      mockReq.body = {
        name: '<script>alert("xss")</script>John',
        email: 'test@example.com',
      };

      sanitizeInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.body.name).toBe('alert("xss")John');
      expect(mockReq.body.email).toBe('test@example.com');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should strip javascript: protocol', () => {
      mockReq.body = {
        url: 'javascript:alert("xss")',
      };

      sanitizeInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.body.url).toBe('alert("xss")');
    });

    it('should strip event handlers', () => {
      mockReq.body = {
        description: 'onclick=alert(1) hello',
      };

      sanitizeInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.body.description).toBe('alert(1) hello');
    });

    it('should handle nested objects', () => {
      mockReq.body = {
        user: {
          name: '<b>Admin</b>',
          bio: 'javascript:void(0)',
        },
      };

      sanitizeInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.body.user.name).toBe('Admin');
      expect(mockReq.body.user.bio).toBe('void(0)');
    });

    it('should handle arrays', () => {
      mockReq.body = {
        tags: ['<script>bad</script>', 'good'],
      };

      sanitizeInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.body.tags[0]).toBe('bad');
      expect(mockReq.body.tags[1]).toBe('good');
    });

    it('should handle query and params', () => {
      mockReq.query = { search: '<img src=x>' };
      mockReq.params = { id: 'javascript:evil' };

      sanitizeInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.query.search).toBe(''); // entire <img> tag stripped
      expect(mockReq.params.id).toBe('evil'); // javascript: stripped
    });
  });

  describe('validateObjectId', () => {
    it('should pass valid ObjectId', () => {
      mockReq.params = { id: '507f1f77bcf86cd799439011' };

      validateObjectId(mockReq as Request, mockRes as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject invalid ObjectId', () => {
      mockReq.params = { id: 'invalid-id' };

      validateObjectId(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid ID format',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('validateAuthInput', () => {
    it('should pass valid auth input', () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
      };

      validateAuthInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should reject invalid email', () => {
      mockReq.body = { email: 'not-an-email' };

      validateAuthInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.arrayContaining(['Invalid email format']),
        })
      );
    });

    it('should reject short password', () => {
      mockReq.body = { password: '123' };

      validateAuthInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining(['Password must be at least 6 characters']),
        })
      );
    });
  });
});
