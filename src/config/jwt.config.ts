import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET,
  accessExpiration: process.env.JWT_ACCESS_EXPIRATION,
}));
