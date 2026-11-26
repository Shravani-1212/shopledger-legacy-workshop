const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');
const reports = require('../lib/reports');

test('invoice uses the same HSN tax slab and total as order pricing', () => {
  const items = [{ id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 1 }];
  const ledgerFigures = pricing.computeTotals(items, '');
  const order = {
    id: 7,
    items,
    subtotal: ledgerFigures.subtotal,
    discount: ledgerFigures.discount,
    tax: ledgerFigures.tax,
    total: ledgerFigures.total
  };

  const invoiceFigures = invoice.computeInvoiceFigures(order);
  assert.equal(invoiceFigures.tax, ledgerFigures.tax);
  assert.equal(invoiceFigures.total, ledgerFigures.total);
  assert.equal(reports.getGstReconciliation({ orders: [order] }).rows[0].matched, true);
});

test('invoice applies coupon to subtotal, with the same validation and caps as order pricing', () => {
  const items = [{ id: 2, name: 'Tea', hsn: '0902', price: 5000, qty: 1 }];
  const ledgerFigures = pricing.computeTotals(items, 'WELCOME');
  const order = { items, coupon: 'WELCOME', total: ledgerFigures.total };

  const invoiceFigures = invoice.computeInvoiceFigures(order);
  assert.equal(invoiceFigures.discount, ledgerFigures.discount);
  assert.equal(invoiceFigures.total, ledgerFigures.total);
});

test('invoice renders the ledger total without a false reconciliation warning', () => {
  const html = invoice.render({
    id: 8,
    customer: 'Walk-in',
    date: '2026-11-26',
    items: [{ name: 'Rice', price: 100, qty: 1, hsn: '1006' }],
    total: 105
  });

  assert.match(html, /Invoice Total<\/td><td class="r">₹105\.00/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
