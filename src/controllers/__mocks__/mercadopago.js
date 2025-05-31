// src/controllers/__mocks__/mercadopago.js
import { jest } from '@jest/globals';

const mockPaymentCreateInstance = jest.fn();
const MockPaymentClassSingleton = jest.fn(() => ({
  create: mockPaymentCreateInstance,
}));

// This is what will be returned when 'mercadopago' is imported in a test file
// or any file being tested.
export const MercadoPagoConfig = jest.fn().mockImplementation(() => ({}));
export const Payment = MockPaymentClassSingleton;
export const Preference = jest.fn();

// Helper to access the core mock function for assertions if needed,
// though it's better to assert on the behavior of the class/methods.
export const __getMockPaymentCreateInstance = () => mockPaymentCreateInstance;
export const __getMockPaymentClassSingleton = () => MockPaymentClassSingleton;
