import { Routes } from '@angular/router';
import { PreinvoiceEditorPageComponent } from './features/preinvoices/pages/preinvoice-editor-page/preinvoice-editor-page.component';
import { PreinvoiceListPageComponent } from './features/preinvoices/pages/preinvoice-list-page/preinvoice-list-page.component';

export const routes: Routes = [
  { path: '', component: PreinvoiceEditorPageComponent },
  { path: 'preinvoices-list', component: PreinvoiceListPageComponent },
  { path: '**', redirectTo: '' },
];
