import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsUUID,
  Matches,
} from 'class-validator';

enum OrderStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMPLETED = 'completed',
}

export class CreateOrderDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, {
    message:
      'Name can only contain letters, numbers, spaces, hyphens and underscores',
  })
  name: string;

  @IsOptional()
  @IsString({ message: 'Facility ID must be a string' })
  facilityId?: string;

  @IsOptional()
  @IsEnum(OrderStatus, {
    message: 'Status must be one of: active, inactive, completed',
  })
  status?: 'active' | 'inactive' | 'completed';
}

export class UpdateOrderDto {
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, {
    message:
      'Name can only contain letters, numbers, spaces, hyphens and underscores',
  })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Facility ID must be a string' })
  facilityId?: string;

  @IsOptional()
  @IsEnum(OrderStatus, {
    message: 'Status must be one of: active, inactive, completed',
  })
  status?: 'active' | 'inactive' | 'completed';
}
