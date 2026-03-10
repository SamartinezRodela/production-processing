import { Controller, Get, Put, Post, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { DatabaseSettings } from '../database/entities/database.entity';
import { DatabaseService } from '../database/database.service';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Get('default')
  getDefaultSettings() {
    return this.settingsService.getDefaultSettings();
  }

  @Get('database-info')
  getDatabaseInfo() {
    return this.databaseService.getDatabaseInfo();
  }

  @Put()
  updateSettings(@Body() updates: Partial<DatabaseSettings>) {
    return this.settingsService.updateSettings(updates);
  }

  @Post('reset')
  resetToDefault() {
    return this.settingsService.resetToDefault();
  }

  @Post('validate-path')
  validatePath(
    @Body() body: { path: string; type: 'read' | 'write' | 'both' },
  ) {
    return this.settingsService.validatePath(body.path, body.type);
  }
}
