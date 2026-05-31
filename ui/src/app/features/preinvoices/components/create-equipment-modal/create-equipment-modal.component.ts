import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { EquipmentCatalogDraft } from '../../../equipment/models/equipment.model';

@Component({
  selector: 'app-create-equipment-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
  ],
  templateUrl: './create-equipment-modal.component.html',
  styleUrl: './create-equipment-modal.component.css',
})
export class CreateEquipmentModalComponent {
  @Input({ required: true }) equipment!: EquipmentCatalogDraft;
  @Input() rowNumber = 1;
  @Input() quantity = 1;
  @Input() note = '';
  @Input() calPosition = '';
  @Input() lineTotal = '';

  @Output() quantityChange = new EventEmitter<number>();
  @Output() noteChange = new EventEmitter<string>();
  @Output() calPositionChange = new EventEmitter<string>();
  @Output() closeRequested = new EventEmitter<void>();
  @Output() saveRequested = new EventEmitter<void>();
}
