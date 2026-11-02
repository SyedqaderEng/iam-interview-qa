const categoryNames = {
  fundamentals: "IAM Fundamentals", protocol: "Protocols", iga: "Identity Governance",
  product: "Identity Products", pam: "Privileged Access", ciam: "Customer Identity",
  integration: "Integration & Automation", infrastructure: "Infrastructure",
  incident: "Production Incidents", scenario: "Implementation Scenarios", leadership: "Leadership"
};

let topics = [];
let activeCategory = "all";
let currentTopic = null;

async function loadTopics() {
  const response = await fetch("IAM_Engineer_Interview_Master_Playbook(1).md");
  const markdown = await response.text();
  let category = "fundamentals";
  const lines = markdown.split(/\r?\n/);
  let current = null;

  for (const line of lines) {
    const section = line.match(/^# ([^#].*)$/);
    if (section) {
      const sectionCategories = {
        "iam fundamentals": "fundamentals", protocol: "protocol", iga: "iga",
        product: "product", pam: "pam", ciam: "ciam", integration: "integration",
        infrastructure: "infrastructure", incident: "incident", scenario: "scenario",
        leadership: "leadership"
      };
      const sectionName = section[1].toLowerCase().trim().replace(/[^a-z ]/g, "");
      category = sectionCategories[sectionName] || category;
      continue;
    }
    const topic = line.match(/^##\s+(\d+)\.\s+(.+?)\s*$/);
    if (topic) {
      if (current) topics.push(current);
      current = { number: Number(topic[1]), title: topic[2].trim(), category, content: [] };
    } else if (current && line.trim()) {
      current.content.push(line.trim());
    }
  }
  if (current) topics.push(current);

  renderNavigation();
  renderTopics();
  document.getElementById("heroCount").textContent = topics.length;
  document.getElementById("topicCount").textContent = `${topics.length} topics`;
  updateProgress();
}

String.prototype.toLowerName = function () { return this.toLowerCase(); };

function renderNavigation() {
  const counts = topics.reduce((map, topic) => (map[topic.category] = (map[topic.category] || 0) + 1, map), {});
  const nav = document.getElementById("categoryNav");
  nav.innerHTML = `<a href="#" data-nav="all" class="active"><span>All topics</span><span>${topics.length}</span></a>` +
    Object.keys(categoryNames).filter(key => counts[key]).map(key =>
      `<a href="#" data-nav="${key}"><span>${categoryNames[key]}</span><span>${counts[key]}</span></a>`).join("");
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", event => {
    event.preventDefault(); setCategory(link.dataset.nav); closeMenu();
  }));
}

function renderTopics() {
  const query = document.getElementById("searchInput").value.toLowerName();
  const visible = topics.filter(topic =>
    (activeCategory === "all" || topic.category === activeCategory) &&
    `${topic.title} ${topic.category}`.toLowerCase().includes(query));
  const grid = document.getElementById("topicGrid");
  grid.innerHTML = visible.length ? visible.map(topic => {
    const reviewed = localStorage.getItem(`iam-topic-${topic.number}`);
    return `<article class="topic-card ${reviewed ? "reviewed" : ""}" data-topic="${topic.number}" tabindex="0">
      <span class="number">TOPIC ${String(topic.number).padStart(3, "0")}</span>
      <span class="arrow">↗</span>
      <h2>${topic.title}</h2>
      <span class="category">${categoryNames[topic.category]}</span>
    </article>`;
  }).join("") : `<div class="empty"><strong>No matching topics.</strong><br>Try another word or category.</div>`;

}

const topicGrid = document.getElementById("topicGrid");
topicGrid.addEventListener("click", event => {
  const card = event.target.closest(".topic-card");
  if (card) openTopic(Number(card.dataset.topic));
});
topicGrid.addEventListener("keydown", event => {
  const card = event.target.closest(".topic-card");
  if (card && event.key === "Enter") openTopic(Number(card.dataset.topic));
});

function setCategory(category) {
  activeCategory = category;
  document.querySelectorAll(".filter").forEach(button => button.classList.toggle("active", button.dataset.category === category));
  document.querySelectorAll(".category-nav a").forEach(link => link.classList.toggle("active", link.dataset.nav === category));
  closeTopic(); renderTopics();
}

function cleanText(text) {
  return text.replace(/^\d+\.\s*/, "").replace(/\s+/g, " ").replace(/\*\*/g, "").replace(/:+/g, ":").trim();
}

