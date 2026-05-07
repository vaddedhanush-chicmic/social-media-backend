import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'object' && value !== null) {
      Object.keys(value).forEach((key) => {
        if (typeof value[key] === 'string') {
          value[key] = sanitizeHtml(value[key]);
        }
      });
    } else if (typeof value === 'string') {
      return sanitizeHtml(value);
    }
    return value;
  }
}
