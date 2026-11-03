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
  // The playbook is embedded in playbook-data.js so the site works when
  // index.html is opened directly from disk (file://). Fall back to fetch()
  // when served over http(s) and the embedded data is unavailable.
  let markdown = typeof window !== "undefined" ? window.PLAYBOOK_MARKDOWN : undefined;
  if (!markdown) {
    const response = await fetch("IAM_Engineer_Interview_Master_Playbook(1).md");
    markdown = await response.text();
  }
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
  // Jump straight to the filtered topics so the user doesn't scroll past the hero.
  scrollToContent("topicGrid");
}

// Scroll an element into view, accounting for the sticky header + filter bar.
function scrollToContent(elementId) {
  requestAnimationFrame(() => {
    const element = document.getElementById(elementId);
    if (!element) return;
    const header = document.querySelector(".topbar");
    const filters = document.getElementById("filters");
    const offset = (header && !header.hidden ? header.offsetHeight : 0) + (filters && !filters.hidden ? filters.offsetHeight : 0);
    const top = element.getBoundingClientRect().top + window.scrollY - offset - 8;
    window.scrollTo({ top: Math.max(top, 0), left: 0, behavior: "smooth" });
  });
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
    "Trace the transaction using a timestamp and correlation ID. Compare source data, IAM state, policy output, target state, and logs at each boundary; correct and retest the full lifecycle.",
    `The purpose of ${topic.title} is to put the right access under control and produce evidence. It works by evaluating trusted identity data against policy and acting on a target, with every decision logged. I configure ownership, mappings, and least privilege, test success and denial paths, and measure the outcome.`,
    "Common follow-ups: How do you prove it works at audit? What breaks first at scale? How do you handle the edge cases and exceptions?"
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

  // Protocol flows use real endpoint, message, and token names from the
  // governing specs (RFC 6749/7636 OAuth + PKCE, OIDC Core, SAML 2.0,
  // RFC 7644 SCIM, RFC 4511 LDAP, RFC 4120 Kerberos, RFC 2865 RADIUS,
  // WebAuthn/FIDO2, X.509/mTLS) so the labels match interview vocabulary.

  // OIDC = OAuth with an id_token. Match it before generic OAuth.
  if (/oidc|openid|id token|id_token/.test(title)) return [
    "User + RP client", "GET /authorize\n(response_type=code, PKCE)", "AuthN + consent\n302 code + state",
    "POST /token\n(code_verifier)", "id_token + access_token\n→ /userinfo claims"
  ];
  if (/authorization code|pkce/.test(title)) return [
    "Client + user-agent", "GET /authorize\n(response_type=code, state, PKCE code_challenge)",
    "302 redirect_uri\n?code=&state=", "POST /token\n(grant_type=authorization_code, code_verifier)",
    "access_token → Resource server"
  ];
  if (/client credentials/.test(title)) return [
    "Confidential client", "POST /token\n(grant_type=client_credentials)", "AuthZ server validates client auth",
    "access_token (no user)", "Bearer token → protected API"
  ];
  if (/refresh token/.test(title)) return [
    "Client", "POST /token\n(grant_type=refresh_token)", "AuthZ server\nrotate + revoke check",
    "new access_token (+ rotated refresh_token)", "Bearer → Resource server"
  ];
  if (/oauth|access token/.test(title)) return [
    "Client", "Authorization server\n(/authorize, /token)", "Authorization grant",
    "access_token (Bearer)", "Resource server\nscope + aud check"
  ];
  if (/saml|federation metadata|ws.federation/.test(title)) return [
    "Browser / user-agent", "SP builds signed AuthnRequest\n(ACS URL, RelayState)", "IdP SSO endpoint\nAuthN + MFA",
    "SAML Response (assertion)\nHTTP-POST → /saml/acs", "SP validates signature → session"
  ];
  if (/jwt|jws|jwe/.test(title)) return [
    "Issuer / IdP", "Header.Payload.Signature\n(alg, kid)", "Relying party / API",
    "Verify via JWKS: iss, aud, exp, sig", "Authorized claims (sub, scope)"
  ];
  if (/scim/.test(title)) return [
    "HR / authoritative source", "Provisioning client\n(externalId mapping)",
    "SCIM /Users & /Groups\nPOST · PUT · PATCH · DELETE", "SCIM service provider\n(Bearer, filter, 2xx/4xx)",
    "Reconcile IAM ↔ target"
  ];
  if (/ldap/.test(title)) return [
    "IAM client", "LDAPS bind\n(TCP 636, TLS)", "BindRequest\n(simple / SASL)",
    "Search / Modify\n(baseDN, filter)", "SearchResultEntry + resultCode"
  ];
  if (/kerberos/.test(title)) return [
    "Client (workstation)", "KDC: Authentication Service (AS)", "AS-REP → TGT",
    "KDC: Ticket Granting Service (TGS)\nTGS-REQ for SPN", "Service ticket → target (AP-REQ)"
  ];
  if (/radius/.test(title)) return [
    "NAS / VPN / WLC", "Access-Request\n(shared secret, EAP)", "RADIUS server\npolicy + MFA",
    "Access-Accept / Reject / Challenge", "Attributes (VLAN, role) + Accounting"
  ];
  if (/fido2|webauthn|passkey/.test(title)) return [
    "Browser + authenticator", "RP challenge\n(rpId, user handle)", "navigator.credentials\ncreate / get",
    "Signed assertion\n(authenticatorData + sig)", "RP verifies vs stored public key"
  ];
  if (/x.509|certificate|pki|mutual tls|mtls| tls/.test(title)) return [
    "Subject / CSR", "CA signs cert\n(chain, SAN, EKU)", "Service presents cert + proves key",
    "Validate chain, hostname, OCSP/CRL, validity", "Trusted mTLS connection"
  ];

  if (/sailpoint|iga|identity governance|certification|correlation|role/.test(title)) return [
    "Authoritative source\n(aggregation)", "Identity cube\n(correlation by key)", "Role / policy / SoD + approval",
    "Connector (provisioning plan)", "Target account + reconciliation + audit"
  ];
  if (/cyberark|privileged session|password rotation|credential provider|pam|vault/.test(title)) return [
    "Privileged user / workload", "PAM broker\n(safe, approval, dual-control)", "Vault (CPM) / PSM session",
    "Target authenticates account", "Session recording + CPM rotation"
  ];
  if (/provision|deprovision|lifecycle/.test(title)) return [
    "HR event (joiner/mover/leaver)", "Identity platform\n(policy + approval)", "Birthright + requested access",
    "Provisioning connector (create/update/disable)", "Target + reconciliation + audit"
  ];
  if (/incident|failed|failure|cannot log|outage|timeout|exhaustion|issues/.test(title)) return [
    "Symptom + correlation ID", "Scope + time window", "Hop-by-hop evidence\n(client→network→IAM→connector→target)",
    "First failed hop → root cause", "Reversible fix + revalidate"
  ];
  if (/scenario|implement|integrat|migrat|design|troubleshoot/.test(title)) return [
    "Requirements + owners", "Trust, identifiers, mappings", "Least-privilege config\n(non-prod)",
    "Positive + denial + rollback tests", "Staged rollout + audit evidence"
  ];
  if (/leadership|design iam|architect|prioritize|mentor/.test(title)) return [
    "Business outcome", "Risk + dependencies", "Decision + trade-offs (RACI)",
    "Delivery with acceptance criteria", "Measures + lessons"
  ];

  const categoryFlows = {
    fundamentals: ["Authoritative source\n(HR / trigger)", "Identity platform\n(attributes + state)", "IAM policy / entitlement", "Enforcement point\n(allow / deny)", "Logs + audit evidence"],
    protocol: ["Client / user-agent", "Protocol endpoint", "Identity provider\n(AuthN + policy)", "Relying party / API\n(validate trust + claims)", "Validated session or token"],
    iga: ["Source event\n(aggregation)", "IGA identity\n(correlation)", "Role / policy + approval", "Target connector", "Reconciliation + audit"],
    product: ["User or workload", "Product policy engine", "Directory / connector", "Application or resource", "Product audit log"],
    ciam: ["Customer", "CIAM journey\n(register / login / recover)", "Risk + MFA + consent", "Session or token (OIDC)", "Customer API"],
    integration: ["Source system", "Integration runtime\n(auth + mapping)", "Authenticated API\n(REST / webhook)", "Target system", "Response + reconciliation"],
    infrastructure: ["Client", "DNS + load balancer", "IAM service node", "Directory / database dependency", "Response + metrics + logs"],
    pam: ["Privileged user / workload", "PAM broker (policy)", "Vault / session manager", "Target system", "Recording + rotation + audit"]
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
    output = "# Step 1 — SP → IdP AuthnRequest (HTTP-Redirect, URL-decoded)\n<samlp:AuthnRequest ID=\"_req123\"\n  AssertionConsumerServiceURL=\"https://app.example.com/saml/acs\"\n  Destination=\"https://idp.example.com/sso/saml\"\n  ProtocolBinding=\"urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST\"\n  IssueInstant=\"2026-11-02T10:15:00Z\">\n  <saml:Issuer>https://app.example.com/saml/metadata</saml:Issuer>\n  <samlp:NameIDPolicy AllowCreate=\"true\" Format=\"urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress\"/>\n</samlp:AuthnRequest>\n\n# Step 2 — IdP → SP signed Response posted to the ACS URL\n<samlp:Response InResponseTo=\"_req123\" Destination=\"https://app.example.com/saml/acs\">\n  <saml:Issuer>https://idp.example.com</saml:Issuer>\n  <samlp:Status><samlp:StatusCode Value=\"urn:oasis:names:tc:SAML:2.0:status:Success\"/></samlp:Status>\n  <saml:Assertion>\n    <ds:Signature>…IdP signing certificate…</ds:Signature>\n    <saml:Subject>\n      <saml:NameID Format=\"...emailAddress\">alex@example.com</saml:NameID>\n      <saml:SubjectConfirmationData InResponseTo=\"_req123\"\n        Recipient=\"https://app.example.com/saml/acs\" NotOnOrAfter=\"2026-11-02T10:20:00Z\"/>\n    </saml:Subject>\n    <saml:Conditions NotBefore=\"2026-11-02T10:14:30Z\" NotOnOrAfter=\"2026-11-02T10:20:00Z\">\n      <saml:AudienceRestriction>\n        <saml:Audience>https://app.example.com/saml/metadata</saml:Audience>\n      </saml:AudienceRestriction>\n    </saml:Conditions>\n    <saml:AuthnStatement AuthnInstant=\"2026-11-02T10:15:05Z\">…</saml:AuthnStatement>\n    <saml:AttributeStatement>…groups, email…</saml:AttributeStatement>\n  </saml:Assertion>\n</samlp:Response>\n\n# SP must validate: XML signature + IdP cert, Issuer, Status=Success,\n# Audience, Recipient, Destination, InResponseTo, NotBefore/NotOnOrAfter (clock skew).";
  } else if (/token|jwt|oidc|oauth/.test(title)) {
    screenTitle = "Authorization Server — Application";
    screenLabel = "Illustrative token configuration screen";
    steps = [
      "Register the exact redirect URI; prefer Authorization Code with PKCE for public clients.",
      "Configure allowed grants, scopes, audience, token lifetime, and proof-of-possession where supported.",
      "Request only required scopes and validate issuer, audience, signature, nonce, and expiration.",
      "Inspect /token response headers, claims, revocation behavior, and refresh-token rotation."
    ];
    output = "# Success — Authorization Code + PKCE exchange (RFC 6749 / 7636)\nPOST /oauth2/token\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=authorization_code&client_id=orders-web&code=_short_lived_code&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback&code_verifier=_pkce_verifier\n\n200 OK\nCache-Control: no-store\n{\n  \"access_token\": \"eyJhbGciOiJSUzI1NiJ9...signed.JWT.payload\",\n  \"id_token\": \"eyJhbGciOiJSUzI1NiJ9...signed.OIDC.payload\",\n  \"token_type\": \"Bearer\",\n  \"expires_in\": 3600,\n  \"scope\": \"openid profile orders.read\",\n  \"refresh_token\": \"rotated-once-use-value\"\n}\n\nDecoded access-token claims (validate iss, aud, exp, scp before trusting):\n{\"iss\":\"https://idp.example.com/oauth2/default\",\"aud\":\"orders-api\",\"sub\":\"00u123\",\"scp\":[\"orders.read\"],\"iat\":1793594400,\"exp\":1793598000}\n\n# Failure — reused/expired code or wrong redirect_uri (RFC 6749 §5.2)\n400 Bad Request\n{\n  \"error\": \"invalid_grant\",\n  \"error_description\": \"The authorization code is invalid, expired, or already redeemed\"\n}";
  } else if (/scim|provision|connector/.test(title)) {
    screenTitle = "Provisioning Integration (SCIM 2.0)";
    screenLabel = "Illustrative SCIM source configuration";
    steps = [
      "Point the connector at the base URL and /Users and /Groups endpoints; authenticate with a least-privilege OAuth Bearer token.",
      "Map externalId to the authoritative immutable key and set userName as the unique login before enabling create (POST).",
      "Enable create (POST), full update (PUT), partial update (PATCH), deactivate (PATCH active:false), and group membership separately.",
      "Run a reconciliation job and compare source, IAM, connector, and target state using the same externalId."
    ];
    output = "# Joiner — create user (RFC 7644)\nPOST /scim/v2/Users\nAuthorization: Bearer <token>\nContent-Type: application/scim+json\n{\n  \"schemas\": [\"urn:ietf:params:scim:schemas:core:2.0:User\"],\n  \"externalId\": \"emp123\",\n  \"userName\": \"alex@example.com\",\n  \"name\": { \"givenName\": \"Alex\", \"familyName\": \"Kim\" },\n  \"emails\": [{ \"value\": \"alex@example.com\", \"primary\": true }],\n  \"active\": true\n}\n\n201 Created\n{\n  \"id\": \"2819c223-7f76-453a-919d-413861904646\",\n  \"externalId\": \"emp123\",\n  \"userName\": \"alex@example.com\",\n  \"active\": true,\n  \"meta\": { \"resourceType\": \"User\", \"location\": \"/scim/v2/Users/2819c223-...\" }\n}\n\n# Leaver — deactivate (partial update)\nPATCH /scim/v2/Users/2819c223-7f76-453a-919d-413861904646\n{\n  \"schemas\": [\"urn:ietf:params:scim:api:messages:2.0:PatchOp\"],\n  \"Operations\": [{ \"op\": \"replace\", \"path\": \"active\", \"value\": false }]\n}\n\n# Common errors: 409 Conflict (duplicate userName), 400 invalidSyntax, 401 invalid token";
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
    output = "# LDAP search result (RFC 4511) over LDAPS :636\ndn: cn=Alex,ou=Users,dc=example,dc=com\nobjectClass: user\nsAMAccountName: alex\nuserPrincipalName: alex@example.com\nuserAccountControl: 512   # 512 = enabled, 514 = disabled\nmemberOf: CN=Finance.Users,OU=Groups,DC=example,DC=com\n\n# Bind failures to recognize:\n#  49 / data 52e  = invalid credentials\n#  49 / data 533  = account disabled\n#  49 / data 775  = account locked out";
  } else if (/kerberos/.test(title)) {
    screenTitle = "Kerberos / Active Directory";
    screenLabel = "Illustrative KDC and SPN configuration";
    steps = [
      "Confirm the service has a unique Service Principal Name (SPN) registered with no duplicates (setspn -Q).",
      "Ensure client, KDC, and target clocks are within 5 minutes (Kerberos rejects larger skew).",
      "Verify DNS forward/reverse records and that the keytab/account password matches the SPN.",
      "Test AS-REQ (get TGT), TGS-REQ (get service ticket), and service access; capture klist output."
    ];
    output = "# RFC 4120 ticket exchange\nAS-REQ  client → KDC (Authentication Service)\nAS-REP  KDC → client : TGT (encrypted with krbtgt key)\nTGS-REQ client → KDC (Ticket Granting Service) for SPN HTTP/app.example.com\nTGS-REP KDC → client : service ticket\nAP-REQ  client → service : presents service ticket (no password sent)\n\nklist\n  Server: HTTP/app.example.com @ EXAMPLE.COM\n  Flags: forwardable renewable  KerbTicket Encryption: AES-256\n\n# Common errors:\n#  KRB_AP_ERR_SKEW        = clock skew too great\n#  KRB_AP_ERR_MODIFIED    = wrong SPN / duplicate SPN / keytab mismatch\n#  KDC_ERR_S_PRINCIPAL_UNKNOWN = SPN not registered";
  } else if (/radius/.test(title)) {
    screenTitle = "RADIUS / Network Access";
    screenLabel = "Illustrative RADIUS client and policy configuration";
    steps = [
      "Register the NAS (VPN / Wi-Fi controller) as a RADIUS client with a strong shared secret.",
      "Configure the authentication source, EAP method, and any MFA step in the policy.",
      "Define authorization attributes to return (VLAN, Filter-Id, Session-Timeout).",
      "Test Access-Accept, Access-Reject, and Access-Challenge, and confirm Accounting Start/Stop."
    ];
    output = "# RFC 2865 exchange\nAccess-Request   NAS → RADIUS (User-Name, shared-secret auth, EAP)\nAccess-Challenge RADIUS → NAS (MFA / additional factor)\nAccess-Accept    RADIUS → NAS\n  Tunnel-Private-Group-Id = 30   (VLAN)\n  Filter-Id = Finance-ACL\n  Session-Timeout = 3600\n\n# Accounting\nAccounting-Request Start → ... → Stop (session usage)\n\n# Common issues: shared-secret mismatch, UDP 1812/1813 blocked, missing NAS entry.";
  } else if (/fido2|webauthn|passkey/.test(title)) {
    screenTitle = "FIDO2 / WebAuthn Relying Party";
    screenLabel = "Illustrative passkey registration configuration";
    steps = [
      "Set the Relying Party ID (rpId) to the registrable domain and allow only the expected origins.",
      "Choose authenticator policy: platform vs cross-platform, residentKey, and userVerification.",
      "On registration, verify attestation, challenge, and origin; store the credential public key and sign count.",
      "On login, issue a fresh challenge and verify the signed assertion against the stored public key."
    ];
    output = "# Registration — navigator.credentials.create()\npublicKey: {\n  rp: { id: \"example.com\", name: \"Example\" },\n  user: { id: <handle>, name: \"alex@example.com\" },\n  challenge: <random>,\n  pubKeyCredParams: [{ type: \"public-key\", alg: -7 }],  // ES256\n  authenticatorSelection: { userVerification: \"required\", residentKey: \"preferred\" }\n}\n\n# Authentication — navigator.credentials.get()\nassertion: {\n  authenticatorData,   // includes rpIdHash + signCount (replay check)\n  clientDataJSON,      // includes challenge + origin (phishing check)\n  signature            // verified against stored public key\n}\n\n# RP must verify: origin, rpIdHash, challenge, signature, and signCount increase.";
  }

  // Content for the other console tabs (Policies / Users / Logs), derived from
  // the topic so each tab shows something relevant instead of being decorative.
  const tabs = labTabs(topic, steps);

  const applicationsPanel = steps.map((step, index) => `<div class="lab-setting"><b>${index + 1}</b><span>${escapeHtml(step)}</span></div>`).join("");
  const listPanel = (label, items) => `<span class="console-label">${escapeHtml(label)}</span>` +
    items.map(item => `<div class="lab-setting"><b>•</b><span>${escapeHtml(item)}</span></div>`).join("");
  const logsPanel = `<span class="console-label">Audit log (example)</span><pre class="lab-log"><code>${escapeHtml(tabs.logs)}</code></pre>`;

  const navItems = ["Applications", "Policies", "Users", "Logs"];
  const nav = `<b>Identity</b>` + navItems.map((name, index) =>
    `<button type="button" class="console-tab ${index === 0 ? "active" : ""}" data-labtab="${name.toLowerCase()}">${name}</button>`).join("");

  const panels = `
    <div class="console-panel active" data-labpanel="applications"><span class="console-label">${escapeHtml(screenLabel)}</span><h3>${escapeHtml(topic.title)}</h3>${applicationsPanel}</div>
    <div class="console-panel" data-labpanel="policies"><h3>Policies &amp; rules</h3>${listPanel(tabs.policiesLabel, tabs.policies)}</div>
    <div class="console-panel" data-labpanel="users"><h3>Identity / account</h3>${listPanel(tabs.usersLabel, tabs.users)}</div>
    <div class="console-panel" data-labpanel="logs"><h3>Logs</h3>${logsPanel}</div>`;

  return `<section class="implementation-lab">
    <div class="lab-heading"><div><span class="eyebrow">IMPLEMENTATION LAB</span><h2>Configure and inspect ${escapeHtml(topic.title)}</h2></div><span class="lab-badge">Reference configuration</span></div>
    <div class="lab-layout">
      <div class="console-window" aria-label="${escapeHtml(screenLabel)}">
        <div class="console-toolbar"><i></i><i></i><i></i><span>${escapeHtml(screenTitle)}</span></div>
        <div class="console-body"><div class="console-nav" role="tablist">${nav}</div>
          <div class="console-content">${panels}</div></div>
      </div>
      <div class="lab-output"><div class="output-heading"><span>Expected example</span><span>READ-ONLY</span></div><pre><code>${escapeHtml(output)}</code></pre></div>
    </div>
    <div class="validation-strip"><strong>Validation</strong><span>Use a non-production user and compare the request, IAM decision, target state, and audit log using the same correlation ID.</span></div>
  </section>`;
}

