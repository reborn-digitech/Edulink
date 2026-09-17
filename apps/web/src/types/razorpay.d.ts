/**
 * The Razorpay checkout script, as much of it as the family's fees page uses.
 *
 * https://checkout.razorpay.com/v1/checkout.js is injected once by
 * `online-flow.tsx` when the school's gateway transport is the real one; it
 * defines `window.Razorpay`. No SDK and no typings package, like gateway.ts.
 */
interface RazorpayCheckoutResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: RazorpayCheckoutResponse) => void;
  modal?: { ondismiss?: () => void; escape?: boolean };
}

interface RazorpayCheckout {
  open(): void;
  on(event: "payment.failed", handler: (response: { error?: { description?: string } }) => void): void;
}

interface Window {
  Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckout;
}