function stepsFor(topic) {
  const raw = topic.content.join("\n");
  const pieces = raw.split(/\n(?=\d+\.\s)/).map(cleanText);
  const labels = ["What", "Why", "How it works", "Architecture", "Configure", "Failure modes", "Troubleshoot"];
  const generic = [
    `${topic.title} is a core ${categoryNames[topic.category].toLowerCase()} capability within an enterprise IAM environment.`,
    "It reduces access risk, improves operational control, and gives the business reliable audit evidence.",
    "Trusted data enters the IAM platform, policy is evaluated, the required action is sent to the target, and the result is recorded and reconciled.",
    "Identity source → IAM platform → policy/workflow → target system → logs and audit.",
    "Confirm ownership, scope, trust boundaries, mappings, permissions, monitoring, test cases, change controls, and rollback before rollout.",
    "Typical risks include bad source data, incorrect mappings, expired credentials, connectivity loss, schema drift, replication lag, or overly broad policy.",
    "Trace the transaction using a timestamp and correlation ID. Compare source data, IAM state, policy output, target state, and logs at each boundary; correct and retest the full lifecycle."
  ];
  return labels.map((label, index) => {
    const text = pieces[index] || generic[index];
    return { label, text: text || generic[index] };
  });
}

function simpleMeaning(topic) {
  const map = {
    fundamentals: "Think of this as a rule and trusted record that lets the right person reach the right business resource.",
    protocol: "This is the agreed conversation that allows two identity systems to exchange trustworthy information.",
    iga: "This is the governance part of IAM: discover access, route approval, grant and remove access, and prove that reviews happened.",
    product: "This is a product capability that organizes a proven IAM pattern into configuration, policy, logs, and integrations.",
    pam: "This protects powerful accounts by controlling access, storing or brokering secrets, recording sessions, and rotating credentials.",
    ciam: "This is how a service safely registers, authenticates, profiles, recovers, and manages customers or consumers.",
    integration: "This is the secure connection that moves identity data or commands between IAM and another business system.",
    infrastructure: "This is a dependency that keeps IAM requests connected, available, encrypted, and able to process data reliably.",
    incident: "This is a production symptom. We first establish scope and preserve evidence, then isolate the first failed hop before changing anything.",
    scenario: "This is an end-to-end implementation case. We move from requirements to design, configuration, testing, rollout, and operational evidence.",
    leadership: "This is a design and delivery responsibility: understand risk, align teams, make trade-offs explicit, and measure the outcome."
  };
  return `${map[topic.category]} ${topic.title} is best understood in one transaction, from trigger to result.`;
}

function flowFor(topic) {
  const title = topic.title.toLowerCase();
  if (/saml|federation metadata|ws.federation/.test(title)) return ["Browser / User", "Service Provider (SP)", "SAML IdP", "Browser redirect", "SP session"];
  if (/oidc|authorization code|pkce/.test(title)) return ["User + Client", "Authorization Server / IdP", "/authorize", "Token endpoint", "Resource API"];
  if (/oauth|access token|refresh token|client credentials/.test(title)) return ["Client", "Authorization Server", "Authorization grant", "Access token", "Protected API"];
  if (/jwt|jws|jwe/.test(title)) return ["Issuer / IdP", "Signed or encrypted JWT", "API or relying party", "Claim and signature checks", "Authorized response"];
  if (/scim/.test(title)) return ["Authoritative source / HR", "Provisioning service", "SCIM POST / PUT / PATCH", "SCIM target", "Reconciliation result"];
  if (/ldap/.test(title)) return ["IAM client", "LDAPS connection", "Directory bind", "Search or modify", "Directory response"];
  if (/kerberos/.test(title)) return ["User workstation", "Key Distribution Center", "Ticket Granting Ticket", "Service Ticket", "Service"];
  if (/sailpoint|iga|identity governance|certification|correlation|role/.test(title)) return ["Authoritative source", "IGA identity", "Policy / approval", "Connector", "Target account and audit"];
  if (/cyberark|privileged session|password rotation|credential provider|pam|vault/.test(title)) return ["Privileged user or workload", "PAM request", "Vault / session broker", "Target", "Recording and rotation"];
  if (/provision|deprovision|lifecycle/.test(title)) return ["HR lifecycle event", "Identity platform", "Approval and policy", "Provisioning operation", "Target and reconciliation"];
  if (/incident|failed|failure|cannot log|outage|timeout|exhaustion|issues/.test(title)) return ["Reported symptom", "Scope and time window", "Hop-by-hop evidence", "Root cause", "Fix and validation"];
  if (/scenario|implement|integrat|migrat|design|troubleshoot/.test(title)) return ["Requirements", "Architecture decision", "Controlled configuration", "Test cases", "Production and operations"];
  if (/leadership|design iam|architect|prioritize|incident|mentor/.test(title)) return ["Business outcome", "Risk and dependencies", "Decision and RACI", "Delivery", "Measures and lessons"];

  const categoryFlows = {
    fundamentals: ["Business request", "Authoritative identity data", "IAM policy", "Resource decision", "Audit evidence"],
    protocol: ["Client", "Protocol endpoint", "Identity provider", "Relying party", "Validated outcome"],
    iga: ["Source event", "IGA identity", "Approval and policy", "Target connector", "Reconciliation and audit"],
    product: ["User or workload", "Product policy", "Directory or connector", "Application or resource", "Product audit log"],
    ciam: ["Customer", "CIAM journey", "Profile / risk / MFA", "Session or token", "Customer API"],
    integration: ["Source system", "Integration runtime", "Authenticated API", "Target system", "Response and reconciliation"],
    infrastructure: ["Client", "Network, DNS and load balancer", "IAM service node", "Directory / database dependency", "Response and metrics"],
    pam: ["Privileged user", "PAM policy", "Vault or broker", "Target system", "Audit recording and rotation"]
  };
  return categoryFlows[topic.category] || categoryFlows.fundamentals;
}

