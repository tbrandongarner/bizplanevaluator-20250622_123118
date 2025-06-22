function validateNonNegativeNumber(value, name) {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a finite non-negative number.`);
  }
}

function validatePlainObject(obj, name) {
  if (
    typeof obj !== 'object' ||
    obj === null ||
    Array.isArray(obj) ||
    Object.getPrototypeOf(obj) !== Object.prototype
  ) {
    throw new Error(`${name} must be a plain object.`);
  }
}

/**
 * Calculate total revenue.
 * baseRevenue = price * units
 * @param {object} inputs
 * @param {number} inputs.price
 * @param {number} inputs.units
 * @returns {number}
 */
function calculateRevenue(inputs) {
  const { price, units } = inputs;
  validateNonNegativeNumber(price, 'price');
  validateNonNegativeNumber(units, 'units');
  return price * units;
}

/**
 * Calculate total expenses.
 * Expects inputs.expenses to be a plain object of non-negative numbers.
 * @param {object} inputs
 * @param {object} inputs.expenses
 * @returns {number}
 */
function calculateExpenses(inputs) {
  const { expenses } = inputs;
  validatePlainObject(expenses, 'expenses');
  let total = 0;
  for (const [key, value] of Object.entries(expenses)) {
    validateNonNegativeNumber(value, `expenses.${key}`);
    total += value;
  }
  return total;
}

/**
 * Build cash flow schedule for a single period.
 * cashFlow = revenue - expenses.
 * @param {number} revenue
 * @param {number} expenses
 * @returns {number}
 */
function buildCashFlowSchedule(revenue, expenses) {
  if (Array.isArray(revenue) || Array.isArray(expenses)) {
    throw new Error('Revenue and expenses must both be numbers.');
  }
  validateNonNegativeNumber(revenue, 'revenue');
  validateNonNegativeNumber(expenses, 'expenses');
  return revenue - expenses;
}

/**
 * Run financial models: revenue, expenses, cash flow.
 * @param {object} inputs
 * @returns {{ revenue: number, expenses: number, cashFlow: number }}
 */
function runFinancialModels(inputs) {
  if (typeof inputs !== 'object' || inputs === null) {
    throw new Error('Inputs must be a non-null object.');
  }
  const revenue = calculateRevenue(inputs);
  const expenses = calculateExpenses(inputs);
  const cashFlow = buildCashFlowSchedule(revenue, expenses);
  return { revenue, expenses, cashFlow };
}

module.exports = runFinancialModels;