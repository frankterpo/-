---
layout: Conceptual
monikers:
- li-lms-2025-03
- li-lms-2025-04
- li-lms-2025-05
- li-lms-2025-06
- li-lms-2025-07
- li-lms-2025-08
- li-lms-2025-09
- li-lms-2025-10
- li-lms-2025-11
- li-lms-2026-01
- li-lms-2026-02
defaultMoniker: li-lms-2026-02
versioningType: Ranged
title: Event Management Overview - LinkedIn | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/linkedin/marketing/event-management/event-management-overview?view=li-lms-2026-02
config_moniker_range: li-lms-2025-03 || li-lms-2025-04 || li-lms-2025-05 || li-lms-2025-06 || li-lms-2025-07 || li-lms-2025-08 || li-lms-2025-09 || li-lms-2025-10 || li-lms-2025-11 || li-lms-2026-01 || li-lms-2026-02
breadcrumb_path: /linkedin/breadcrumb/toc.json
recommendations: false
feedback_system: Standard
feedback_product_url: https://linkedin.zendesk.com/hc/en-us
uhfHeaderId: MSDocsHeader-LinkedIn
description: overview page that explains LinkedIn Event Management API.
ms.topic: article
ms.service: linkedin
ms.subservice: marketing
ms.author: li_dramesh
ms.date: 2025-02-05T00:00:00.0000000Z
author: Deeksha-ramesh
locale: en-us
document_id: 41f034fd-9b7f-cfd0-99f7-e47d153ca2dc
document_version_independent_id: 41f034fd-9b7f-cfd0-99f7-e47d153ca2dc
updated_at: 2026-01-28T07:04:00.0000000Z
original_content_git_url: https://github.com/MicrosoftDocs/linkedin-api-docs/blob/live/linkedin-api-docs/marketing/event-management/event-management-overview.md
gitcommit: https://github.com/MicrosoftDocs/linkedin-api-docs/blob/79c72af5c5c8e67b142a428c5168f0e5a336d6ee/linkedin-api-docs/marketing/event-management/event-management-overview.md
git_commit_id: 79c72af5c5c8e67b142a428c5168f0e5a336d6ee
default_moniker: li-lms-2026-02
site_name: Docs
depot_name: MSDN.linkedin-api-docs
page_type: conceptual
toc_rel: ../toc.json
feedback_help_link_type: ''
feedback_help_link_url: ''
word_count: 933
asset_id: marketing/event-management/event-management-overview
moniker_range_name: 095c9635aa5a9905976075d55917155a
monikers:
- li-lms-2025-03
- li-lms-2025-04
- li-lms-2025-05
- li-lms-2025-06
- li-lms-2025-07
- li-lms-2025-08
- li-lms-2025-09
- li-lms-2025-10
- li-lms-2025-11
- li-lms-2026-01
- li-lms-2026-02
item_type: Content
source_path: linkedin-api-docs/marketing/event-management/event-management-overview.md
cmProducts:
- https://microsoft-devrel.poolparty.biz/DevRelOfferingOntology/aec7dc3e-0dad-4b82-accf-63218d8767d5
- https://microsoft-devrel.poolparty.biz/DevRelOfferingOntology/c0439c36-80e3-415f-8e4c-6951e3f1b136
spProducts:
- https://microsoft-devrel.poolparty.biz/DevRelOfferingOntology/f260444a-7ec6-4768-8e41-ad2438092724
- https://microsoft-devrel.poolparty.biz/DevRelOfferingOntology/2812d699-d85f-4a7f-839d-44e218b35d24
platformId: 249b684f-a569-4204-942d-9a18f02d0044
---

# Event Management Overview - LinkedIn | Microsoft Learn

Warning