function sequenceFor(topic) {
  const title = topic.title.toLowerCase();
  if (/sp.initiated|saml sp. initiated/.test(title) || (/saml/.test(title) && !/failure/.test(title))) return [
    "The user requests a protected resource from the Service Provider (SP).",
    "The SP generates a SAML AuthnRequest containing an issuer, ACS URL, request ID, and RelayState; it redirects the browser to the IdP SSO URL.",
    "The IdP validates the signed or unsigned request as allowed by configuration, authenticates the user, and evaluates authentication policy and MFA.",
    "The IdP creates a SAML assertion, signs it with the IdP private signing key, and performs an HTTP POST to the SP ACS URL with RelayState.",
    "The browser POSTs the assertion to the SP; the SP verifies signature, issuer, audience/recipient, destination, InResponseTo, timestamps, and NameID.",
    "After successful validation, the SP creates its local session and redirects the browser to RelayState or the original protected resource."
  ];
  if (/saml authentication failure|saml.*failure/.test(title)) return [
    "Capture the SAML transaction at the failing hop without exposing assertion secrets.",
    "Confirm whether the browser reaches the SP ACS URL and whether the IdP receives an AuthnRequest.",
    "Validate entity IDs, ACS and SSO endpoints, binding, and RelayState at both parties.",
    "Verify signature and trust certificate, issuer, audience, recipient, destination, request ID, timestamps, and clock synchronization.",
    "Correct the first mismatched value, replay one known-good user, then validate both success and rejection paths."
  ];
  if (/authorization code flow|authorization code with pkce/.test(title)) return [
    "The client redirects the user to the authorization server /authorize endpoint with client_id, redirect_uri, scope, state, and, for PKCE, code_challenge.",
    "The authorization server authenticates the user and obtains consent or evaluates policy.",
    "The authorization server redirects the browser to the registered redirect_uri with a short-lived authorization code and the same state.",
    "The client sends the code and client credentials (and code_verifier for PKCE) to the token endpoint, using the exact redirect_uri.",
    "The authorization server validates the grant and returns an access token; confidential clients validate them at the resource API."
  ];
  if (/access tokens and id tokens|refresh tokens|client credentials|oauth invalid_grant|oauth/.test(title)) return [
    "The client obtains authorization from the user or itself using an approved grant.",
    "The authorization server issues the token response according to the requested grant and scopes.",
    "The client sends the access token to the resource API as Authorization: Bearer <token>.",
    "The API validates signature or token introspection, issuer, audience, scope, expiration, token type, and revocation status.",
    "The API authorizes the requested operation and returns data, 401 for invalid authentication, or 403 for insufficient permissions."
  ];
  if (/radius/.test(title)) return [
    "The network access device, VPN, or wireless controller receives a user connection and creates an Access-Request.",
    "The NAS sends a RADIUS Access-Request to the configured RADIUS server using the shared secret and a random authenticator.",
    "The RADIUS server forwards primary authentication and MFA as configured to the identity source and policy services.",
    "The server returns Access-Accept, Access-Reject, or Access-Challenge; an Accept contains authorization attributes such as VLAN, role, or timeout.",
    "The NAS applies the returned attributes and starts an accounting session; accounting Start, Interim, and Stop messages report session state."
  ];
  if (/kerberos/.test(title)) return [
    "The user signs in to the workstation and obtains an initial Kerberos ticket-granting context.",
    "The workstation requests a Ticket Granting Ticket from the Authentication Service in the Key Distribution Center.",
    "The AS verifies the principal against the KDC and returns encrypted session material that the workstation can decrypt with the user's credential.",
    "The workstation requests a service ticket for the target SPN from the Ticket Granting Service.",
    "The workstation presents the service ticket to the target service; the service validates it and authorizes the principal without sending the password."
  ];
  if (/fido2|webauthn|passkey/.test(title)) return [
    "The relying party requests registration and sends a cryptographic challenge, relying-party ID, user handle, and allowed authenticator policy.",
    "The browser and authenticator verify that the origin and relying-party ID match, then create a new public/private key pair scoped to that site.",
    "The authenticator confirms user presence or verification and signs or returns attested registration data.",
    "The relying party verifies the attestation, challenge, origin, and signature, then stores the public credential and sign count.",
    "At authentication, the browser requests a fresh assertion; the authenticator signs the challenge and the relying party verifies the assertion against the stored public key."
  ];
  if (/x.509|certificate lifecycle|pki|mutual tls| tls/.test(title)) return [
    "The public key and certificate request identify the subject, SANs, key usage, validity need, and trust chain.",
    "The certificate authority validates the request, applies policy, signs the certificate, and records issuance.",
    "The service installs the certificate and private key in a protected store and configures trust and rotation monitoring.",
    "The peer presents its certificate and proves possession of the private key during TLS or mutual-TLS validation.",
    "Validation checks signature chain, trust anchor, hostname, purpose, validity, revocation status, algorithm, and key policy before connection authorization."
  ];
  if (/ws.trust/.test(title)) return [
    "The client sends a Request Security Token containing a target relying party and requested claims to the WS-Trust endpoint.",
    "The STS validates the client's authenticated context and the target trust policy.",
    "The STS applies claims mapping and issues a signed security token, usually SAML or another accepted token format.",
    "The client sends the issued token to the target web service using the selected SOAP binding.",
    "The target validates issuer, signature, audience, lifetime, subject confirmation, and authorization claims before processing the request."
  ];
  if (/ws.federation|http redirect|post binding/.test(title)) return [
    "The relying party receives a resource request from the browser and starts the selected federation binding.",
    "Redirect binding carries the request through URL query parameters; POST binding carries a form in the browser body.",
    "The browser sends the federation request to the IdP, which authenticates the user and applies policy.",
    "The IdP returns the signed SAML response through the selected binding to the relying-party endpoint.",
    "The relying party validates the response and creates its session only after issuer, audience, signature, recipient, and time checks pass."
  ];
  if (/jwt|jws|jwe/.test(title)) return [
    "The issuer creates protected claims and selects the signing or encryption algorithm.",
    "JWS signs the payload or JWE encrypts it; the compact serialization is sent to the relying party.",
    "The recipient fetches trusted keys by issuer, then checks key ID, signature, issuer, audience, time, nonce, and algorithm allowlist.",
    "If JWE is used, the recipient decrypts using the intended recipient key and then validates the nested or contained claims if signed.",
    "Only after all checks pass does the application establish authorization or a session."
  ];
  if (/scim/.test(title)) return [
    "Provisioning service discovers or receives an HR lifecycle or entitlement change for one identity.",
    "The service resolves externalId and maps the internal schema to the SCIM user or group schema.",
    "The service authenticates to the SCIM target and sends POST, PUT, PATCH, GET, or DELETE.",
    "The target validates token scope, schema, uniqueness, and state, then returns a 2xx response or a structured 4xx/5xx error.",
    "The provisioning service stores the response and runs reconciliation so IAM and target state agree."
  ];
  if (/sailpoint|identity cube|access certification|correlation|iga/.test(title)) return [
    "IGA imports an authoritative identity and application accounts during aggregation or an event.",
    "Correlation compares configured stable attributes and creates, links, or leaves an account for review; it does not guess without policy.",
    "Role, policy, request, and approval logic evaluates the desired access and records approver decisions.",
    "The connector converts the approved plan into a provisioning operation and sends it to the target.",
    "IGA reconciles target state, records fulfillment or failure, and supplies evidence for certification or audit."
  ];
  if (/cyberark|privileged session|password rotation|pam|vault/.test(title)) return [
    "A user or workload requests access to one identified privileged account.",
    "PAM checks safe/folder membership, approval, dual-control, time, and target policy.",
    "Vault retrieval supplies a credential or the session manager brokers a connection without exposing the password.",
    "The target authenticates the account; PSM applies recording, command control, and access policy.",
    "PAM records session and rotation results, then reconciles the target password or revokes access when policy ends."
  ];
  if (/incident|failed|failure|cannot log|outage|timeout|exhaustion|issues/.test(title)) return [
    "Record symptom, start time, affected population, transaction ID, and business impact.",
    "Capture the expected request and actual response at each IAM, network, connector, and target hop.",
    "Use chronology and healthy known users to isolate the first failed component rather than changing several settings.",
    "Apply the smallest reversible fix supported by evidence and preserve a rollback path.",
    "Retest a success case, negative case, lifecycle case, and target reconciliation; then document prevention."
  ];
  if (/scenario|implement|integrat|migrat|design|troubleshoot/.test(title)) return [
    "Confirm business need, owners, identity population, protocol, and target lifecycle requirements.",
    "Define trust, identifiers, endpoints, mappings, permissions, approvals, and failure behavior.",
    "Configure in a non-production environment with least privilege and a reversible change record.",
    "Test positive, denial, lifecycle, certificate/credential expiry, outage, and rollback cases.",
    "Deploy in approved stages, monitor audit evidence, and document operational ownership."
  ];
  if (/leadership|design iam|architect|prioritize|mentor/.test(title)) return [
    "Translate the business objective into identity, risk, availability, and compliance requirements.",
    "Map current controls, dependencies, ownership, data quality, and hidden migration constraints.",
    "Compare viable options and document decision criteria, cost, risk, and rollback.",
    "Execute through accountable teams with acceptance criteria, milestones, and evidence.",
    "Measure adoption, failures, access age, incidents, and audit outcomes; feed results into governance."
  ];

  const common = {
    fundamentals: ["Start with one identity and one protected resource.", "Verify the authoritative identity attributes and account state.", "Evaluate the applicable IAM policy or entitlement.", "Apply and confirm the desired state at the enforcement point.", "Record the decision and outcome in audit evidence."],
    protocol: ["The initiating client creates a request using the selected protocol and trust endpoints.", "The identity or policy system authenticates and evaluates the subject according to protocol configuration.", "The producer creates the protocol result with an issuer, subject, lifetime, signature, encryption, or authorization context.", "The receiving system validates trust metadata, destination, cryptographic proof, time, and protocol claims.", "The application grants the intended session or authorization only after every receiving-system check succeeds."],
    iga: ["A source change or governance process creates the desired access state.", "IGA correlates identity and evaluates roles, policy, SoD, and approvals.", "IGA creates and fulfills the provisioning plan through the connector.", "The target processes the operation and reports its response.", "IGA reconciles actual target state and records audit evidence."],
    pam: ["The privileged user or workload requests a specific account and target.", "PAM evaluates ownership, approval, safe permissions, and target policy.", "PAM retrieves or brokers the credential and starts a controlled session.", "The target authenticates and applies its own authorization policy.", "PAM records activity and performs rotation, verification, or revocation."],
    ciam: ["The customer begins registration, login, recovery, or profile activity.", "CIAM evaluates profile, credential, MFA, fraud, and consent context.", "The journey selects the required action or challenge.", "CIAM issues a session or token to the application.", "The application validates the result and records the customer event."],
    integration: ["The source emits or is queried for identity data or an operation.", "The integration runtime authenticates and maps data to the target contract.", "The runtime sends the request with retry and correlation identifiers.", "The target validates and processes the operation.", "The runtime reconciles the response and records success or failure."],
    infrastructure: ["The client resolves the service through DNS and network routing.", "The load balancer directs the request to a healthy IAM node.", "IAM executes policy or reads the required directory/database dependency.", "The dependency returns data or an error with latency and health context.", "IAM sends the response and emits metrics and logs."]
  };
  return common[topic.category] || common.fundamentals;
}

