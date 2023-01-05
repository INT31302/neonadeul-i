import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger = new Logger(this.constructor.name);

  /**
   *
   * @param exception
   * @param host
   */
  private http = (exception: HttpException, host: ArgumentsHost): void => {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse();
    const request: Request = ctx.getRequest();

    // http exception 이 아닐경우, 500 error 로 변환후 반환합니다.
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      message: exception.message || 'UnhandledError',
      path: request.url,
      datetime: dayjs().format(),
    });
    return;
  };

  /**
   *
   * @param exception
   * @param host
   */
  catch(exception: HttpException, host: ArgumentsHost): any {
    this.logger.error(exception.message, exception.stack);

    if (host.getType() === 'http') {
      return this.http(exception, host);
    }

    this.logger.debug(
      `이 메시지가 보이면, 처리되지 않은 오류 유형이 있다는 뜻입니다. 로그를 보고 새로운 오류 유형에대해 처리해주세요.`,
    );

    this.logger.debug(`host type: ${host.getType}`);

    return new HttpException('UnhandledError', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
