export interface SingleProductOptions {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  catalogId: string;
  productRetailerId: string;
  bodyText?: string;
  footerText?: string;
}

export interface MultiProductSection {
  title: string;
  productRetailerIds: string[];
}

export interface MultiProductOptions {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  catalogId: string;
  headerText: string;
  bodyText: string;
  footerText?: string;
  sections: MultiProductSection[];
}

export interface CatalogProductSyncItem {
  id: string;
  name: string;
  description?: string;
  price: string;
  image?: string | null;
  stockStatus?: string;
  url?: string;
}

export interface CatalogSyncOptions {
  catalogId: string;
  accessToken: string;
  products: CatalogProductSyncItem[];
}