function exampleFor(topic) {
  if (topic.category === "incident") return ["Affected users", "Narrow first", "Fix and evidence"];
  if (topic.category === "scenario") return ["Business requirement", "Technical decision", "Validation result"];
  return ["A normal request", "An edge case", "A failure response"];
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
}

function implementationLab(topic) {
  const title = topic.title.toLowerCase();
  let screenTitle = "IAM Administration Console";
  let screenLabel = "Example configuration view";
  let steps = [
    "Create a non-production integration owned by the application team.",
    "Enter endpoint URLs, identifiers, mappings, and least-privilege permissions.",
    "Save the configuration, run one positive test, then run one denial and recovery test.",
    "Verify the target state and preserve the correlation ID in audit evidence."
  ];
  let output = "{\n  \"status\": \"success\",\n  \"operation\": \"provision\",\n  \"targetStateVerified\": true\n}";

  if (/okta/.test(title)) {
    screenTitle = "Okta Admin Console";
    screenLabel = "Illustrative IdP configuration screen";
    steps = [
      "Admin Console → Applications → Create App Integration.",
      "Choose the protocol, sign-in URI, sign-out URI, and assigned application audience.",
      "Configure attribute statements, group assignments, sign-on policy, and MFA rules.",
      "Assign only test users, launch the app, and inspect the Okta System Log."
    ];
    output = "{\n  \"email\": \"alex@example.com\",\n  \"preferred_username\": \"alex@example.com\",\n  \"groups\": [\"Finance.Users\"]\n}";
  } else if (/saml/.test(title)) {
    screenTitle = "Identity Provider — SAML Setup";
    screenLabel = "Illustrative trust configuration screen";
    steps = [
      "Enter the SP entity ID and Assertion Consumer Service URL exactly as registered.",
      "Upload or exchange the signing certificate and select SHA-256.",
      "Map stable subject and required authorization claims to application attributes.",
      "Test SP-initiated and IdP-initiated login, including clock-skew and expired-certificate cases."
    ];
    output = "SP → IdP AuthnRequest (URL-decoded):\n<samlp:AuthnRequest ID=\"_req123\"\n  AssertionConsumerServiceURL=\"https://app.example.com/saml/acs\"\n  Destination=\"https://idp.example.com/sso/saml\"\n  ProtocolBinding=\"urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST\"\n  IssueInstant=\"2026-11-02T10:15:00Z\">\n  <saml:Issuer>https://app.example.com/saml/metadata</saml:Issuer>\n  <samlp:NameIDPolicy AllowCreate=\"true\" Format=\"urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress\"/>\n</samlp:AuthnRequest>\n\nSuccessful IdP assertion response fields:\nIssuer=https://idp.example.com\nAudience=https://app.example.com/saml/metadata\nNameID=alex@example.com\nInResponseTo=_req123\nSubjectConfirmationRecipient=https://app.example.com/saml/acs\nSignature=IdP signing certificate; validate issuer, audience, recipient, time and InResponseTo";
  } else if (/token|jwt|oidc|oauth/.test(title)) {
    screenTitle = "Authorization Server — Application";
    screenLabel = "Illustrative token configuration screen";
    steps = [
      "Register the exact redirect URI; prefer Authorization Code with PKCE for public clients.",
      "Configure allowed grants, scopes, audience, token lifetime, and proof-of-possession where supported.",
      "Request only required scopes and validate issuer, audience, signature, nonce, and expiration.",
      "Inspect /token response headers, claims, revocation behavior, and refresh-token rotation."
    ];
    output = "POST /oauth2/token\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=authorization_code&client_id=orders-web&code=_short_lived_code&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback&code_verifier=_pkce_verifier\n\n200 OK\n{\n  \"access_token\": \"eyJhbGciOiJSUzI1NiJ9...signed.JWT.payload\",\n  \"id_token\": \"eyJhbGciOiJSUzI1NiJ9...signed.OIDC.payload\",\n  \"token_type\": \"Bearer\",\n  \"expires_in\": 3600,\n  \"scope\": \"openid profile orders.read\",\n  \"refresh_token\": \"rotated-once-use-value\"\n}\n\nDecoded access-token claims:\n{\"iss\":\"https://idp.example.com/oauth2/default\",\"aud\":\"orders-api\",\"sub\":\"00u123\",\"scp\":[\"orders.read\"],\"iat\":1793594400,\"exp\":1793598000}";
  } else if (/scim|provision|connector/.test(title)) {
    screenTitle = "Provisioning Integration";
    screenLabel = "Illustrative SCIM source configuration";
    steps = [
      "Test the target Users and Groups endpoints with least-privilege service credentials.",
      "Set externalId and unique account mappings before enabling create operations.",
      "Enable create, update, deactivate, and group-membership operations individually.",
      "Run a reconciliation job and compare source, IAM, connector, and target states."
    ];
    output = "{\n  \"schemas\": [\"urn:ietf:params:scim:schemas:core:2.0:User\"],\n  \"id\": \"usr_123\",\n  \"active\": true,\n  \"userName\": \"alex@example.com\"\n}";
  } else if (/sailpoint|iga|access certification|correlation|role/.test(title)) {
    screenTitle = "Identity Governance Console";
    screenLabel = "Illustrative governance configuration screen";
    steps = [
      "Define the authoritative identity source, stable identity key, and correlation rule.",
      "Onboard the target and inventory owned entitlements and risk-sensitive attributes.",
      "Configure role membership, approvals, fulfillment, policy checks, and campaign scope.",
      "Aggregate into a controlled identity, reconcile the result, and export audit evidence."
    ];
    output = "{\n  \"identityKey\": \"emp123\",\n  \"linkedAccounts\": [\"AD/alex\", \"App/usr_123\"],\n  \"roles\": [\"Finance.Analyst\"],\n  \"certificationStatus\": \"approved\"\n}";
  } else if (/cyberark|privileged|pam|vault/.test(title)) {
    screenTitle = "Privileged Access Console";
    screenLabel = "Illustrative privileged account onboarding view";
    steps = [
      "Discover and inventory the privileged account, owner, target, and platform.",
      "Place the account in the least-privileged safe and assign rotate, retrieve, and connect roles.",
      "Configure verification, reconciliation, rotation schedule, and session monitoring.",
      "Perform retrieval, rotation, session launch, recording, and permission-denial tests."
    ];
    output = "{\n  \"accountName\": \"srv-fin-db-admin\",\n  \"safe\": \"Database.Administrators\",\n  \"rotationEnabled\": true,\n  \"sessionRecording\": true\n}";
  } else if (/active directory|ldap|directory/.test(title)) {
    screenTitle = "Directory Administration";
    screenLabel = "Illustrative directory configuration screen";
    steps = [
      "Create an integration account with the minimum required directory permissions.",
      "Set server, port, base DN, search DN, filters, and TLS certificate trust.",
      "Map immutable employee or object IDs and required account attributes.",
      "Test bind, search, create, modify, disable, and replication behavior."
    ];
    output = "dn: cn=Alex,ou=Users,dc=example,dc=com\nobjectClass: user\nsAMAccountName: alex\nuserAccountControl: 512\nmemberOf: CN=Finance.Users,OU=Groups,DC=example,DC=com";
  }

  const settings = steps.map((step, index) => `<div class="lab-setting"><b>${index + 1}</b><span>${escapeHtml(step)}</span></div>`).join("");
  return `<section class="implementation-lab">
    <div class="lab-heading"><div><span class="eyebrow">IMPLEMENTATION LAB</span><h2>Configure and inspect ${escapeHtml(topic.title)}</h2></div><span class="lab-badge">Reference configuration</span></div>
    <div class="lab-layout">
      <div class="console-window" aria-label="${escapeHtml(screenLabel)}">
        <div class="console-toolbar"><i></i><i></i><i></i><span>${escapeHtml(screenTitle)}</span></div>
        <div class="console-body"><div class="console-nav"><b>Identity</b><span>Applications</span><span>Policies</span><span>Users</span><span>Logs</span></div>
          <div class="console-content"><span class="console-label">${escapeHtml(screenLabel)}</span><h3>${escapeHtml(topic.title)}</h3>${settings}</div></div>
      </div>
      <div class="lab-output"><div class="output-heading"><span>Expected example</span><span>READ-ONLY</span></div><pre><code>${escapeHtml(output)}</code></pre></div>
    </div>
    <div class="validation-strip"><strong>Validation</strong><span>Use a non-production user and compare the request, IAM decision, target state, and audit log using the same correlation ID.</span></div>
  </section>`;
}

