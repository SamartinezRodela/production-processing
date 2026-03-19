import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Select, SelectOption } from '@shared/select/select';
import { Badge } from '@shared/badge/badge';
import { LanguageService } from '@services/language.service';

@Component({
  selector: 'app-filters-panel',
  standalone: true,
  imports: [CommonModule, Select, Badge],
  templateUrl: './filters-panel.html',
  styleUrl: './filters-panel.css',
})
export class FiltersPanel {
  languageService = inject(LanguageService);

  // Inputs
  facilityOptions = input.required<SelectOption[]>();
  selectedFacility = input.required<string>();
  orderOptions = input.required<SelectOption[]>();
  selectedOrder = input.required<string>();

  // Outputs
  facilityChange = output<string | number>();
  orderChange = output<string | number>();
  testSaludar = output<void>();
  generatePDF = output<void>();
  testGuardarPdf = output<void>();
}
