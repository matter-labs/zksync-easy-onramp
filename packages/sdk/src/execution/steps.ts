import type { QuoteStepOnrampViaLink, } from "@sdk/types/server";

export async function executeOnRampLinkStep(step: QuoteStepOnrampViaLink,): Promise<any> {
  return new Promise((resolve, reject,) => {
    const paymentWindow = window.open(step.link, "_blank", "width=600,height=800",);

    if (!paymentWindow) {
      reject(new Error("Payment window failed to open.",),);
      return;
    }

    const checkWindowClosed = setInterval(() => {
      if (paymentWindow?.closed) {
        clearInterval(checkWindowClosed,);
        window.removeEventListener("message", onRampListener,);
        reject(new Error("Payment window was closed before completing the process.",),);
      }
    }, 1000,);

    const onRampListener = (event: { origin: string; data: { payload: { orderId: string; }; }; },) => {
      if (event.origin !== new URL(step.link,).origin) {
        return;
      }

      const { orderId, } = event.data.payload;
      if (orderId) {
        clearInterval(checkWindowClosed,);
        window.removeEventListener("message", onRampListener,);
        resolve(orderId,);
        paymentWindow?.close();
      } else {
        reject(new Error("No orderId received",),);
      }
    };

    window.addEventListener("message", onRampListener,);
  },);
}
