const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });
const SubscriptionModel = require('../models/Subscription');

async function createSubscription(userId, email, tierId) {
  if (!userId || !email || !tierId) {
    throw new Error('Missing parameters for subscription creation');
  }

  try {
    // Prevent duplicate active subscriptions for the same tier
    const existingActive = await SubscriptionModel.findOne({
      userId,
      tier: tierId,
      status: { $in: ['active', 'trialing'] }
    });
    if (existingActive) {
      // Return Stripe subscription object if already active
      return await stripe.subscriptions.retrieve(existingActive.stripeSubId);
    }

    // Reuse existing Stripe customer if available
    let customerId;
    const existingCustomerRecord = await SubscriptionModel.findOne({
      userId,
      stripeCustomerId: { $exists: true }
    });
    if (existingCustomerRecord && existingCustomerRecord.stripeCustomerId) {
      customerId = existingCustomerRecord.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create(
        { email, metadata: { userId } },
        { idempotencyKey: `customer_${userId}` }
      );
      customerId = customer.id;
    }

    // Create new subscription on Stripe
    const subscription = await stripe.subscriptions.create(
      {
        customer: customerId,
        items: [{ price: tierId }],
        expand: ['latest_invoice.payment_intent']
      },
      { idempotencyKey: `subscription_${userId}_${tierId}` }
    );

    // Persist subscription in our database
    await SubscriptionModel.create({
      userId,
      stripeCustomerId: customerId,
      stripeSubId: subscription.id,
      tier: tierId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });

    return subscription;
  } catch (err) {
    console.error(`Error creating subscription for user ${userId}:`, err);
    throw new Error('Failed to create subscription');
  }
}

/**
 * Stripe webhook handler.
 * Make sure your Express route uses:
 *   express.raw({ type: 'application/json' })
 * so req.rawBody is populated correctly for signature verification.
 */
async function handleStripeWebhook(req, res) {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const data = event.data.object;

  try {
    switch (event.type) {
      case 'invoice.paid':
        if (data.subscription) {
          await SubscriptionModel.findOneAndUpdate(
            { stripeSubId: data.subscription },
            {
              status: 'active',
              currentPeriodStart: new Date(data.period_start * 1000),
              currentPeriodEnd: new Date(data.period_end * 1000),
              lastInvoiceId: data.id
            },
            { new: true }
          );
        }
        break;

      case 'invoice.payment_failed':
        if (data.subscription) {
          await SubscriptionModel.findOneAndUpdate(
            { stripeSubId: data.subscription },
            {
              status: 'past_due',
              lastInvoiceId: data.id
            },
            { new: true }
          );
        }
        break;

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`Error processing Stripe webhook event ${event.type}:`, err);
    res.status(500).send('Internal server error');
  }
}

module.exports = {
  createSubscription,
  handleStripeWebhook
};