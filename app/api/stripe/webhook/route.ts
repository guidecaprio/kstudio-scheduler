import { NextResponse } from "next/server";
// Placeholder para Stripe webhook (payment_intent.succeeded etc.)
export async function POST(req: Request) {
  // TODO: validar assinatura e processar eventos com STRIPE_WEBHOOK_SECRET
  const _body = await req.text();
  return new NextResponse(null, { status: 200 });
}
