import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiUrlService } from '@services/api-url.service';
import { Order } from '@models/database.types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrdersApiService {
  constructor(
    private http: HttpClient,
    private apiUrlService: ApiUrlService,
  ) {}

  async getAll(facilityId?: string): Promise<Order[]> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    const url = facilityId ? `${apiUrl}/orders?facilityId=${facilityId}` : `${apiUrl}/orders`;

    const response = await firstValueFrom(this.http.get<ApiResponse<Order[]>>(url));
    return response.data || [];
  }

  async getById(id: string): Promise<Order | null> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<Order>>(`${apiUrl}/orders/${id}`),
      );
      return response.data || null;
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  }

  async create(
    name: string,
    facilityId?: string,
    status: 'active' | 'inactive' | 'completed' = 'active',
  ): Promise<Order | null> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<Order>>(`${apiUrl}/orders`, {
          name,
          facilityId,
          status,
        }),
      );
      return response.data || null;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  async update(
    id: string,
    updates: { name?: string; facilityId?: string; status?: string },
  ): Promise<Order | null> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    try {
      const response = await firstValueFrom(
        this.http.put<ApiResponse<Order>>(`${apiUrl}/orders/${id}`, updates),
      );
      return response.data || null;
    } catch (error) {
      console.error('Error updating order:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    try {
      const response = await firstValueFrom(
        this.http.delete<ApiResponse<void>>(`${apiUrl}/orders/${id}`),
      );
      return response.success;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }
}