// Builds the Policies / Users / Logs tab content for the Implementation Lab.
function labTabs(topic, steps) {
  const title = topic.title.toLowerCase();
  const name = topic.title;

  const generic = {
    policiesLabel: "Rules enforced for this capability",
    policies: [
      "Who may request it and who approves it (ownership + approval).",
      "Conditions required: group/role, attributes, MFA, or risk level.",
      "Least privilege: grant the minimum scope and expire it on lifecycle events."
    ],
    usersLabel: "Identity / account shape",
    users: [
      "Stable unique key (e.g. employeeId / externalId) correlating source to target.",
      "Account state and the entitlements granted by this capability.",
      "Lifecycle: created on joiner, updated on mover, disabled on leaver."
    ],
    logs: `time=2026-11-02T10:15:05Z corrId=req-9f2 user=alex@example.com action=${name} result=SUCCESS\ntime=2026-11-02T10:16:40Z corrId=req-9f3 user=mallory@example.com action=${name} result=DENY reason=policy`
  };

  if (/saml/.test(title)) return {
    policiesLabel: "SAML trust & sign-on policy",
    policies: [
      "Audience restriction = SP entity ID; only registered ACS URLs accepted.",
      "Require signed assertions (SHA-256) and enforce assertion lifetime + clock skew.",
      "Sign-on policy: session lifetime, MFA, and allowed authentication context."
    ],
    usersLabel: "Subject (NameID) & attributes",
    users: [
      "NameID = alex@example.com (emailAddress format), stable across logins.",
      "Mapped attributes: email, groups → application roles.",
      "SP-side session created only after signature + condition checks pass."
    ],
    logs: "time=10:15:05Z corrId=_req123 event=SSO user=alex@example.com sp=app.example.com result=SUCCESS\ntime=10:16:12Z corrId=_req124 event=SSO user=alex@example.com result=FAIL reason=AUDIENCE_MISMATCH\ntime=10:17:48Z corrId=_req125 event=SSO result=FAIL reason=ASSERTION_EXPIRED (clock skew)"
  };
  if (/token|jwt|oidc|oauth/.test(title)) return {
    policiesLabel: "Grants, scopes & token policy",
    policies: [
      "Allowed grant types (Authorization Code + PKCE) and exact redirect URIs.",
      "Scopes and audience the client may request; consent requirements.",
      "Access-token lifetime, refresh-token rotation, and revocation policy."
    ],
    usersLabel: "Token subject & claims",
    users: [
      "sub = 00u123, the stable subject identifier.",
      "Granted scopes: openid profile orders.read (scp claim).",
      "Resource server validates iss, aud, exp, and signature before trusting."
    ],
    logs: "time=10:15:05Z corrId=req-9f2 event=token.grant client=orders-web grant=authorization_code result=SUCCESS\ntime=10:15:40Z corrId=req-9f3 event=token.grant client=orders-web result=DENY error=invalid_grant (code reused)\ntime=10:16:02Z corrId=req-9f4 event=api.access aud=orders-api result=401 reason=token_expired"
  };
  if (/scim|provision|connector/.test(title)) return {
    policiesLabel: "Provisioning policy",
    policies: [
      "Which attributes are authoritative and pushed to the target.",
      "Create/update/deactivate enabled per operation; no deletes unless required.",
      "Deactivate (PATCH active:false) on leaver rather than deleting the record."
    ],
    usersLabel: "SCIM user resource",
    users: [
      "externalId = emp123 maps the source identity to the target account.",
      "userName = alex@example.com is the unique login.",
      "active=true (joiner) → active=false (leaver); reconciled by externalId."
    ],
    logs: "time=10:15:05Z corrId=prov-11 op=POST /Users externalId=emp123 result=201\ntime=10:40:00Z corrId=prov-12 op=PATCH /Users/2819c223 active=false result=200 (leaver)\ntime=10:41:00Z corrId=prov-13 op=POST /Users externalId=emp123 result=409 reason=duplicate"
  };
  if (/cyberark|privileged|pam|vault/.test(title)) return {
    policiesLabel: "Safe & session policy",
    policies: [
      "Safe membership: who may retrieve, rotate, or connect.",
      "Dual control / request-approval and time-window restrictions.",
      "Session recording and command filtering; rotation after each use."
    ],
    usersLabel: "Privileged account",
    users: [
      "accountName = srv-fin-db-admin stored in safe Database.Administrators.",
      "Credential retrieved via broker; password never shown to the user.",
      "Rotation and verification keep vault and target in sync."
    ],
    logs: "time=10:15:05Z corrId=pam-7 user=alex action=retrieve account=srv-fin-db-admin result=SUCCESS\ntime=10:20:00Z corrId=pam-7 event=PSM.session recorded=true\ntime=10:25:00Z corrId=pam-8 user=bob action=retrieve result=DENY reason=not_in_safe"
  };
  if (/sailpoint|iga|certification|correlation|role/.test(title)) return {
    policiesLabel: "Roles, SoD & certification",
    policies: [
      "Correlation rule: match accounts to identities by a stable key.",
      "Role model and Separation-of-Duties rules that block toxic combinations.",
      "Certification campaigns: scope, reviewers, and revoke-on-no-decision."
    ],
    usersLabel: "Identity cube",
    users: [
      "identityKey = emp123 with linked accounts across AD and apps.",
      "Roles: Finance.Analyst; entitlements derived from role membership.",
      "Certification status recorded as evidence for audit."
    ],
    logs: "time=10:15:05Z corrId=iga-3 event=aggregate source=AD identities=1240\ntime=10:30:00Z corrId=iga-4 event=certification.decision item=Finance.Analyst reviewer=mgr result=APPROVED\ntime=10:31:00Z corrId=iga-5 event=sod.violation rule=AP-AR result=BLOCKED"
  };

  return generic;
}

