
# Credits System for InfinUp

## Overview
Add a pay-as-you-go credits system where users get a few free credits to start, then purchase credit packs to generate more learning plans. Each plan generation costs 1 credit.

## How It Works

1. **New users** get 3 free credits when they sign up
2. **Each learning plan** costs 1 credit to generate
3. Users can **buy credit packs** via Stripe (e.g., 5 credits for $4.99, 15 for $9.99, 50 for $24.99)
4. Credit balance is shown in the header and on the profile page
5. If a user has 0 credits, they see an "out of credits" prompt with a buy button instead of the generate form

## What Gets Built

### Database Changes
- New `user_credits` table tracking each user's balance
- New `credit_transactions` table logging purchases and usage (audit trail)
- Database trigger to give 3 free credits on signup
- RLS policies so users can only see their own credits

### Stripe Integration
- Connect Stripe for payment processing
- New edge function to create Stripe checkout sessions for credit packs
- New edge function (webhook) to handle successful payments and add credits
- Pricing tiers: 5 / 15 / 50 credit packs

### Frontend Changes
- **Header**: Show credit balance badge next to the user avatar
- **LearningForm**: Check credits before generating; show "Buy Credits" prompt if balance is 0
- **New Credits Page** (`/credits`): Display balance, purchase history, and buy buttons
- **Profile Page**: Show credit balance in the stats section

### Plan Generation Update
- Before generating a plan, check the user's credit balance
- Deduct 1 credit on successful generation
- If not enough credits, block generation and prompt to buy more

## Pricing Tiers

| Pack | Credits | Price | Per Credit |
|------|---------|-------|------------|
| Starter | 5 | $4.99 | $1.00 |
| Popular | 15 | $9.99 | $0.67 |
| Power | 50 | $24.99 | $0.50 |

## Technical Details

### New Tables

```text
user_credits
-----------
id (uuid, PK)
user_id (uuid, NOT NULL, UNIQUE)
balance (integer, NOT NULL, DEFAULT 0)
created_at (timestamptz)
updated_at (timestamptz)

credit_transactions
-------------------
id (uuid, PK)
user_id (uuid, NOT NULL)
amount (integer) -- positive = purchase, negative = usage
type (text) -- 'purchase', 'usage', 'bonus'
description (text)
stripe_session_id (text, nullable)
created_at (timestamptz)
```

### Edge Functions
- `create-checkout` -- Creates a Stripe checkout session for a credit pack
- `stripe-webhook` -- Handles Stripe payment confirmation, adds credits to user balance

### Flow

```text
User clicks "Buy 15 Credits"
  --> create-checkout edge function
  --> Stripe Checkout page
  --> User pays
  --> Stripe webhook fires
  --> stripe-webhook edge function
  --> Adds 15 credits to user_credits
  --> Logs transaction in credit_transactions
  --> User returns to app, sees updated balance
```

### Credit Check on Plan Generation
- The `generate-learning-plan` edge function (or client-side before calling it) checks `user_credits.balance > 0`
- On success, deducts 1 credit and logs a transaction
- Non-logged-in users can still generate plans freely (or you can require login -- your call)

## Steps to Implement

1. Enable Stripe integration (you'll need your Stripe secret key)
2. Create database tables and triggers
3. Build the checkout and webhook edge functions
4. Add credit balance display to header and profile
5. Add credit check to plan generation flow
6. Build the credits/pricing page
