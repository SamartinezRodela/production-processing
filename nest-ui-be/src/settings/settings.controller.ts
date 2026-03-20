import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { DatabaseService } from '../database/database.service';
import {
  UpdateSettingsDto,
  ValidatePathDto,
} from '../database/dto/update-settings.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly databaseService: DatabaseService,
  ) {}

  // Ruta pública - necesaria antes del login
  @Get('public')
  getPublicSettings() {
    const defaults = this.settingsService.getDefaultSettings() as any;
    return {
      theme: defaults?.theme || 'light',
      language: defaults?.language || 'en',
    };
  }
  // Rutas protegidas
  @UseGuards(JwtAuthGuard)
  @Get('default')
  getDefaultSettings() {
    return this.settingsService.getDefaultSettings();
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @UseGuards(JwtAuthGuard)
  @Get('database-info')
  getDatabaseInfo() {
    return this.databaseService.getDatabaseInfo();
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  updateSettings(@Body() updateSettingsDto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(updateSettingsDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  resetToDefault() {
    return this.settingsService.resetToDefault();
  }

  @UseGuards(JwtAuthGuard)
  @Post('validate-path')
  validatePath(@Body() validatePathDto: ValidatePathDto) {
    return this.settingsService.validatePath(
      validatePathDto.path,
      validatePathDto.type,
    );
  }
}
