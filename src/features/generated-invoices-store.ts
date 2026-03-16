export interface GeneratedInvoiceRecord {
  invoiceId: string;
  propertyId: string;
  unitId: string;
  unitLabel: string;
  period: string;
  generatedAtIso: string;
}

const generatedInvoices: GeneratedInvoiceRecord[] = [];

export function addGeneratedInvoices(
  entries: Omit<GeneratedInvoiceRecord, "invoiceId"> & { invoiceIds: string[] },
) {
  const { invoiceIds, ...rest } = entries;

  for (const invoiceId of invoiceIds) {
    if (generatedInvoices.some((item) => item.invoiceId === invoiceId)) {
      continue;
    }

    generatedInvoices.unshift({
      invoiceId,
      ...rest,
    });
  }
}

export function listGeneratedInvoices() {
  return [...generatedInvoices];
}