function openTopic(number) {
  currentTopic = topics.find(topic => topic.number === number);
  if (!currentTopic) return;
  history.pushState({ topic: number }, "", `#topic-${number}`);
  document.getElementById("topicGrid").hidden = true;
  document.getElementById("topicView").hidden = false;
  document.getElementById("hero").hidden = true;
  document.getElementById("filters").hidden = true;
  document.getElementById("sidebar").querySelectorAll("*").forEach(element => element.scrollTop = 0);
  renderDetail(1);
  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
}

function renderDetail(level) {
  const topic = currentTopic;
  const steps = stepsFor(topic);
  const examples = exampleFor(topic);
  document.getElementById("topicDetail").innerHTML = `
    <div class="detail-hero">
      <span class="eyebrow">TOPIC ${String(topic.number).padStart(3,"0")} · ${categoryNames[topic.category]}</span>
      <h1>${topic.title}</h1>
      <p>${simpleMeaning(topic)}</p>
      <button class="mark-button" id="markButton">Mark reviewed</button>
    </div>
    <div class="level-tabs" aria-label="Mastery level">
      ${[1,2,3].map(value => `<button class="level-tab ${level === value ? "active" : ""}" data-level="${value}">Level ${value} · ${["Simple","Technical","Senior engineer"][value-1]}</button>`).join("")}
    </div>
    ${level === 1 ? simpleLevel(topic, steps) : ""}
    ${level === 2 ? technicalLevel(topic, steps) : ""}
    ${level === 3 ? seniorLevel(topic, steps) : ""}`;
  document.querySelectorAll(".level-tab").forEach(button => button.addEventListener("click", () => renderDetail(Number(button.dataset.level))));
  document.getElementById("markButton").addEventListener("click", () => {
    localStorage.setItem(`iam-topic-${topic.number}`, "true"); updateProgress(); renderTopics();
    document.getElementById("markButton").textContent = "Reviewed ✓";
  });
}

