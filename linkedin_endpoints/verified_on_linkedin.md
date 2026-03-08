---
layout: Conceptual
title: Verified on LinkedIn – Overview - LinkedIn | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/verified-on-linkedin/overview
breadcrumb_path: /linkedin/breadcrumb/toc.json
recommendations: false
feedback_system: Standard
feedback_product_url: https://linkedin.zendesk.com/hc/en-us
uhfHeaderId: MSDocsHeader-LinkedIn
ms.subservice: consumer
description: Access trusted verification signals from LinkedIn members to build trust and authenticity into your platform.
author: asroy
ms.author: li_asroy
ms.date: 2024-11-13T00:00:00.0000000Z
ms.topic: overview
ms.service: linkedin
locale: en-us
document_id: 79461a24-97a3-4cea-0951-2b0bc0d29d2b
document_version_independent_id: 79461a24-97a3-4cea-0951-2b0bc0d29d2b
updated_at: 2026-02-18T07:08:00.0000000Z
original_content_git_url: https://github.com/MicrosoftDocs/linkedin-api-docs/blob/live/linkedin-api-docs/consumer/integrations/verified-on-linkedin/overview.md
gitcommit: https://github.com/MicrosoftDocs/linkedin-api-docs/blob/e1561b57a7edef752bb7863962dfe2f166780b7d/linkedin-api-docs/consumer/integrations/verified-on-linkedin/overview.md
git_commit_id: e1561b57a7edef752bb7863962dfe2f166780b7d
site_name: Docs
depot_name: MSDN.linkedin-api-docs
page_type: conceptual
toc_rel: ../../toc.json
feedback_help_link_type: ''
feedback_help_link_url: ''
word_count: 842
asset_id: consumer/integrations/verified-on-linkedin/overview
moniker_range_name: 
monikers: []
item_type: Content
source_path: linkedin-api-docs/consumer/integrations/verified-on-linkedin/overview.md
cmProducts:
- https://microsoft-devrel.poolparty.biz/DevRelOfferingOntology/aec7dc3e-0dad-4b82-accf-63218d8767d5
spProducts:
- https://microsoft-devrel.poolparty.biz/DevRelOfferingOntology/f260444a-7ec6-4768-8e41-ad2438092724
platformId: dc861cd5-5131-be74-5971-b85aca77ddd8
---

# Verified on LinkedIn – Overview - LinkedIn | Microsoft Learn

The Verified on LinkedIn API allows you to access trusted verification signals from LinkedIn members, enabling you to display verified identity and workplace information directly within your platform.

