import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

interface DashboardAction {
  title: string;
  description: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, CardModule],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent {
  readonly actions: DashboardAction[] = [
    {
      title: 'ثبت پیش فاکتور جدید',
      description: 'ایجاد پیش فاکتور برای مشتری و تجهیزات کالیبراسیون',
      route: '/preinvoices/new',
      icon: 'pi pi-file-edit',
    },
    {
      title: 'مشاهده پیش فاکتورها',
      description: 'بررسی، ویرایش و چاپ پیش فاکتورهای ثبت شده',
      route: '/preinvoices',
      icon: 'pi pi-list',
    },
    {
      title: 'ثبت رسید تجهیزات',
      description: 'ثبت رسید دریافت تجهیزات برای شروع فرایند کاری',
      route: '/equipment-receipts/new',
      icon: 'pi pi-receipt',
    },
    {
      title: 'مشاهده رسیدهای تجهیزات',
      description: 'مشاهده، ویرایش و چاپ رسیدهای تجهیزات',
      route: '/equipment-receipts',
      icon: 'pi pi-table',
    },
  ];
}
