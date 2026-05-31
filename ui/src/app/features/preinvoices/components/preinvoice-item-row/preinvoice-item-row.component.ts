import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { EquipmentCatalogItem } from '../../../equipment/models/equipment.model';
import { InvoiceRow } from '../../models/preinvoice.model';

@Component({
  selector: 'app-preinvoice-item-row',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AutoCompleteModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
  ],
  templateUrl: './preinvoice-item-row.component.html',
  styleUrl: './preinvoice-item-row.component.css',
})
export class PreinvoiceItemRowComponent {
  @Input({ required: true }) row!: InvoiceRow;
  //Parent, give me the actual row data.
  @Input({ required: true }) index!: number;
  //Parent tell me which row I am.
  @Input() isLast = false;
  @Input() lineTotal = 0;
  //Parent, give me the calculated total for this row.

  @Output() equipmentSearch = new EventEmitter<InvoiceRow>();
  //Parent, the user typed something in the equipment name input, please search equipment for this row.
  @Output() equipmentSelected = new EventEmitter<EquipmentCatalogItem>();
  //Parent, the user selected an equipment from the dropdown, please update this row with the equipment data.
  @Output() createEquipment = new EventEmitter<InvoiceRow>();
  //Parent, the user wants to add this equipment to the equipment database.
  @Output() addRowRequested = new EventEmitter<void>();
  @Output() remove = new EventEmitter<number>();

  get equipmentAutocompleteValue(): string | EquipmentCatalogItem {
    return this.row.selectedEquipment ?? this.row.equipmentQuery;
  }

  updateEquipmentQuery(value: string): void {
    this.row.equipmentQuery = value;
    this.row.description = value;
    this.row.selectedEquipment = null;
    this.equipmentSearch.emit(this.row);
  }

  completeEquipment(event: AutoCompleteCompleteEvent): void {
    this.updateEquipmentQuery(event.query);
  }

  handleEquipmentKeyUp(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement | null;

    if (input) {
      this.updateEquipmentQuery(input.value);
    }
  }

  handleEquipmentModelChange(value: string | EquipmentCatalogItem): void {
    if (typeof value === 'string') {
      this.updateEquipmentQuery(value);
      return;
    }

    if (value) {
      this.equipmentSelected.emit(value);
    }
  }

  selectEquipment(event: { value: EquipmentCatalogItem | string }): void {
    let item: EquipmentCatalogItem | undefined;

    if (typeof event.value === 'string') {
      const selectedLabel = event.value;
      item = this.row.equipmentOptions.find(
        (option) =>
          this.normalizedText(option.equipment_name) ===
          this.normalizedText(selectedLabel),
      );
    } else {
      item = event.value;
    }

    if (item) {
      this.equipmentSelected.emit(item);
    }
  }

  selectMatchingEquipmentQuery(): void {
    if (this.row.selectedEquipment) {
      return;
    }

    const item = this.row.equipmentOptions.find(
      (option) =>
        this.normalizedText(option.equipment_name) ===
        this.normalizedText(this.row.equipmentQuery),
    );

    if (item) {
      this.equipmentSelected.emit(item);
    }
  }

  formatMoney(value: number | string): string {
    return new Intl.NumberFormat('fa-IR').format(
      Math.round(Number(value) || 0),
    );
  }

  private normalizedText(value: string): string {
    return value.trim().replaceAll('ك', 'ک').replaceAll('ي', 'ی');
  }
}
