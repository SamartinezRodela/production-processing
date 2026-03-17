import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateFacilityDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, {
    message:
      'Name can only contain letters, numbers, spaces, hyphens and underscores',
  })
  name: string;
}

export class UpdateFacilityDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, {
    message:
      'Name can only contain letters, numbers, spaces, hyphens and underscores',
  })
  name: string;
}
