export const PAYMENT_TERM_OPTIONS = [
    'Cash',
    'Spot Cash',
    'Deferred Cash',
    'Installment',
    'Bank Financing',
    'In-House Financing',
    'Pag-IBIG Financing',
    'Rent-to-Own',
    'Lease-to-Own',
    'Assumption of Mortgage',
    'Seller Financing',
    'Monthly',
    'Quarterly',
    'Semi-Annually',
    'Annually',
    'Advance + Security Deposit',
    'Reservation Fee',
    'Custom',
];

export function parsePaymentTerms(value) {
    const selected = [];
    const seen = new Set();

    String(value || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => {
            if (PAYMENT_TERM_OPTIONS.includes(part)) {
                if (!seen.has(part)) {
                    seen.add(part);
                    selected.push(part);
                }
                return;
            }

            if (!seen.has('Custom')) {
                seen.add('Custom');
                selected.push('Custom');
            }
        });

    return selected;
}

export function serializePaymentTerms(selected = []) {
    const terms = [...new Set(
        (Array.isArray(selected) ? selected : [])
            .map((term) => String(term || '').trim())
            .filter(Boolean),
    )];

    return terms.length ? terms.join(', ') : '';
}

export function formatPaymentTermsDisplay(value) {
    const text = serializePaymentTerms(parsePaymentTerms(value));
    return text || '—';
}
