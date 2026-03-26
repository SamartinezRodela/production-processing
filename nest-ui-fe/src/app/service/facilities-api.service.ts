import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiUrlService } from '@services/api-url.service';
import { Facility } from '@models/database.types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FacilitiesApiService {
  constructor(
    private http: HttpClient,
    private apiUrlService: ApiUrlService,
  ) {}

  async getAll(): Promise<Facility[]> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    const response = await firstValueFrom(
      this.http.get<ApiResponse<Facility[]>>(`${apiUrl}/facilities`),
    );
    return response.data || [];
  }

  async getById(id: string): Promise<Facility | null> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<Facility>>(`${apiUrl}/facilities/${id}`),
      );
      return response.data || null;
    } catch (error) {
      console.error('Error getting facility:', error);
      return null;
    }
  }

  async create(name: string, warehouse: string = ''): Promise<Facility | null> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<Facility>>(`${apiUrl}/facilities`, { name, warehouse }),
      );
      return response.data || null;
    } catch (error) {
      console.error('Error creating facility:', error);
      return null;
    }
  }

  async update(id: string, name: string, warehouse: string = ''): Promise<Facility | null> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    try {
      const response = await firstValueFrom(
        this.http.put<ApiResponse<Facility>>(`${apiUrl}/facilities/${id}`, {
          name,
          warehouse,
        }),
      );
      return response.data || null;
    } catch (error) {
      console.error('Error updating facility:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    try {
      const response = await firstValueFrom(
        this.http.delete<ApiResponse<void>>(`${apiUrl}/facilities/${id}`),
      );
      return response.success;
    } catch (error) {
      console.error('Error deleting facility:', error);
      return false;
    }
  }

  async reload(): Promise<Facility[]> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<Facility[]>>(`${apiUrl}/facilities/reload`, {}),
      );
      return response.data || [];
    } catch (error) {
      console.error('Error reloading facilities:', error);
      return [];
    }
  }
}
