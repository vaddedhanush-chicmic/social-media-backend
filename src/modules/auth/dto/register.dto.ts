import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'The email of the user' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'johndoe', description: 'A unique username' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain alphanumeric characters and underscores' })
  username: string;

  @ApiProperty({ example: 'Password123!', description: 'A strong password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak. It must contain at least one uppercase letter, one lowercase letter, and one number or special character.',
  })
  password: string;
}
