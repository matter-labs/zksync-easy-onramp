import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import type { ExceptionResponse } from "./utils/types";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    console.error(exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = "internal_server_error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        error = exceptionResponse;
      } else if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const responseObj = exceptionResponse as ExceptionResponse;
        if (responseObj.errorCode) {
          error = responseObj.errorCode;
        } else if (responseObj.message) {
          if (Array.isArray(responseObj.message)) {
            error = responseObj.message[0] || "unknown_error";
          } else if (typeof responseObj.message === "string") {
            error = responseObj.message;
          }
        } else if (responseObj.error) {
          error = responseObj.error;
        }
      }
    } else if (exception instanceof Error) {
      error = exception.message;
    }

    if (response.headersSent) {
      return;
    }

    response.status(status).json({
      error,
      data: null,
    });
  }
}
