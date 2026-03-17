import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

enum OperatingSystem {
  WINDOWS = 'windows',
  MACOS = 'macos',
}

enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsString({ message: 'Selected Facility ID must be a string' })
  selectedFacilityId?: string;

  @IsOptional()
  @IsString({ message: 'Base Path must be a string' })
  @MinLength(3, { message: 'Base Path must be at least 3 characters long' })
  @MaxLength(500, { message: 'Base Path must not exceed 500 characters' })
  basePath?: string;

  @IsOptional()
  @IsString({ message: 'Output Path must be a string' })
  @MinLength(3, { message: 'Output Path must be at least 3 characters long' })
  @MaxLength(500, { message: 'Output Path must not exceed 500 characters' })
  outputPath?: string;

  @IsOptional()
  @IsEnum(OperatingSystem, {
    message: 'OS must be one of: windows, macos',
  })
  os?: 'windows' | 'macos';

  @IsOptional()
  @IsEnum(Theme, {
    message: 'Theme must be one of: light, dark',
  })
  theme?: 'light' | 'dark';

  @IsOptional()
  @IsBoolean({ message: 'Auto Save must be a boolean' })
  autoSave?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Notifications must be a boolean' })
  notifications?: boolean;
}

export class ValidatePathDto {
  @IsString({ message: 'Path must be a string' })
  @IsNotEmpty({ message: 'Path is required' })
  @MinLength(3, { message: 'Path must be at least 3 characters long' })
  @MaxLength(500, { message: 'Path must not exceed 500 characters' })
  path: string;

  @IsEnum(['read', 'write', 'both'], {
    message: 'Type must be one of: read, write, both',
  })
  type: 'read' | 'write' | 'both';
}