function simpleLevel(topic, steps) {
  return `<section class="study-panel"><h2>One-sentence understanding</h2>
    <div class="answer-box">${topic.title} exists to help the business ${simpleMeaning(topic).replace(/^.*?This is /i, "").toLowerCase()}</div>
    <h3>Think of it this way</h3><p>${steps[0].text}</p><p>${steps[1].text}</p></section>`;
}

function technicalLevel(topic, steps) {
  return `<section class="visual-panel"><h2>How the request moves</h2><div class="flow-diagram">
    ${flowFor(topic).map((node,index,array) => `${index ? '<span class="flow-arrow">→</span>' : ""}<div class="flow-node">${node}</div>`).join("")}
    </div></section>
    <section class="framework-grid">${steps.map((step,index) => `<div class="framework-step"><strong>${index+1}. ${step.label}</strong><p>${step.text}</p></div>`).join("")}</section>
    <section class="visual-panel"><h2>Sequence: what happens step by step</h2><div class="sequence">
    ${sequenceFor(topic).map((item,index) => `<div class="sequence-step"><div class="sequence-num">${index+1}</div><div class="sequence-copy">${item}</div></div>`).join("")}
    </div></section>
    ${implementationLab(topic)}`;
}

function seniorLevel(topic, steps) {
  return `<section class="visual-panel"><h2>Senior engineer answer</h2><div class="answer-box">${interviewAnswer(topic,steps)}</div></section>
    <section class="study-panel"><h2>Operational checklist</h2><div class="example-strip">
      ${exampleFor(topic).map((label,index) => `<div class="example"><strong>${label}</strong><p>${[steps[4].text, steps[5].text, steps[6].text][index]}</p></div>`).join("")}
    </div></section>
    <section class="framework-grid">${steps.map((step,index) => `<div class="framework-step"><strong>${step.label}</strong><p>${step.text}</p></div>`).join("")}</section>`;
}

