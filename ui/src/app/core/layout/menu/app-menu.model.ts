export interface AppMenuItem {
  label: string;
  route: string;
  icon: string;
}

export interface AppMenuGroup {
  label: string;
  items: AppMenuItem[];
}

export const APP_MENU: AppMenuGroup[] = [
  {
    label: 'اصلی',
    items: [
      {
        label: 'داشبورد',
        route: '/dashboard',
        icon: 'pi pi-home',
      },
    ],
  },
  {
    label: 'مشتریان',
    items: [
      {
        label: 'ورود مشتریان از اکسل',
        route: '/customers/import',
        icon: 'pi pi-file-import',
      },
    ],
  },
  {
    label: 'پیش فاکتورها',
    items: [
      {
        label: 'ثبت پیش فاکتور',
        route: '/preinvoices/new',
        icon: 'pi pi-file-edit',
      },
      {
        label: 'لیست پیش فاکتورها',
        route: '/preinvoices',
        icon: 'pi pi-list',
      },
    ],
  },
  {
    label: 'رسید تجهیزات',
    items: [
      {
        label: 'ثبت رسید تجهیزات',
        route: '/equipment-receipts/new',
        icon: 'pi pi-receipt',
      },
      {
        label: 'لیست رسیدهای تجهیزات',
        route: '/equipment-receipts',
        icon: 'pi pi-table',
      },
    ],
  },
];
