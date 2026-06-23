// ROUTES: Billing (receita SaaS). Plano atual/catálogo + checkout.
import type { FastifyInstance } from 'fastify';
import { BillingController } from '../controllers/billingController.js';

export async function registerBillingRoutes(app: FastifyInstance) {
  app.get('/billing', BillingController.get);
  app.post('/billing/checkout', BillingController.checkout);
}
