import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { MongoError } from 'mongodb';

@Catch(MongoError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: MongoError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Duplicate key error
    if (exception.code === 11000) {
      status = HttpStatus.CONFLICT;
      const field = Object.keys((exception as any).keyPattern)[0];
      message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: 'Conflict',
    });
  }
}
