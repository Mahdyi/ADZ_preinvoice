export interface Customer {
  id?: number;
  national_id: string | null;
  economic_code: string | null;
  postal_code: string | null;
  address: string | null;
  phone: string | null;
  code: string | null;
  title: string;
  created_at?: string;
}

export type CustomerDraft = Omit<Customer, 'id' | 'created_at'>;

export const emptyCustomer: CustomerDraft = {
  national_id: null,
  economic_code: null,
  postal_code: null,
  address: null,
  phone: null,
  code: null,
  title: '',
};
