import { ProductType, TransactionType, TransactionCategory, ClientType, ContactMethod } from '../types';

type TFunc = (key: string) => string;

const PRODUCT_TYPE_KEYS: Record<string, string> = {
  [ProductType.BEVERAGE]: 'enum.productType.beverage',
  [ProductType.CRATE]: 'enum.productType.crate',
  [ProductType.ACCESSORY]: 'enum.productType.accessory',
  [ProductType.OTHER]: 'enum.productType.other',
};

const TRANSACTION_TYPE_KEYS: Record<string, string> = {
  [TransactionType.INCOME]: 'enum.transactionType.income',
  [TransactionType.EXPENSE]: 'enum.transactionType.expense',
  [TransactionType.TRANSFER]: 'enum.transactionType.transfer',
};

const TRANSACTION_CATEGORY_KEYS: Record<string, string> = {
  [TransactionCategory.SALES]: 'enum.transactionCategory.sales',
  [TransactionCategory.PURCHASE]: 'enum.transactionCategory.purchase',
  [TransactionCategory.SALARY]: 'enum.transactionCategory.salary',
  [TransactionCategory.OTHER]: 'enum.transactionCategory.other',
};

const CLIENT_TYPE_KEYS: Record<string, string> = {
  [ClientType.INDIVIDUAL]: 'enum.clientType.individual',
  [ClientType.COMPANY]: 'enum.clientType.company',
  [ClientType.WHOLESALE]: 'enum.clientType.wholesale',
  [ClientType.SIMPLE_CLIENT]: 'enum.clientType.simple',
};

const CONTACT_METHOD_KEYS: Record<string, string> = {
  [ContactMethod.PHONE]: 'enum.contactMethod.phone',
  [ContactMethod.EMAIL]: 'enum.contactMethod.email',
  [ContactMethod.WHATSAPP]: 'enum.contactMethod.whatsapp',
};

/** Libellé traduit pour une valeur d'énumération (évite beverage / income en FR) */
export function enumLabel(t: TFunc, group: 'productType' | 'transactionType' | 'transactionCategory' | 'clientType' | 'contactMethod', value: string): string {
  const maps = {
    productType: PRODUCT_TYPE_KEYS,
    transactionType: TRANSACTION_TYPE_KEYS,
    transactionCategory: TRANSACTION_CATEGORY_KEYS,
    clientType: CLIENT_TYPE_KEYS,
    contactMethod: CONTACT_METHOD_KEYS,
  };
  const key = maps[group][value];
  if (key) {
    const translated = t(key);
    if (translated !== key) return translated;
  }
  return value;
}
