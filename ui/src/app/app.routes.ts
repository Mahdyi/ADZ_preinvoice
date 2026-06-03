import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { DashboardPageComponent } from './features/dashboard/pages/dashboard-page/dashboard-page.component';
import { EquipmentReceiptsListPageComponent } from './features/equipment-receipts/pages/equipment-receipts-list-page/equipment-receipts-list-page.component';
import { EquipmentReceiptPageComponent } from './features/equipment-receipts/pages/equipment-receipt-page/equipment-receipt-page.component';
import { PreinvoiceEditorPageComponent } from './features/preinvoices/pages/preinvoice-editor-page/preinvoice-editor-page.component';
import { PreinvoiceListPageComponent } from './features/preinvoices/pages/preinvoice-list-page/preinvoice-list-page.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'preinvoices/new', component: PreinvoiceEditorPageComponent },
      { path: 'preinvoices', component: PreinvoiceListPageComponent },
      {
        path: 'equipment-receipts/new',
        component: EquipmentReceiptPageComponent,
      },
      {
        path: 'equipment-receipts',
        component: EquipmentReceiptsListPageComponent,
      },
      {
        path: 'preinvoices-list',
        redirectTo: 'preinvoices',
        pathMatch: 'full',
      },
      {
        path: 'equipment-receipt',
        redirectTo: 'equipment-receipts/new',
        pathMatch: 'full',
      },
      {
        path: 'equipment-receipts-list',
        redirectTo: 'equipment-receipts',
        pathMatch: 'full',
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
