---
layout: Conceptual
title: Sign In with LinkedIn using OpenID Connect - LinkedIn | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2
breadcrumb_path: /linkedin/breadcrumb/toc.json
recommendations: false
feedback_system: Standard
feedback_product_url: https://linkedin.zendesk.com/hc/en-us
uhfHeaderId: MSDocsHeader-LinkedIn
ms.subservice: consumer
description: Learn how to leverage LinkedIn's API to Sign In with LinkedIn using OpenID Connect.
author: hpanchag
ms.author: li_chrou
ms.date: 2022-12-14T00:00:00.0000000Z
ms.topic: article
ms.service: linkedin
locale: en-us
document_id: f1a689dc-0695-cb49-b6ab-ba8b9f1ae0af
document_version_independent_id: f1a689dc-0695-cb49-b6ab-ba8b9f1ae0af
updated_at: 2024-08-08T20:39:00.0000000Z
original_content_git_url: https://github.com/MicrosoftDocs/linkedin-api-docs/blob/live/linkedin-api-docs/consumer/integrations/self-serve/sign-in-with-linkedin-v2.md
gitcommit: https://github.com/MicrosoftDocs/linkedin-api-docs/blob/0259929e52775c58516aee9f8abf3055d4e0dcd1/linkedin-api-docs/consumer/integrations/self-serve/sign-in-with-linkedin-v2.md
git_commit_id: 0259929e52775c58516aee9f8abf3055d4e0dcd1
site_name: Docs
depot_name: MSDN.linkedin-api-docs
page_type: conceptual
toc_rel: ../../toc.json
feedback_help_link_type: ''
feedback_help_link_url: ''
word_count: 657
asset_id: consumer/integrations/self-serve/sign-in-with-linkedin-v2
moniker_range_name: 
monikers: []
item_type: Content
source_path: linkedin-api-docs/consumer/integrations/self-serve/sign-in-with-linkedin-v2.md
cmProducts:
- https://microsoft-devrel.poolparty.biz/DevRelOfferingOntology/aec7dc3e-0dad-4b82-accf-63218d8767d5
spProducts:
- https://microsoft-devrel.poolparty.biz/DevRelOfferingOntology/f260444a-7ec6-4768-8e41-ad2438092724
platformId: 08602464-d1fc-fa01-6f70-f86af4cafcf6
---

# Sign In with LinkedIn using OpenID Connect - LinkedIn | Microsoft Learn

## Overview

We are now offering a way for your apps to authenticate members using OpenID Connect.

## What is OpenID Connect

OpenID Connect (OIDC) is an identity layer built on top of OAuth 2.0, enabling applications to authenticate members and obtain lite profile information about the member. OIDC will simplify the partner integration onboarding experience and eliminate dependencies on making additional API calls to find who the authenticated member is.

Note

Keep in mind Sign In with LinkedIn using OpenID Connect does not verify user identities and should not be marketed as such.

## Getting Started

### Authenticating Members

New members logging in to your service for the first time will need to follow the [Authenticating with OAuth 2.0 Guide](../../../shared/authentication/authentication?context=linkedin/consumer/context). When requesting the authorization code in Step 2 of the OAuth 2.0 Guide, make sure you use the OpenID scope `openid` to get the ID Token. We are also introducing new scopes `profile` and `email`.

| Permission Name | Description |
| --- | --- |
| openid | Required to indicate the application wants to use OIDC to authenticate the member. |
| profile | Required to retrieve the member's lite profile including their id, name, and profile picture. |
| email | Required to retrieve the member's email address. |

After successful authentication, you will receive the member's access token and ID token.

If your application does not have these permissions provisioned, you can request access through the [Developer Portal](https://www.linkedin.com/developers/). Select your app from [My Apps](https://www.linkedin.com/developers/apps), navigate to the Products tab, and request the Sign in with LinkedIn using OpenID Connect product.

### Retrieving Member Profiles Using ID Tokens

The primary extension that OIDC adds to OAuth 2.0 is enabling members to be Authenticated using the ID Token data structure. The ID Token is a security token that contains Claims about the Authentication of a member by an Authorization Server when using a Client, and potentially other requested Claims. The ID Token is represented as a JSON Web Token (JWT). With OIDC, you are now able to extract the member details from the ID Token.

##### ID Token Payload

| Permission Name | Description |
| --- | --- |
| iss | The authorization server’s Identifier of the response https://www.linkedin.com |
| sub | User identifier |
| aud | client\_id of Relying party/caller Application guarantees user authentication for itself. |
| iat | ID Token issue time |
| exp | This is the expiration time of the token. The relying party processing this token should reject it once the expiration time is reached. |

#### Validating ID Tokens

ID Tokens can be validated using the metadata provided by [discovery document](https://www.linkedin.com/oauth/.well-known/openid-configuration) which contains OAuth endpoints, public keys and claims.

```JSON
{
    "issuer": "https://www.linkedin.com",
    "authorization_endpoint": "https://www.linkedin.com/oauth/v2/authorization",
    "token_endpoint": "https://www.linkedin.com/oauth/v2/accessToken",
    "userinfo_endpoint": "https://api.linkedin.com/v2/userinfo",
    "jwks_uri": "https://www.linkedin.com/oauth/openid/jwks",
    "response_types_supported": [
        "code"
    ],
    "subject_types_supported": [
        "pairwise"
    ],
    "id_token_signing_alg_values_supported": [
        "RS256"
    ],
    "scopes_supported": [
        "openid",
        "profile",
        "email"
    ],
    "claims_supported": [
        "iss",
        "aud",
        "iat",
        "exp",
        "sub",
        "name",
        "given_name",
        "family_name",
        "picture",
        "email",
        "email_verified",
        "locale"
    ]
}
```

[JWKS_URI](https://www.linkedin.com/oauth/openid/jwks) provided in the discovery document, can be used for signature verification.

#### API Request to retreive member details

In addition to the JWT received, you can also call userinfo endpoint to retrieve the member details.

```HTTP
GET https://api.linkedin.com/v2/userinfo
Authorization: Bearer <access token>
```

#### Response Body Schema

| Field Name | Description | Format |
| --- | --- | --- |
| sub | Subject Identifier | Text |
| name | Full name | Text |
| given\_name | Member's first name | Text |
| family\_name | Member's last name | Text |
| picture | Member's profile picture URL | Text |
| locale | Member's locale | Text |
| email | Member's primary e-mail address. **Optional** | Text |
| email\_verified | Indicator that Member's primary email has been verified. **Optional** | Boolean |

Note

The 'email' and 'email\_verified' fields are optional and may not be included in all responses. Ensure your application can handle cases where these fields are absent.

#### Sample API Response

```JSON
{
    "sub": "782bbtaQ",
    "name": "John Doe",
    "given_name": "John",
    "family_name": "Doe",
    "picture": "https://media.licdn-ei.com/dms/image/C5F03AQHqK8v7tB1HCQ/profile-displayphoto-shrink_100_100/0/",
    "locale": "en-US",
    "email": "doe@email.com",
    "email_verified": true
}
```

With the member's profile information successfully retrieved, the sign-in process is now complete and your member can continue to enjoy their personalized experience with your site or application.