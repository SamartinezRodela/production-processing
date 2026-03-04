import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateFacilityDto,
  UpdateFacilityDto,
} from '../database/dto/create-facility.dto';
import { Facility } from '../database/entities/facility.entity';

@Injectable()
export class FacilitiesService {
  constructor(private readonly databaseService: DatabaseService) {}

  findAll(): Facility[] {
    return this.databaseService.getFacilities();
  }

  findOne(id: string): Facility | undefined {
    return this.databaseService.getFacilityById(id);
  }

  create(createFacilityDto: CreateFacilityDto): Facility {
    return this.databaseService.createFacility(createFacilityDto.name);
  }

  update(id: string, updateFacilityDto: UpdateFacilityDto): Facility | null {
    return this.databaseService.updateFacility(id, updateFacilityDto.name);
  }

  remove(id: string): boolean {
    return this.databaseService.deleteFacility(id);
  }

  reloadDatabase() {
    return this.databaseService.reloadDatabase();
  }
}