Today, more than **100 million LinkedIn members** have confirmed their identity with a government-issued ID or verified their workplace using a company email. [Read more about LinkedIn verifications](https://www.linkedin.com/help/linkedin/answer/a1359065).

Build trust and authenticity into your platform by leveraging LinkedIn's verification ecosystem, helping you distinguish real professionals from fraudulent accounts.

##### Watch the Verified on LinkedIn overview video

## Try it Now - It only takes 10 minutes

It just takes **10 minutes** to make your first API call. Refer to our [Quickstart Guide](guides/quickstart).

## Use Cases

### What Verified on LinkedIn Can Be Used For

| Category | Examples |
| --- | --- |
| **Trust & Safety** | Professional communities, networking platforms, online marketplaces, peer-to-peer exchanges |
| **Communities & Networks** | Event registration, professional conferences, community moderation, alumni groups |
| **Marketplaces** | Buyer/seller verification, freelance platforms, service-sharing, resale platforms |

### What Verified on LinkedIn Cannot Be Used For

The API is designed for **trust enhancement**, not **regulatory compliance** or **eligibility decisions**. Use of the API is subject to LinkedIn's **Developer Terms and Verification Policies**.

| Restricted Use Case | Reason |
| --- | --- |
| **Hiring or employment decisions** | Not an employment screening tool. Do not use to rank or approve candidates. |
| **Background checks** | Does not include criminal, financial, or government background data. |
| **Credit, loans, or insurance** | Not related to creditworthiness or insurability. |
| **Housing eligibility** | Cannot be used for rental or housing determinations. |
| **Fintech or banking KYC** | Not a regulated KYC/AML service. |
| **Government or regulated identity checks** | Not a substitute for official ID verification systems. |
| **Platform safety or risk scoring** | Should complement — not replace your platform's trust and risk systems. |

## Choose Your Tier

LinkedIn offers **three tiers** of the Verified on LinkedIn API, each designed for different use cases and stages of development.

| Tier | Best For | Access | Cost | Rate Limits | Get Started |
| --- | --- | --- | --- | --- | --- |
| **Development** | Testing & prototyping | Developer app admins only | Free | 5,000/day | [Development Tier Quickstart (10 min)](guides/quickstart) |
| **Lite** | SMBs & startups | All LinkedIn members | Free | 5,000/day | [Lite Tier Quickstart](guides/upgrade-to-lite-tier) |
| **Plus** | Enterprise partners | All LinkedIn members + enhanced data | Contact us | Custom | [Plus Tier Quickstart](guides/plus-tier/quickstart) |

### Detailed Tier Comparison

| Feature | Development | Lite | Plus |
| --- | --- | --- | --- |
| **Access Type** | Self-serve (automatic) | Application review | Business Development approval |
| **Member Data Access** | Developer app admins only | All LinkedIn members | All LinkedIn members |
| **Production Ready** | ❌ Testing only | ✅ Yes | ✅ Yes |
| **Profile Data** | Basic profile info | Basic profile info | Basic profile info + Current experience + Recent education |
| **Verification Details** | Verified categories only | Verified categories only | Verified Categories + Details + Timestamps |
| **Bulk Validation API** | ❌ | ❌ | Validate if the member data has changed and needs to be refreshed |
| **Push Notifications** | ❌ | ❌ | Get push notification events when a member data has changed |

Note

For Plus tier pricing and partnership inquiries, [contact LinkedIn Business Development](https://about.linkedin.com/verified-on-linkedin).

## Verification Types

| Type | Description | Methods | Data Available |
| --- | --- | --- | --- |
| **Identity Verification** | Confirms the member's real identity | Government-issued ID | Verified Categories (all tiers), Verification details (Plus tier) |
| **Workplace Verification** | Confirms current association with a company | Work email, Microsoft Entra Verified ID | Verified Categories (all tiers), Organization details (Plus tier) |

## How It Works

- **Member Authorizes**: Grants your app permission to access their LinkedIn verification data via OAuth 2.0.
- **Fetch Verification Data**: Call LinkedIn APIs to retrieve verification status and profile information.
- **Display Verification Badges**: Show "Verified on LinkedIn" badges in your UI following our [branding guidelines](branding-ux-guidelines) if the member is verified.

## Quick Navigation

### By Role

| Who You Are | Where to Start |
| --- | --- |
| **Developer** | Pick a quickstart → [API Reference](api-reference/identity-me) → [Implementation Guide](guides/implementation-guide) |
| **Product Manager** | Use Cases → Tier comparison (above) → Pick a quickstart |
| **Marketing & Design** | [Branding Guidelines](branding-ux-guidelines) → Use Cases |

### By Goal

| I Want To... | Go Here |
| --- | --- |
| **Test the API quickly** | [Quickstart (Development Tier)](guides/quickstart) - 10 minutes |
| **Launch in production** | [Upgrade to Lite Tier](guides/upgrade-to-lite-tier) |
| **Get enterprise features** | [Plus Tier Quickstart](guides/plus-tier/quickstart) |
| **See API docs** | [API Reference](api-reference/identity-me) |
| **Understand use cases** | Use Cases |
| **Display badges correctly** | [Branding Guidelines](branding-ux-guidelines) |

## API Reference

All tiers use the same API endpoints with different access levels:

| API | Purpose | Development | Lite | Plus |
| --- | --- | --- | --- | --- |
| **[/identityMe](api-reference/identity-me)** | Profile data | Basic profile | Basic profile | Basic profile + current Experience + recent Education |
| **[/verificationReport](api-reference/verification-report)** | Verification status | Categories only | Categories only | Categories + Verification details |
| **[/validationStatus](api-reference/validation-status)** | Bulk validation | ❌ | ❌ | Validation statuses of Profile + Verification Information |

[View complete API reference →](api-reference/authentication)

## Getting Started

### Step 1: Choose Your Tier

Review the tier comparison table above to find the right tier for your needs.

### Step 2: Follow the Quickstart

- **[Quickstart (Development Tier)](guides/quickstart)** - Test with developer app admins (10 min)
- **[Upgrade to Lite Tier](guides/upgrade-to-lite-tier)** - Production for SMBs
- **[Plus Tier Quickstart](guides/plus-tier/quickstart)** - Enterprise features

### Step 3: Implement & Launch

- Follow the [Implementation Guide](guides/implementation-guide) for API Integration, OAuth, testing, and production best practices.
- Review [Branding Guidelines](branding-ux-guidelines)
- Check our [FAQ](faq) for common questions

## Support & Resources

### Documentation

- **[API Reference](api-reference/authentication)** - Complete API documentation
- **[Common FAQ](faq)** - Frequently asked questions
- **[Release Notes](release-notes)** - API updates and changes

### Tools

- **[Sample App](https://verified-on-linkedin-app.vercel.app/)** - Test OAuth flow and API calls
- **[Developer Portal](https://www.linkedin.com/developers/apps)** - Manage your applications
- **[OAuth Tool](https://www.linkedin.com/developers/tools/oauth)** - Generate test tokens

### Help

- **[LinkedIn API Status](https://www.linkedin-apistatus.com/)** - Monitor API health
- **[Partner Support](faq)** - Get help from LinkedIn team