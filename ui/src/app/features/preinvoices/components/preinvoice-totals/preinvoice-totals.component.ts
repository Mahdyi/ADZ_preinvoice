import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-preinvoice-totals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preinvoice-totals.component.html',
  styleUrl: './preinvoice-totals.component.css',
})
export class PreinvoiceTotalsComponent {
  @Input() subtotal = 0;
  @Input() vat = 0;
  @Input() grandTotal = 0;
  @Input() showVat = true;

  formatMoney(value: number): string {
    return new Intl.NumberFormat('fa-IR').format(
      Math.round(Number(value) || 0),
    );
  }
}
