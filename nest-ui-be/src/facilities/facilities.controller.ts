import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FacilitiesService } from './facilities.service';
import {
  CreateFacilityDto,
  UpdateFacilityDto,
} from '../database/dto/create-facility.dto';

@Controller('facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Get()
  findAll() {
    return {
      success: true,
      data: this.facilitiesService.findAll(),
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const facility = this.facilitiesService.findOne(id);

    if (!facility) {
      throw new HttpException('Facility not found', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      data: facility,
    };
  }

  @Post()
  create(@Body() createFacilityDto: CreateFacilityDto) {
    const facility = this.facilitiesService.create(createFacilityDto);

    return {
      success: true,
      message: 'Facility created successfully',
      data: facility,
    };
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateFacilityDto: UpdateFacilityDto,
  ) {
    const facility = this.facilitiesService.update(id, updateFacilityDto);

    if (!facility) {
      throw new HttpException('Facility not found', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      message: 'Facility updated successfully',
      data: facility,
    };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const deleted = this.facilitiesService.remove(id);

    if (!deleted) {
      throw new HttpException(
        'Cannot delete facility or facility not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      success: true,
      message: 'Facility deleted successfully',
    };
  }

  @Post('reload')
  reload() {
    const database = this.facilitiesService.reloadDatabase();

    return {
      success: true,
      message: 'Database reloaded successfully',
      data: database.facilities,
    };
  }
}
