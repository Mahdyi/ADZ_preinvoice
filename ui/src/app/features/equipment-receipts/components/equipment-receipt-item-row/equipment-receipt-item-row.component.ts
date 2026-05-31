import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import {
  EquipmentReceiptLookupOption,
  EquipmentReceiptRow,
} from '../../models/equipment-receipt.model';

@Component({
  selector: 'app-equipment-receipt-item-row',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoCompleteModule, ButtonModule, InputTextModule],
  templateUrl: './equipment-receipt-item-row.component.html',
  styleUrl: './equipment-receipt-item-row.component.css',
})
export class EquipmentReceiptItemRowComponent {
  @Input({ required: true }) row!: EquipmentReceiptRow;
  @Input({ required: true }) index!: number;

  @Output() equipmentSearch = new EventEmitter<EquipmentReceiptRow>();
  @Output() equipmentSelected =
    new EventEmitter<EquipmentReceiptLookupOption>();
  @Output() removeRequested = new EventEmitter<EquipmentReceiptRow>();

  get equipmentAutocompleteValue(): string | EquipmentReceiptLookupOption {
    return this.row.selectedEquipment ?? this.row.equipmentQuery;
  }

  updateEquipmentQuery(value: string): void {
    this.row.equipmentQuery = value;
    this.row.equipmentName = value;
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

  handleEquipmentModelChange(value: string | EquipmentReceiptLookupOption): void {
    if (typeof value === 'string') {
      this.updateEquipmentQuery(value);
      return;
    }

    if (value) {
      this.equipmentSelected.emit(value);
    }
  }

  selectEquipment(event: { value: EquipmentReceiptLookupOption | string }): void {
    let option: EquipmentReceiptLookupOption | undefined;

    if (typeof event.value === 'string') {
      const selectedLabel = event.value;
      option = this.row.equipmentOptions.find(
        (item) =>
          this.normalizedText(item.equipmentName) ===
          this.normalizedText(selectedLabel),
      );
    } else {
      option = event.value;
    }

    if (option) {
      this.equipmentSelected.emit(option);
    }
  }

  selectMatchingEquipmentQuery(): void {
    if (this.row.selectedEquipment) {
      return;
    }

    const option = this.row.equipmentOptions.find(
      (item) =>
        this.normalizedText(item.equipmentName) ===
        this.normalizedText(this.row.equipmentQuery),
    );

    if (option) {
      this.equipmentSelected.emit(option);
    }
  }

  private normalizedText(value: string): string {
    return value.trim().replaceAll('ك', 'ک').replaceAll('ي', 'ی');
  }
}