function interviewAnswer(topic, steps) {
  return `The purpose of <b>${topic.title}</b> is to ${steps[1].text.replace(/^[A-Z]/, c => c.toLowerCase()).replace(/\.$/, "")}. It works by ${steps[2].text.replace(/^[A-Z]/, c => c.toLowerCase()).replace(/\.$/, "")}. In a typical enterprise flow, ${flowFor(topic).join(" sends or passes information to ")}, with controls and outcomes verified at each boundary. Common failures include ${steps[5].text.replace(/Typical risks include /i, "").replace(/\.$/, "")}. I troubleshoot by following one transaction, checking configuration, source state, policy decisions, target state, and correlation-aware logs, then I make the smallest supported fix and validate both success and failure paths.`;
}

function closeTopic() {
  history.replaceState({}, "", location.pathname + location.search);
  document.getElementById("topicGrid").hidden = false;
  document.getElementById("topicView").hidden = true;
  document.getElementById("hero").hidden = false;
  document.getElementById("filters").hidden = false;
  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
}

function updateProgress() {
  const count = topics.filter(topic => localStorage.getItem(`iam-topic-${topic.number}`)).length;
  document.getElementById("masteredCount").textContent = count;
  document.getElementById("progressBar").style.width = topics.length ? `${count / topics.length * 100}%` : "0";
}

