import {
  Component,
  input,
  model,
  signal,
  HostListener,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Icon } from '@shared/icon/icon';

export interface SelectOption {
  value: string | number;
  label: string;
}

@Component({
  selector: 'app-select',
  imports: [FormsModule, CommonModule, Icon],
  templateUrl: './select.html',
  styleUrl: './select.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Select {
  label = input<string>('');
  options = input<SelectOption[]>([]);
  placeholder = input<string>('Selecciona una opción');
  disabled = input<boolean>(false);
  required = input<boolean>(false);
  multiple = input<boolean>(false);
  customClass = input<string>('');
  selectClass = input<string>('');
  searchable = input<boolean>(false);

  // Nuevos inputs para el icono
  icon = input<string>('');
  iconPosition = input<'left' | 'right'>('left');
  iconSize = input<number>(20);

  // Para selección simple
  value = model<string | number>('');

  // Para selección múltiple
  multiValue = model<(string | number)[]>([]);

  // Estado del dropdown
  isOpen = signal(false);

  // Búsqueda
  searchQuery = signal('');

  // Opciones filtradas basadas en búsqueda
  filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.options();

    return this.options().filter((option) => option.label.toLowerCase().includes(query));
  });

  // Obtener el label del valor seleccionado
  selectedLabel = computed(() => {
    if (!this.value()) return this.placeholder();
    const option = this.options().find((opt) => opt.value === this.value());
    return option?.label || this.placeholder();
  });

  toggleDropdown() {
    if (!this.disabled()) {
      this.isOpen.set(!this.isOpen());
      if (this.isOpen()) {
        this.searchQuery.set('');
      }
    }
  }

  closeDropdown() {
    this.isOpen.set(false);
    this.searchQuery.set('');
  }

  selectOption(optionValue: string | number) {
    if (!this.multiple()) {
      this.value.set(optionValue);
      this.closeDropdown();
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('app-select')) {
      this.closeDropdown();
    }
  }

  toggleOption(optionValue: string | number) {
    if (!this.multiple()) return;

    const currentValues = [...this.multiValue()];
    const index = currentValues.indexOf(optionValue);

    if (index > -1) {
      currentValues.splice(index, 1);
    } else {
      currentValues.push(optionValue);
    }

    this.multiValue.set(currentValues);
  }

  isSelected(optionValue: string | number): boolean {
    if (this.multiple()) {
      return this.multiValue().includes(optionValue);
    }
    return this.value() === optionValue;
  }

  getOptionLabel(value: string | number): string {
    return this.options().find((opt) => opt.value === value)?.label || '';
  }

  clearSearch() {
    this.searchQuery.set('');
  }
}
