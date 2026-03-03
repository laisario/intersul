import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    
    // Preserve field-level errors from ValidationPipe or BadRequestException with errors array
    let errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message || null,
    };

    // If the exception response has an 'errors' field (from ValidationPipe or custom BadRequestException), preserve it
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      if (responseObj.errors) {
        errorResponse.errors = responseObj.errors;
      }
      // Also preserve message if it's different from exception.message
      if (responseObj.message && responseObj.message !== exception.message) {
        errorResponse.message = responseObj.message;
      }
    }

    // Log error details
    console.error('HTTP Exception:', errorResponse);

    response.status(status).json(errorResponse);
  }
}