function closeMenu() { document.getElementById("sidebar").classList.remove("open"); document.getElementById("scrim").classList.remove("show"); }

document.getElementById("searchInput").addEventListener("input", renderTopics);
document.addEventListener("keydown", event => { if (event.key === "/" && document.activeElement.tagName !== "INPUT") { event.preventDefault(); document.getElementById("searchInput").focus(); } });
document.getElementById("backButton").addEventListener("click", closeTopic);
document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => setCategory(button.dataset.category)));
document.getElementById("menuButton").addEventListener("click", () => { document.getElementById("sidebar").classList.add("open"); document.getElementById("scrim").classList.add("show"); });
document.getElementById("closeButton").addEventListener("click", closeMenu);
document.getElementById("scrim").addEventListener("click", closeMenu);
document.getElementById("themeButton").addEventListener("click", () => document.body.classList.toggle("dark"));
window.addEventListener("popstate", () => {
  const match = location.hash.match(/^#topic-(\d+)$/);
  if (match) openTopic(Number(match[1])); else closeTopic();
});

loadTopics().then(() => {
  const match = location.hash.match(/^#topic-(\d+)$/);
  if (match) openTopic(Number(match[1]));
}).catch(error => {
  document.getElementById("topicGrid").innerHTML = `<div class="empty">Could not load the playbook.<br>${error.message}</div>`;
});
