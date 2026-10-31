import { Injectable, type PipeTransform } from '@nestjs/common';

import { ErrorCode, zId } from '@repo/contracts';

import { AppException } from '../exceptions';

/** Validates a uuid path param; a malformed id is reported as NOT_FOUND. */
@Injectable()
export class ParseIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!zId.safeParse(value).success) throw new AppException(ErrorCode.NOT_FOUND);
    return value;
  }
}
