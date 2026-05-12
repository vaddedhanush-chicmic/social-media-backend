import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, Types.ObjectId> {
  transform(value: string, metadata: ArgumentMetadata): Types.ObjectId {
    const validObjectId = Types.ObjectId.isValid(value);
    if (!validObjectId) {
      throw new BadRequestException('Invalid ObjectId');
    }
    return Types.ObjectId.createFromHexString(value);
  }
}
