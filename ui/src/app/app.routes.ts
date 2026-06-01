import { Routes } from '@angular/router';
import { EquipmentReceiptsListPageComponent } from './features/equipment-receipts/pages/equipment-receipts-list-page/equipment-receipts-list-page.component';
import { EquipmentReceiptPageComponent } from './features/equipment-receipts/pages/equipment-receipt-page/equipment-receipt-page.component';
import { PreinvoiceEditorPageComponent } from './features/preinvoices/pages/preinvoice-editor-page/preinvoice-editor-page.component';
import { PreinvoiceListPageComponent } from './features/preinvoices/pages/preinvoice-list-page/preinvoice-list-page.component';

export const routes: Routes = [
  { path: '', component: PreinvoiceEditorPageComponent },
  { path: 'equipment-receipt', component: EquipmentReceiptPageComponent },
  {
    path: 'equipment-receipts-list',
    component: EquipmentReceiptsListPageComponent,
  },
  { path: 'preinvoices-list', component: PreinvoiceListPageComponent },
  { path: '**', redirectTo: '' },
];
