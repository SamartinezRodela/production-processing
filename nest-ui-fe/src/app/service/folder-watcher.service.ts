import { Injectable, signal } from '@angular/core';
import { ElectronService } from './electron.service';

export interface FolderItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  extension?: string;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

@Injectable({
  providedIn: 'root',
})
export class FolderWatcherService {
  private folderItems = signal<FolderItem[]>([]);
  private currentPath = signal<string>('');
  private isWatching = signal(false);
  private breadcrumbs = signal<BreadcrumbItem[]>([]);
  private basePath = signal<string>('');

  items = this.folderItems.asReadonly();
  path = this.currentPath.asReadonly();
  watching = this.isWatching.asReadonly();
  breadcrumbPath = this.breadcrumbs.asReadonly();

  constructor(private electronService: ElectronService) {}

  async startWatching(folderPath: string): Promise<void> {
    if (!folderPath) return;

    this.basePath.set(folderPath);
    this.currentPath.set(folderPath);
    this.isWatching.set(true);
    this.updateBreadcrumbs(folderPath);
    await this.loadFolderContents(folderPath);
  }

  stopWatching(): void {
    this.isWatching.set(false);
    this.folderItems.set([]);
    this.currentPath.set('');
    this.breadcrumbs.set([]);
    this.basePath.set('');
  }

  async loadFolderContents(folderPath: string): Promise<void> {
    try {
      const result = await this.electronService.readFolder(folderPath);

      if (result.success) {
        this.currentPath.set(folderPath);
        this.updateBreadcrumbs(folderPath);
        this.folderItems.set(result.items);
      } else {
        console.error('Error Loading Folder:', result.error);
        this.folderItems.set([]);
      }
    } catch (error) {
      console.error('Error loading folder Contents:', error);
      this.folderItems.set([]);
    }
  }

  async navigateToFolder(folderPath: string): Promise<void> {
    await this.loadFolderContents(folderPath);
  }

  async navigateUp(): Promise<void> {
    const currentPath = this.currentPath();
    if (!currentPath) return;

    // Llamar a Electron para obtener el parent path
    const result = await this.electronService.getParentPath(currentPath);

    if (result.success && result.parentPath && result.parentPath !== currentPath) {
      await this.loadFolderContents(result.parentPath);
    }
  }

  async navigateToBreadcrumb(breadcrumbPath: string): Promise<void> {
    await this.loadFolderContents(breadcrumbPath);
  }

  private updateBreadcrumbs(folderPath: string): void {
    // Detectar separador (Windows usa \ y Unix usa /)
    const separator = folderPath.includes('\\') ? '\\' : '/';
    const parts = folderPath.split(separator).filter((p: string) => p);

    const breadcrumbs: BreadcrumbItem[] = [];
    let currentPath = '';

    parts.forEach((part: string, index: number) => {
      if (index === 0 && part.includes(':')) {
        // Windows drive letter (C:)
        currentPath = part + separator;
        breadcrumbs.push({
          name: part,
          path: currentPath,
        });
      } else if (index === 0 && separator === '/') {
        // Unix root
        currentPath = separator + part;
        breadcrumbs.push({
          name: part,
          path: currentPath,
        });
      } else {
        currentPath = currentPath + (currentPath.endsWith(separator) ? '' : separator) + part;
        breadcrumbs.push({
          name: part,
          path: currentPath,
        });
      }
    });

    this.breadcrumbs.set(breadcrumbs);
  }

  async refresh(): Promise<void> {
    if (this.currentPath()) {
      await this.loadFolderContents(this.currentPath());
    }
  }

  getFileCount(): number {
    return this.folderItems().filter((item) => item.type === 'file').length;
  }

  getFolderCount(): number {
    return this.folderItems().filter((item) => item.type === 'folder').length;
  }

  canNavigateUp(): boolean {
    const currentPath = this.currentPath();
    const base = this.basePath();

    if (!currentPath || !base) return false;

    // No permitir navegar más arriba que el basePath
    return currentPath !== base && currentPath.length > base.length;
  }
}
