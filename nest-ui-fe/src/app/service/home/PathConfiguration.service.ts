import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { firstValueFrom } from 'rxjs';
import { SettingsService } from '../set-up/settings.service';
import { ElectronService } from '../electron.service';
import { NotificationService } from '../notification.service';

@Injectable({
  providedIn: 'root',
})
export class PathConfigurationService {
  private settingsService = inject(SettingsService);
  private electronService = inject(ElectronService);
  private notificationService = inject(NotificationService);
  private http = inject(HttpClient);

  async browsePath(onSuccess?: () => void): Promise<void> {
    try {
      const result = await this.electronService.selectFolder();
      if (!result.canceled && result.path) {
        const validation = await this.validatePath(result.path, 'read');
        if (!validation.valid) {
          this.notificationService.error(
            `Invalid Base Path: ${validation.error}. Please select a folder with read permissions.`,
          );
          return;
        }
        this.settingsService.setBasePath(result.path);
        await this.savePathSettings();
        this.notificationService.success(`Base Path updated: ${result.path}`);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      this.notificationService.error(`Error selecting folder:${error}`);
    }
  }

  async browseOutputPath(onSuccess?: () => void): Promise<void> {
    try {
      const result = await this.electronService.selectFolder();
      if (!result.canceled && result.path) {
        const validation = await this.validatePath(result.path, 'write');
        if (!validation.valid) {
          this.notificationService.error(
            `Invalid Output Path: ${validation.error}. Please select a folder with write permissions.`,
          );
          return;
        }
        this.settingsService.setOutputPath(result.path);
        await this.savePathSettings();
        this.notificationService.success(`Output Path updated: ${result.path}`);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      this.notificationService.error(`Error selecting folder: ${error}`);
    }
  }

  async onBasePathBlur(): Promise<Boolean> {
    const path = this.settingsService.basePath().trim();
    if (!path) return false;
    const validation = await this.validatePath(path, 'read');
    if (!validation.valid) {
      this.notificationService.error(
        `Invalid Base Path:${validation.error}. Please select a folder with read permissions.`,
      );
      return false;
    } else {
      await this.savePathSettings();
      this.notificationService.success('Base Path Validated and Saved');
      return true;
    }
  }

  async onOutputPathBlur(): Promise<boolean> {
    const path = this.settingsService.outputPath().trim();
    if (!path) return false;
    const validation = await this.validatePath(path, 'write');
    if (!validation.valid) {
      this.notificationService.error(
        `Invalid Output Path: ${validation.error}. Please select a folder with write permissions.`,
      );
      return false;
    } else {
      await this.savePathSettings();
      this.notificationService.success('Output Path validated and saved');
      return true;
    }
  }

  private async validatePath(
    path: string,
    type: 'read' | 'write' | 'both',
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const apiUrl = await this.settingsService['apiUrlService'].getApiUrl();
      return await firstValueFrom(
        this.http.post<any>(`${apiUrl}/settings/validate-path`, { path, type }),
      );
    } catch (error) {
      return { valid: false, error: 'Failed to validate path' };
    }
  }

  private async savePathSettings(): Promise<void> {
    try {
      const apiUrl = await this.settingsService['apiUrlService'].getApiUrl();
      await firstValueFrom(
        this.http.put(`${apiUrl}/settings`, {
          basePath: this.settingsService.basePath(),
          outputPath: this.settingsService.outputPath(),
          os: this.settingsService.operatingSystem(),
        }),
      );
    } catch (error) {
      this.notificationService.error(`Error saving path settings: ${error}`);
    }
  }
}
