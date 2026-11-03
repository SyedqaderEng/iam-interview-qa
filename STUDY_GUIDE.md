# IAM Engineer Interview — Visual Study Guide

A diagram-first companion to `IAM_Engineer_Interview_Master_Playbook(1).md`.
The playbook holds **292 topics**; this guide gives you the mental models and
flows that let you reason about any of them, even ones you have not memorized.

All diagrams are [Mermaid](https://mermaid.js.org/) and render automatically on
GitHub and in most markdown previewers.

> **Editable version:** the same diagrams are also in [`IAM_Diagrams.drawio`](IAM_Diagrams.drawio)
> (7 pages). Open it with [diagrams.net](https://app.diagrams.net/), the Draw.io
> desktop app, or the VS Code "Draw.io Integration" extension to move, edit, or
> export the shapes.

---

## 1. How the 292 topics are organized

Eleven categories. Learn the *shape* of each category and the individual topics
become variations on a theme.

```mermaid
mindmap
  root((IAM Engineer<br/>Playbook<br/>292 topics))
    Fundamentals 20
      IAM vs IGA vs PAM vs CIAM
      AuthN vs AuthZ
      Joiner Mover Leaver
      RBAC ABAC SoD
      Zero Trust least privilege
    Protocols 23
      SAML 2.0
      OAuth 2.0
      OIDC
      SCIM 2.0
      LDAP Kerberos RADIUS
      JWT FIDO2 x509
    IGA 29
      SailPoint
      Correlation aggregation
      Access certification
      Roles and policy
    Products 61
      PingFederate
      Okta
      ForgeRock Entra
    PAM 22
      CyberArk Vault
      Session recording
      Credential rotation
    CIAM 15
      Customer lifecycle
      Social login
      Progressive profiling
    Integration 25
      REST APIs
      Webhooks
      Automation
    Infrastructure 24
      OS networking
      DNS load balancing
      HA and DR
    Incidents 29
      Cannot log in
      Token failures
      Provisioning errors
    Scenarios 19
      App onboarding
      Migrations
    Leadership 25
      Architecture design
      Trade offs and RACI
```

| Category | Topics | What it is about |
|---|---|---|
| Fundamentals | 20 | Core concepts: identity, access models, lifecycle |
| Protocols | 23 | How systems exchange identity/auth data |
| IGA | 29 | Governance: correlate, certify, provision, prove |
| Products | 61 | Vendor patterns (Okta, Ping, SailPoint, etc.) |
| PAM | 22 | Protecting powerful/privileged accounts |
| CIAM | 15 | Customer-facing identity journeys |
| Integration | 25 | Moving identity data/commands between systems |
| Infrastructure | 24 | OS, network, DNS, HA/DR that IAM depends on |
| Incidents | 29 | Production symptoms and how to isolate them |
| Scenarios | 19 | End-to-end implementation cases |
| Leadership | 25 | Design, trade-offs, delivery, measurement |

---

## 2. The 7-step framework behind every topic

The playbook answers *every* topic with the same seven steps. Memorize the
steps, not 292 separate answers.

```mermaid
flowchart LR
    S1["1. What is it?<br/>plain definition"]
    S2["2. Why need it?<br/>business / security problem"]
    S3["3. How it works<br/>mechanism &amp; decisions"]
    S4["4. Architecture / flow<br/>systems + data exchanged"]
    S5["5. Configure<br/>settings, integration, test, rollout"]
    S6["6. What goes wrong?<br/>failure modes &amp; risks"]
    S7["7. Troubleshoot<br/>logs, isolate hop, fix, re-test"]

    S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7
    S7 -. "lessons feed back" .-> S5

    classDef know fill:#dbeafe,stroke:#2563eb,color:#1e3a8a;
    classDef build fill:#dcfce7,stroke:#16a34a,color:#14532d;
    classDef run fill:#fee2e2,stroke:#dc2626,color:#7f1d1d;
    class S1,S2,S3 know
    class S4,S5 build
    class S6,S7 run
```

**Speaking formula:** "The purpose of **[topic]** is **[problem solved]**. It
works by **[mechanism]**. In a typical flow, **[A]** sends **[data]** to
**[B]**, which validates **[checks]** and then **[outcome]**. I configure
**[settings]**. Common failures include **[examples]**. I troubleshoot by
isolating the failing hop, fixing the root cause, and re-testing."

---

## 3. The core mental model: everything is one transaction

Whatever the topic, it has the same shape — trusted data enters, policy
decides, an action hits a target, the result is logged and reconciled.

```mermaid
flowchart LR
    A["Authoritative<br/>source<br/>(HR / trigger)"] --> B["IAM platform<br/>(identity + policy)"]
    B --> C["Policy / workflow<br/>evaluate + approve"]
    C --> D["Target system<br/>(app / directory / API)"]
    D --> E["Logs &amp; audit<br/>reconcile"]
    E -. "reconciliation feedback" .-> B

    classDef src fill:#fef9c3,stroke:#ca8a04,color:#713f12;
    classDef core fill:#dbeafe,stroke:#2563eb,color:#1e3a8a;
    classDef tgt fill:#dcfce7,stroke:#16a34a,color:#14532d;
    classDef aud fill:#ede9fe,stroke:#7c3aed,color:#4c1d95;
    class A src
    class B,C core
    class D tgt
    class E aud
```

---

## 4. Protocols you will be asked about

### SAML 2.0 — SP-initiated SSO

Browser-redirect federation. The assertion trust checks (signature, issuer,
audience, recipient, `InResponseTo`, timestamps) are where interviews and real
incidents concentrate.

```mermaid
sequenceDiagram
    autonumber
    actor U as Browser / User
    participant SP as Service Provider (app)
    participant IdP as SAML Identity Provider

    U->>SP: Request protected resource
    SP-->>U: Redirect with AuthnRequest<br/>(issuer, ACS URL, ID, RelayState)
    U->>IdP: Deliver AuthnRequest to SSO URL
    IdP->>IdP: Authenticate user + evaluate MFA/policy
    IdP-->>U: Signed SAML assertion (HTTP-POST) + RelayState
    U->>SP: POST assertion to ACS URL
    SP->>SP: Verify signature, issuer, audience,<br/>recipient, InResponseTo, timestamps
    SP-->>U: Create local session, redirect to resource
```

### OAuth 2.0 / OIDC — Authorization Code + PKCE

OAuth authorizes **API access** (access token). OIDC adds **authentication**
(id_token). PKCE protects public clients. The resource API validates `iss`,
`aud`, `scope`, and `exp` on every call.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant C as Client app
    participant AS as Authorization Server / IdP
    participant API as Resource API

    C->>AS: /authorize (client_id, redirect_uri,<br/>scope, state, code_challenge)
    AS->>U: Authenticate + consent
    U-->>AS: Approve
    AS-->>C: Redirect with authorization code + state
    C->>AS: /token (code, client creds, code_verifier)
    AS->>AS: Validate grant + PKCE
    AS-->>C: access_token (+ id_token for OIDC)
    C->>API: Authorization: Bearer access_token
    API->>API: Validate signature, iss, aud, scope, exp
    API-->>C: 200 data / 401 invalid / 403 forbidden
```

### SCIM — provisioning = Joiner/Mover/Leaver

The lifecycle expressed as a protocol: create, update, deactivate, reconcile.

```mermaid
sequenceDiagram
    autonumber
    participant HR as HR / authoritative source
    participant PS as Provisioning service (IdP/IGA)
    participant T as SCIM target app

    HR-->>PS: Lifecycle event (hire / move / leave)
    PS->>PS: Resolve externalId, map to SCIM schema
    Note over PS,T: Joiner = POST  Mover = PATCH/PUT  Leaver = PATCH active:false / DELETE
    PS->>T: SCIM request (POST / PUT / PATCH / DELETE)
    T->>T: Validate token scope, schema, uniqueness
    T-->>PS: 2xx success  /  4xx-5xx structured error
    PS->>PS: Reconcile so IAM state == target state
```

---

## 5. Privileged Access Management (PAM)

Protect powerful accounts: broker the request against policy, either hand out a
short-lived credential or open a session where the password is never exposed,
record everything, and rotate after use.

```mermaid
sequenceDiagram
    autonumber
    actor P as Privileged user / workload
    participant PAM as PAM broker (policy)
    participant V as Vault / session manager
    participant T as Target system

    P->>PAM: Request access to a privileged account
    PAM->>PAM: Check safe membership, approval,<br/>dual-control, time window
    alt Credential retrieval
        PAM->>V: Fetch credential
        V-->>P: Short-lived credential
    else Brokered session
        PAM->>V: Open PSM session (password never shown)
        V->>T: Connect on user's behalf
    end
    T->>T: Authenticate the privileged account
    V->>V: Record session + apply command control
    PAM->>T: Rotate credential after use / on schedule
    PAM-->>P: Session + rotation recorded for audit
```

---

## 6. Troubleshooting method (the Incidents category)

All 29 incident topics use the same discipline: scope and preserve evidence
first, trace one transaction hop-by-hop, isolate the **first** failed hop before
changing anything, apply the smallest reversible fix, then re-test.

```mermaid
flowchart TD
    Start(["Symptom reported"]) --> Scope["Record scope:<br/>who, since when, txn ID, impact"]
    Scope --> Evidence["Capture expected vs actual<br/>at each hop"]
    Evidence --> Hops

    subgraph Hops["Trace one transaction across hops"]
      direction LR
      H1["Client /<br/>browser"] --> H2["Network<br/>DNS / LB"] --> H3["IAM<br/>service"] --> H4["Connector /<br/>directory"] --> H5["Target<br/>system"]
    end

    Hops --> Isolate["Isolate FIRST failed hop<br/>(compare to known-good user)"]
    Isolate --> Fix["Smallest reversible fix<br/>keep rollback path"]
    Fix --> Retest["Re-test: success + denial<br/>+ lifecycle + reconcile"]
    Retest --> Doc["Document root cause<br/>&amp; prevention"]

    classDef step fill:#dbeafe,stroke:#2563eb,color:#1e3a8a;
    classDef hop fill:#fee2e2,stroke:#dc2626,color:#7f1d1d;
    class Scope,Evidence,Isolate,Fix,Retest,Doc step
    class H1,H2,H3,H4,H5 hop
```

---

## 7. Configure &amp; validate (the Implementation Lab)

Step 5 of the framework — "Configure" — is where most real work and most
interview follow-ups live. The in-app **Implementation Lab** shows a reference
console and an example request/response for each protocol. Whatever you
configure, validate it the same way: exercise a success path *and* a failure
path, then confirm the target state and the audit log.

```mermaid
flowchart LR
    subgraph Configure
      C1["Register in non-prod<br/>least-privilege service account"]
      C2["Exact identifiers &amp; endpoints<br/>(entity ID, redirect_uri, base URL)"]
      C3["Trust material<br/>(signing cert / JWKS / Bearer token)"]
      C4["Attribute / claim mapping<br/>+ stable key (externalId)"]
    end
    subgraph Validate
      V1["Positive test<br/>(known-good user)"]
      V2["Denial test<br/>(expired / wrong audience / revoked)"]
      V3["Lifecycle test<br/>(create → update → deactivate)"]
      V4["Confirm target state<br/>+ audit log by correlation ID"]
    end
    C1 --> C2 --> C3 --> C4 --> V1 --> V2 --> V3 --> V4

    classDef cfg fill:#dcfce7,stroke:#16a34a,color:#14532d;
    classDef val fill:#dbeafe,stroke:#2563eb,color:#1e3a8a;
    class C1,C2,C3,C4 cfg
    class V1,V2,V3,V4 val
```

**Protocol-specific things the lab makes you check (real keywords):**

| Protocol | Configure | Validate on failure |
|---|---|---|
| SAML 2.0 | entity ID, ACS URL, SHA-256 signing cert, NameID format | signature, `Issuer`, `Audience`, `Recipient`, `InResponseTo`, `NotBefore`/`NotOnOrAfter` (clock skew) |
| OAuth / OIDC | exact `redirect_uri`, Auth Code + PKCE, scopes, audience | `invalid_grant` (reused/expired code), `iss`/`aud`/`exp`/signature, `Cache-Control: no-store` |
| SCIM 2.0 | `/Users` &amp; `/Groups`, Bearer token, `externalId` + `userName` | `409` duplicate, `400` invalidSyntax, `401` bad token, `PATCH active:false` offboarding |
| Kerberos | unique SPN, &lt;5 min clock skew, DNS, keytab | `KRB_AP_ERR_SKEW`, `KRB_AP_ERR_MODIFIED`, `S_PRINCIPAL_UNKNOWN` |
| RADIUS | NAS client + shared secret, EAP, return attributes | secret mismatch, UDP 1812/1813 blocked, Access-Reject |
| FIDO2 / WebAuthn | `rpId`, allowed origins, `userVerification` | origin / `rpIdHash` / challenge / signature / signCount replay |
| LDAP / AD | base DN, filters, LDAPS :636, `userAccountControl` | bind `49 data 52e`/`533`/`775`, TLS trust |

---

## 8. Running the study site locally

The playbook content is embedded in `playbook-data.js`, so you can simply open
`index.html` directly in your browser — no server required.

If you prefer to serve it (optional), any static server works:

```bash
python -m http.server 4173   # then open http://localhost:4173
```

The in-app flow diagrams, three mastery levels, and the Implementation Lab are
generated from the embedded playbook at runtime by `app.js`.