**Deprecation Notice:** The Marketing Version 202502 (Marketing February 2025) has been sunset. We recommend that you migrate to the latest [versioned APIs](../versioning) to avoid disruptions. For information on all the supported versions, refer to the [migrations](../integrations/migrations#api-migration-status) documentation. If you haven’t yet migrated and have questions, submit a request on the [LinkedIn Developer Support Portal](https://linkedin.zendesk.com/hc/en-us).

The Event Management APIs enable developers to create, manage, and promote LinkedIn Events (both on and off-platform) for their clients. This includes event creation, updates, visibility/registration management, and access to comprehensive performance data. Paid and organic performance data are available via the Advertising API's [Ad Analytics](../integrations/ads-reporting/ads-reporting) with organic data also accessible through the Community Management API's [Share Statistics](../community-management/organizations/share-statistics). The API comprises two main components:

- **[Event Management API](events):** Streamline event creation and management on LinkedIn. Seamlessly create, update, and manage both on- and off-platform LinkedIn Events directly from your preferred platform.
- **[Event Ads API](../integrations/ads/advertising-targeting/version/event-ads-integrations)**: Amplify event reach and engagement on LinkedIn. Automate event ad creation, management, and performance to connect with a professional audience and drive event success

## Use Cases

### Event Management API - Use Cases

- **Seamless Event Creation and Management:** Use the Event Management API to create, update, and manage both on- and off-platform LinkedIn Events directly from your preferred event technology platform. Streamline event setup, registration management, and attendee communication.
- **Event Registrations**: Use the Event Management API to attach a custom registration form during event creation. This allows for a frictionless registration process for LinkedIn members and guarantees relevant information is collected for all attendees of the event. Note - you’ll need to request access to the Advertising API product to create a custom registration form. Registration form data can be downloaded manually from the Event Details Page UI or the Lead Sync API can be used to sync event leads and have them automatically flow through to existing CRMs or other data hubs. Registration forms must be created and approved before they can be attached to an event. A registration form can only be added at the point of event creation and can't be edited after it's attached.
- **Event Control Center**: Leverage the Event Management API to create a centralized place for all event-related activities, integrating LinkedIn events into existing workflows and dashboards within your chosen event platform.
- **Automated Event Updates**: Use the Event Management API to automate event updates and synchronize data between your event platform and LinkedIn, ensuring consistency and eliminating manual data entry.
- **Unified Event Measurement and Reporting**: Combine data from your event platform and LinkedIn using the Event Management API to gain a holistic view of event performance, including registration data, attendance metrics, and engagement insights (leveraging [Share Statistics](../community-management/organizations/share-statistics), within the Community Management API).

### Event Ads API - Use cases

- **Simplified Event Promotion at Scale:** Use the Event Ads API to create and manage large-scale LinkedIn ad campaigns promoting events to precisely defined professional audiences. Leverage automated campaign creation and management to efficiently reach a broad audience and drive event registrations.
- **Amplifying In-Person, Virtual, and Hybrid Events:** Use the Event Ads API to boost awareness and registrations for all event types – in-person, virtual, and hybrid. Promote events before, during, and after they occur, maximizing reach and engagement throughout the event lifecycle.
- **Driving Measurable Event Growth:**Use the Event Ads API to track event ad performance and measure the impact of your campaigns on registrations, attendance, and post-event engagement. Access comprehensive data and analytics to optimize campaigns and demonstrate the ROI of your event marketing efforts.
    - **Pre-Event Promotion:** Use the Event Ads API to create targeted ad campaigns that drive awareness and registrations for upcoming events. Reach specific professional audiences with compelling ad creatives and drive traffic to event registration pages.
    - **During-Event Engagement:** Use the Event Ads API to promote live virtual events on LinkedIn and interact with attendees in real-time. Extend the reach of your live events and engage with a wider audience beyond those directly participating.
    - **Post-Event Follow-Up:** Re-engage event attendees and connect with those who couldn't attend using the [Matched Audiences API](../matched-audiences/matched-audiences) and event engagement retargeting. Share post-event content, highlight key takeaways, and nurture leads, extending the value of your event.
- **Driving Measurable Event Growth:** Use the Event Ads API to track event ad performance and measure the impact of your campaigns on registrations, attendance, and post-event engagement. Access comprehensive data and analytics to optimize campaigns and demonstrate the ROI of your event marketing efforts.

### Combined Use cases (Event Management & Event Ads)

Combine the Event Management and Event Ads APIs to manage the entire event lifecycle from creation and promotion to post-event engagement and analysis via [Share Statistics](../community-management/organizations/share-statistics) for organic reporting and [Ad Analytics](../integrations/ads-reporting/ads-reporting) for ads reporting. Integrate LinkedIn events into workflows, automate processes, and maximize impact through organic and paid strategies. This helps marketers manage campaigns, act on leads, engage audiences, prove event value, and increase LinkedIn events.

## Apply for Access

| API product | Availability | How to Request |
| --- | --- | --- |
| Events Management API | Available to all developers as a self-serve API product on request. | Apply for access from your [developer portal](https://www.linkedin.com/developers/apps) and use the [getting started](../quick-start#step-6-get-started-with-the-event-management-api) guide. |

## Postman Collection

[![Try in Postman](../../media/postman-button.png)](https://www.postman.com/linkedin-developer-apis/linkedin-marketing-solutions-versioned-apis/collection/heynbfh/events-management-api)

## Versioning

LinkedIn’s Marketing API Program supports versioning so API partners can release changes over time. This document explains how to use versioned APIs, see [here](../versioning).

## Stay Informed and Get Support

These resources can help you stay on top of new features, migrations, and deprecations:

- Check out the [Recent Changes](../integrations/recent-changes) page to see the latest API releases.
- Check out the [Developer Portal](https://developer.linkedin.com/product-catalog/marketing) to know more about our API products.
- Use the [Migrations](../integrations/migrations) page to stay on top of breaking changes.
- Need help? Reach out to Developer Support by submitting a [Zendesk ticket](https://linkedin.zendesk.com/hc/en-us).