function openTopic(number) {
  currentTopic = topics.find(topic => topic.number === number);
  if (!currentTopic) return;
  history.pushState({ topic: number }, "", `#topic-${number}`);
  document.getElementById("topicGrid").hidden = true;
  document.getElementById("topicView").hidden = false;
  document.getElementById("introView").hidden = true;
  document.getElementById("introLink").classList.remove("active");
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
  document.querySelectorAll(".level-tab").forEach(button => button.addEventListener("click", () => { renderDetail(Number(button.dataset.level)); scrollToContent("topicDetail"); }));
  document.getElementById("markButton").addEventListener("click", () => {
    localStorage.setItem(`iam-topic-${topic.number}`, "true"); updateProgress(); renderTopics();
    document.getElementById("markButton").textContent = "Reviewed ✓";
  });
  // Wire the Implementation Lab console tabs (Applications / Policies / Users / Logs).
  document.querySelectorAll(".implementation-lab").forEach(lab => {
    const tabs = lab.querySelectorAll(".console-tab");
    const panels = lab.querySelectorAll(".console-panel");
    tabs.forEach(tab => tab.addEventListener("click", () => {
      const target = tab.dataset.labtab;
      tabs.forEach(button => button.classList.toggle("active", button === tab));
      panels.forEach(panel => panel.classList.toggle("active", panel.dataset.labpanel === target));
      // Keep the lab in view so the switched panel's content is visible.
      requestAnimationFrame(() => lab.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    }));
  });
}

function simpleLevel(topic, steps) {
  return `<section class="study-panel"><h2>One-sentence understanding</h2>
    <div class="answer-box">${topic.title} exists to help the business ${simpleMeaning(topic).replace(/^.*?This is /i, "").toLowerCase()}</div>
    <h3>Think of it this way</h3><p>${steps[0].text}</p><p>${steps[1].text}</p></section>`;
}

function technicalLevel(topic, steps) {
  return `<section class="visual-panel"><h2>How the request moves</h2><div class="flow-diagram">
    ${flowFor(topic).map((node,index,array) => {
      const [main, ...rest] = String(node).split("\n");
      const detail = rest.length ? `<small>${escapeHtml(rest.join(" "))}</small>` : "";
      return `${index ? '<span class="flow-arrow">→</span>' : ""}<div class="flow-node"><span>${escapeHtml(main)}</span>${detail}</div>`;
    }).join("")}
    </div></section>
    <section class="framework-grid">${steps.slice(0,7).map((step,index) => `<div class="framework-step"><strong>${index+1}. ${step.label}</strong><p>${step.text}</p></div>`).join("")}</section>
    <section class="visual-panel"><h2>Sequence: what happens step by step</h2><div class="sequence">
    ${sequenceFor(topic).map((item,index) => `<div class="sequence-step"><div class="sequence-num">${index+1}</div><div class="sequence-copy">${item}</div></div>`).join("")}
    </div></section>
    ${implementationLab(topic)}`;
}

function seniorLevel(topic, steps) {
  const followUps = steps[8] && steps[8].text
    ? `<section class="study-panel"><h2>Likely follow-up questions</h2><div class="answer-box">${steps[8].text}</div></section>`
    : "";
  return `<section class="visual-panel"><h2>Senior engineer answer</h2><div class="answer-box">${interviewAnswer(topic,steps)}</div></section>
    ${followUps}
    <section class="study-panel"><h2>Operational checklist</h2><div class="example-strip">
      ${exampleFor(topic).map((label,index) => `<div class="example"><strong>${label}</strong><p>${[steps[4].text, steps[5].text, steps[6].text][index]}</p></div>`).join("")}
    </div></section>
    <section class="framework-grid">${steps.slice(0,7).map((step,index) => `<div class="framework-step"><strong>${step.label}</strong><p>${step.text}</p></div>`).join("")}</section>`;
}

function interviewAnswer(topic, steps) {
  // Prefer the authored "Say it" answer (step index 7) when the topic provides one.
  const sayIt = steps[7] && steps[7].text;
  if (sayIt && !/^The purpose of .* is to put the right access under control/.test(sayIt)) {
    return escapeHtml(sayIt).replace(new RegExp(`\\b${topic.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`), `<b>${escapeHtml(topic.title)}</b>`);
  }
  return `The purpose of <b>${topic.title}</b> is to ${steps[1].text.replace(/^[A-Z]/, c => c.toLowerCase()).replace(/\.$/, "")}. It works by ${steps[2].text.replace(/^[A-Z]/, c => c.toLowerCase()).replace(/\.$/, "")}. In a typical enterprise flow, ${flowFor(topic).join(" sends or passes information to ")}, with controls and outcomes verified at each boundary. Common failures include ${steps[5].text.replace(/Typical risks include /i, "").replace(/\.$/, "")}. I troubleshoot by following one transaction, checking configuration, source state, policy decisions, target state, and correlation-aware logs, then I make the smallest supported fix and validate both success and failure paths.`;
}

function closeTopic() {
  history.replaceState({}, "", location.pathname + location.search);
  document.getElementById("topicGrid").hidden = false;
  document.getElementById("topicView").hidden = true;
  document.getElementById("introView").hidden = true;
  document.getElementById("hero").hidden = false;
  document.getElementById("filters").hidden = false;
  document.getElementById("introLink").classList.remove("active");
  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
}

function updateProgress() {
  const count = topics.filter(topic => localStorage.getItem(`iam-topic-${topic.number}`)).length;
  document.getElementById("masteredCount").textContent = count;
  document.getElementById("progressBar").style.width = topics.length ? `${count / topics.length * 100}%` : "0";
}

function closeMenu() { document.getElementById("sidebar").classList.remove("open"); document.getElementById("scrim").classList.remove("show"); }

// ---------------------------------------------------------------------------
// Introduction page: a ~5-minute spoken pitch per domain.
// Replace the [bracketed placeholders] with your real companies, products,
// scale numbers, and outcomes. Keep it conversational — read it aloud.
// ---------------------------------------------------------------------------
const introPitches = [
  {
    key: "overview",
    tag: "THE 60-SECOND OPENER",
    title: "Who I am",
    minutes: "~1 min",
    lead: "Use this as your quick opener, then go deep on whichever domain the role emphasizes.",
    paragraphs: [
      "I'm an identity and access management engineer with over ten years of hands-on experience across the full identity space — governance, access management, privileged access, and federal-grade ICAM. I've spent my career making sure the right people and services get the right access to the right systems, and that every bit of it can be proven to an auditor.",
      "What I bring is breadth plus depth. I can design an enterprise IAM architecture end to end, but I'm also the person who gets into the logs at 2 a.m. and traces a broken SSO flow hop by hop. Over the years I've led joiner-mover-leaver automation, built access certification programs, rolled out MFA and Zero Trust, onboarded privileged accounts into a vault, and integrated HR, directories, cloud identity providers, and dozens of applications into one coherent identity fabric.",
      "The way I think about identity is simple: access is what attackers want and what auditors check, so I treat IAM as a tier-zero service. I anchor everything on an authoritative source, drive access through policy and roles, automate the lifecycle, and make sure every decision is logged and reconciled. That mindset is the thread that runs through all four domains I work in."
    ],
    closer: "Then pivot: \"Depending on what matters most for this role, I can go deeper on governance, access management, privileged access, or ICAM — where would you like me to start?\""
  },
  {
    key: "iga",
    tag: "IDENTITY GOVERNANCE — IGA",
    title: "My IGA story",
    minutes: "~5 min",
    lead: "Lead with this for governance-heavy roles (SailPoint, Saviynt, access reviews, SOX).",
    paragraphs: [
      "Identity governance is where I've spent the deepest part of my career. At its heart, IGA answers one question for every person and service in the company: should they have this access, and can we prove it. I've built and run that answer end to end.",
      "The foundation I always start from is the authoritative source and clean correlation. I've integrated HR systems like [Workday/SuccessFactors] as the system of record, aggregated accounts from [number] applications, and built correlation rules on a stable immutable key so one person maps to exactly one identity — no duplicates, no mis-correlation. That accuracy is what everything else stands on, because governance built on bad correlation quietly corrupts every report and every certification.",
      "On top of that I've automated the joiner-mover-leaver lifecycle. A hire in HR flows into [SailPoint IdentityIQ / Identity Security Cloud], the identity is created and correlated, birthright access is granted by role on day one, and connectors fulfill it into Active Directory and applications. The case I care most about is the mover and the leaver: movers have to revoke the old team's access as aggressively as they grant the new, or you get privilege creep, and leavers get a fast disable followed by full deprovisioning against an SLA — because incomplete offboarding is exactly how breaches and failed audits happen. I measure time-to-revoke and completeness, and I reconcile so I can prove a leaver truly lost access everywhere.",
      "I've designed the access model too — a two-layer role structure where business roles map to job functions and carry technical access profiles and entitlements. I mine roles from real access patterns rather than inventing them, and I'm disciplined about not spawning a new role for every exception, because role explosion is what makes certifications meaningless.",
      "And I've run the governance controls that auditors live on: access certification campaigns scoped by risk so reviewers see described, risk-rated entitlements instead of cryptic group names, Separation-of-Duties policies enforced both preventively at request and detectively in scans, and mitigating controls with owners and expiry for the conflicts the business genuinely needs. When an auditor asks who had access to a system last quarter and who approved it, I can answer in minutes, not weeks.",
      "The impact I've delivered is [X% reduction in manual provisioning, Y hours saved per onboarding, cleaner audits with fewer findings]. But the thread through all of it is the same: tie access to authoritative events, make it least-privilege, and produce evidence automatically."
    ],
    closer: "Strong close: \"So governance, to me, isn't a tool — it's the discipline of making access correct, least-privilege, and provable, and automating it so it stays that way as the organization changes.\""
  },
  {
    key: "iam",
    tag: "ACCESS MANAGEMENT — IAM / AUTHN",
    title: "My IAM / Access Management story",
    minutes: "~5 min",
    lead: "Lead with this for access-management roles (Okta, Entra, Ping, SSO/MFA, federation, Zero Trust).",
    paragraphs: [
      "On the access-management side, my job is the front door — making sure every authentication is both seamless for the user and genuinely trustworthy. I've run SSO, MFA, and federation at scale across [Okta / Entra ID / PingFederate].",
      "I'm fluent in the protocols at a level where I can debug them, not just enable them. With SAML I know exactly what the service provider validates on an assertion — signature, issuer, audience, recipient, InResponseTo, and the timestamps — so when SSO breaks at 2 a.m. I decode the actual assertion and find the mismatch, which is almost always an expired signing certificate, an audience mismatch, or clock skew. With OAuth and OIDC I'm precise about the difference between an access token and an ID token, I default to Authorization Code with PKCE, and I know why invalid_grant or a signature-validation failure happens and how to trace it.",
      "Federation is a core strength — establishing trust between identity providers and service providers so users authenticate once at their home IdP and no password ever crosses the boundary. I treat certificate lifecycle as a first-class design concern, because a rotated or expired signing cert is the classic federation outage, and I rotate with overlap and automated metadata so it never takes anyone down.",
      "On MFA and adaptive authentication, I've rolled out phishing-resistant factors — FIDO2, passkeys, authenticator push with number matching — rather than relying on SMS, and I enforce it through risk-based policy like Conditional Access, so users get friction only when the risk actually warrants it. That's the balance: strong where it matters, invisible where it doesn't.",
      "All of this ladders up to Zero Trust, which I'm careful to describe as more than just MFA. It means never trusting by network location, verifying every request explicitly against identity, device, and context, enforcing least privilege with just-in-time access, and assuming breach. Identity is the control plane, and I've built the concrete controls — MFA everywhere, blocking legacy authentication, device-based and risk-based conditional access, per-request authorization.",
      "Because the identity provider is tier-zero — if it's down, every application is down — I architect it for high availability and disaster recovery, with clustered nodes, shared session state, and tested failover. The outcome I've delivered is [single sign-on across N applications, MFA coverage raised to X%, legacy auth eliminated, measurable drop in account-takeover]. The through-line is that authentication should be effortless for the user and ironclad in what it actually proves."
    ],
    closer: "Strong close: \"Access management is where security meets user experience every single day, and my job is to make both win at once — seamless login that an attacker still can't fake.\""
  },
  {
    key: "pam",
    tag: "PRIVILEGED ACCESS — PAM",
    title: "My PAM story",
    minutes: "~5 min",
    lead: "Lead with this for privileged-access roles (CyberArk, Delinea, BeyondTrust, secrets, JIT).",
    paragraphs: [
      "Privileged access is where the stakes are highest — these are the accounts that, if compromised, hand an attacker the keys to the kingdom. My job in PAM is to make sure powerful accounts are controlled, that nobody actually sees a password, that everything is recorded, and that credentials rotate so a leaked one is useless fast.",
      "I've run privileged access on [CyberArk], so I think in terms of the Vault, PVWA, the CPM, and PSM. The Vault is the hardened, encrypted core; access is granted at the Safe level, so I segregate Safes by team and sensitivity for least privilege. The real value is in two things working together: the CPM rotates, verifies, and reconciles credentials automatically — because a vaulted password that never rotates is only half a control — and PSM brokers sessions so a user connects to a target without ever seeing the password, with the whole session recorded and command-filtered.",
      "Onboarding privileged accounts at scale is something I've done end to end: discover the accounts first, map their dependencies — which services and scheduled tasks use them — then onboard into the right Safe and platform and rotate so only the Vault knows the credential. That dependency mapping is critical, because the classic PAM incident is rotating a service account and breaking everything that cached the old password. For that I use dependency-aware rotation, or better, move applications to fetch credentials at runtime through a Credential Provider so there's no stored secret at all and rotation becomes transparent.",
      "I've protected the crown jewels specifically — domain admins and the kind of accounts that lead to domain dominance — with one-time rotation, dual control, and full session recording, aligned to a tiered-administration model. And I've detected privileged misuse, not just prevented it, feeding privileged activity into analytics that flag credential theft or anomalous sessions and can automatically rotate a suspect credential.",
      "The modern direction I push is eliminating standing privilege altogether — moving from always-on admin to just-in-time, time-bound, approval-gated elevation through PAM and tools like Entra PIM, and shifting cloud access to short-lived federated credentials instead of long-lived keys. On the DevOps side I've managed secrets so pipelines and workloads authenticate with platform-native identity and fetch dynamic, short-lived secrets rather than hard-coding them.",
      "The outcome I've delivered is [N privileged accounts brought under management, standing admin reduced by X%, full session recording for audit, rotation on every sensitive credential]. The principle behind all of it: no standing privilege, no exposed passwords, and a complete recording of everything a privileged user did."
    ],
    closer: "Strong close: \"PAM is about assuming the powerful account will eventually be targeted — so I make sure the credential is never exposed, never standing, and never usable for long, and that every privileged action is on the record.\""
  },
  {
    key: "icam",
    tag: "FEDERAL IDENTITY — ICAM",
    title: "My ICAM story",
    minutes: "~5 min",
    lead: "Lead with this for federal / public-sector roles (ICAM, FICAM, PIV/CAC, derived credentials, Zero Trust mandates).",
    paragraphs: [
      "ICAM — Identity, Credential, and Access Management — is the federal government's framework for identity, and it raises the bar on everything: credentials are cryptographic and hardware-backed, assurance levels are mandated, and the entire program maps to federal policy. I've worked in that higher-assurance world, aligning identity to the FICAM architecture and the relevant mandates.",
      "The defining piece is credential strength. Instead of passwords, ICAM centers on PIV and CAC smart cards — X.509 certificates on a hardware token, validated against a trust chain with revocation checking. I'm fluent in that PKI world: certificate lifecycle, trust anchors, OCSP and CRL revocation, and certificate-based authentication where the user proves possession of a private key that never leaves the card. For mobile and modern endpoints, I've worked with derived credentials, which extend that PIV-level assurance onto devices that can't take a smart card.",
      "ICAM also formalizes identity assurance — proofing someone's real-world identity, binding them to a credential at a defined assurance level, and authenticating at a matching level, the kind of structure NIST lays out for identity, authenticator, and federation assurance. So I design to an assurance target rather than a one-size-fits-all login, matching the strength of proofing and authentication to the sensitivity of what's being accessed.",
      "On the access side, the same governance and least-privilege discipline applies, but with federal rigor: role- and attribute-based access tied to mission need, strict separation of duties, continuous auditing, and alignment to the federal Zero Trust push, where identity is explicitly the foundation and every request is verified. I've integrated these controls across agency systems while meeting the documentation and compliance expectations that come with government work.",
      "What makes ICAM distinct from commercial IAM is the combination of hardware-backed cryptographic credentials, mandated assurance levels, and policy-driven compliance — there's far less tolerance for shortcuts, and everything has to be demonstrable. My experience is translating the commercial IAM playbook into that higher-assurance, policy-bound environment without losing usability.",
      "The outcome I've delivered is [PIV/CAC-based authentication across N systems, derived credentials enabling secure mobile access, alignment to the federal Zero Trust and ICAM mandates, clean compliance reviews]. The core idea: in ICAM, identity is proven with cryptography and governed to a standard, not just configured."
    ],
    closer: "Strong close: \"ICAM is commercial identity with the assurance dial turned all the way up — hardware-backed credentials, mandated assurance, and provable compliance — and I know how to deliver that without making it unusable.\""
  }
];

function renderIntro() {
  const detail = document.getElementById("introDetail");
  const nav = introPitches.map((p, i) =>
    `<button type="button" class="intro-tab ${i === 0 ? "active" : ""}" data-introtab="${p.key}">${p.title}<small>${p.minutes}</small></button>`).join("");
  const panels = introPitches.map((p, i) => `
    <article class="intro-panel ${i === 0 ? "active" : ""}" data-intropanel="${p.key}">
      <span class="eyebrow">${escapeHtml(p.tag)}</span>
      <h1>${escapeHtml(p.title)}</h1>
      <p class="intro-lead">${escapeHtml(p.lead)}</p>
      ${p.paragraphs.map(par => `<p>${escapeHtml(par)}</p>`).join("")}
      <div class="intro-closer"><strong>How to close</strong><span>${escapeHtml(p.closer)}</span></div>
    </article>`).join("");
  detail.innerHTML = `
    <div class="detail-hero intro-hero">
      <span class="eyebrow">INTERVIEW OPENER · 10+ YEARS</span>
      <h1>My Introduction</h1>
      <p>Four ready-to-speak pitches. Open the one that fits the role, read it aloud, and swap the <b>[bracketed placeholders]</b> for your real companies, products, scale, and results.</p>
    </div>
    <div class="intro-tabs" role="tablist">${nav}</div>
    <div class="intro-panels">${panels}</div>`;
  detail.querySelectorAll(".intro-tab").forEach(tab => tab.addEventListener("click", () => {
    const target = tab.dataset.introtab;
    detail.querySelectorAll(".intro-tab").forEach(b => b.classList.toggle("active", b === tab));
    detail.querySelectorAll(".intro-panel").forEach(panel => panel.classList.toggle("active", panel.dataset.intropanel === target));
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
  }));
}

function openIntro() {
  history.pushState({ intro: true }, "", "#intro");
  renderIntro();
  document.getElementById("topicGrid").hidden = true;
  document.getElementById("topicView").hidden = true;
  document.getElementById("introView").hidden = false;
  document.getElementById("hero").hidden = true;
  document.getElementById("filters").hidden = true;
  document.getElementById("introLink").classList.add("active");
  document.querySelectorAll(".category-nav a").forEach(link => link.classList.remove("active"));
  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
}

document.getElementById("searchInput").addEventListener("input", renderTopics);
document.addEventListener("keydown", event => { if (event.key === "/" && document.activeElement.tagName !== "INPUT") { event.preventDefault(); document.getElementById("searchInput").focus(); } });
document.getElementById("backButton").addEventListener("click", closeTopic);
document.getElementById("introBack").addEventListener("click", closeTopic);
document.getElementById("introLink").addEventListener("click", event => { event.preventDefault(); openIntro(); closeMenu(); });
document.getElementById("introFilter").addEventListener("click", () => { openIntro(); closeMenu(); });
document.querySelectorAll(".filter[data-category]").forEach(button => button.addEventListener("click", () => setCategory(button.dataset.category)));
document.getElementById("menuButton").addEventListener("click", () => { document.getElementById("sidebar").classList.add("open"); document.getElementById("scrim").classList.add("show"); });
document.getElementById("closeButton").addEventListener("click", closeMenu);
document.getElementById("scrim").addEventListener("click", closeMenu);
document.getElementById("themeButton").addEventListener("click", () => document.body.classList.toggle("dark"));
window.addEventListener("popstate", () => {
  const match = location.hash.match(/^#topic-(\d+)$/);
  if (match) openTopic(Number(match[1]));
  else if (location.hash === "#intro") openIntro();
  else closeTopic();
});

loadTopics().then(() => {
  const match = location.hash.match(/^#topic-(\d+)$/);
  if (match) openTopic(Number(match[1]));
  else if (location.hash === "#intro") openIntro();
}).catch(error => {
  document.getElementById("topicGrid").innerHTML = `<div class="empty">Could not load the playbook.<br>${error.message}</div>`;
});
