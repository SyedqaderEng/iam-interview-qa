const fs = require("fs");
const sourcePath = "IAM_Engineer_Interview_Master_Playbook(1).md";
const dataPath = "playbook-data.js";
const source = fs.readFileSync(sourcePath, "utf8");

const topics = [
[`1. What is IAM and why an enterprise needs it`, [
"IAM is the discipline that establishes identity and controls what that identity can access across the organization. It covers the full lifecycle of people, applications, devices, and service accounts, including authentication, authorization, and access governance.",
"Enterprises need IAM to replace inconsistent or manual access decisions with a controlled process. IAM reduces excessive privilege, supports timely joins and departures, improves productivity, and provides evidence that access decisions were reviewed and approved.",
"A typical process begins with an authoritative record, often from HR. The IAM platform creates or correlates the identity, evaluates lifecycle and role policy, sends access changes to target systems, and reconciles the result. Authentication verifies the identity at sign-in, while authorization determines the allowed action.",
"Authoritative source → identity platform or directory → IGA and access-management policy → provisioning connectors or authentication endpoints → target applications and resources → centralized logs and audit evidence.",
"I would first define ownership, the authoritative source, and a stable immutable identifier. I would then configure lifecycle rules, birthright roles, provisioning permissions, authentication policy, monitoring, reconciliation, and audit retention before enabling automation at scale.",
"The most common problems are late or incorrect source data, weak correlation, incomplete movers, slow offboarding, excessive standing privilege, connector failures, and systems that are outside the controlled process. Each creates a gap that can affect both security and audit results.",
"I trace one identity and one access event from the source record through correlation, policy, fulfillment, and target state. I compare timestamps and identifiers at every boundary, review logs and connector results, and correct the earliest failed step before retesting the complete lifecycle.",
"I explain IAM as the framework an organization uses to control access across the complete identity lifecycle. I begin with trusted identity data, apply policy and roles, automate lifecycle changes, enforce authentication and authorization, and retain evidence so I can demonstrate what happened.",
"How do you choose and protect the authoritative source? How do you prove that all identities and accounts are complete? How do you measure provisioning, leaver effectiveness, and access-control coverage?"
]],
[`2. Difference between IAM, IGA, Access Management, PAM and CIAM`, [
"IAM is the overall discipline that controls digital identity and access. IGA governs who should have access and maintains the lifecycle; Access Management performs authentication, SSO, federation, and session control; PAM protects privileged identities and sessions; CIAM provides identity services for customers or consumers.",
"The distinctions help teams assign ownership, select controls, and design integrations. The domains share identity data but have different risk models, service objectives, and operational responsibilities.",
"IGA evaluates access through roles, approvals, certifications, and SoD policy. Access Management establishes a session or token for runtime access. PAM controls elevated credentials and brokers privileged sessions. CIAM handles registration, login, recovery, consent, and customer-scale risk signals.",
"HR and identity governance → directory and target applications; workforce or customer IdP → authentication and federation; PAM broker, vault, and session manager → privileged targets; CIAM journey and risk policy → consumer applications.",
"I keep the domains integrated but avoid mixing their responsibilities. IGA should request and approve access, Access Management should enforce authenticated policy, PAM should protect elevated accounts, and CIAM should use customer-focused journeys and risk models.",
"Problems arise when governance is performed inside an access-management tool, when PAM is treated as only a password vault, when workforce and customer identities are combined without clear risk boundaries, or when the ownership of an access decision is unclear.",
"I identify the control that owns the failing decision. If access was provisioned incorrectly, I review IGA; if sign-in failed, I review Access Management; if an elevated session was denied or recorded incorrectly, I review PAM; and if registration or recovery failed, I review CIAM.",
"I describe IAM as the umbrella discipline, with IGA governing lifecycle and access, Access Management controlling runtime sign-in, PAM protecting privileged operations, and CIAM serving external identities. Each domain has a clear responsibility, and the data and audit trail connect them.",
"Where does IGA end and runtime access begin? Why are workforce and customer identities often managed separately? Which controls remain shared across the domains?"
]],
[`3. Authentication versus authorization`, [
"Authentication answers whether a subject has proved its claimed identity. Authorization answers what that subject is permitted to do after identity has been established, based on policy and the requested resource or action.",
"Separating these functions is important because authentication and authorization failures require different evidence and remediation. A successful login with a denied operation is not the same issue as an invalid credential or an untrusted token.",
"The IdP or credential service validates the factor and creates a session or token. At the enforcement point, the application evaluates the subject, claims, scopes, roles, resource, and context. It then allows or denies the specific action and records the decision.",
"User or workload → authentication service → verified subject and claims → policy enforcement point → resource and authorization decision → application and security logs.",
"I centralize authentication and strong factors at the IdP. I place authorization close to the protected resource, use signed claims and scopes, validate token issuer and audience, and avoid maintaining hidden application-specific authorization rules whenever policy can be central.",
"Common issues include accepting a token for the wrong audience, stale claims after role changes, overly broad scopes, missing resource checks, and duplicate authorization logic across applications.",
"For a 401 response, I validate credentials and token validity, signature, issuer, audience, and expiry. For a 403 response, I inspect the validated subject, scopes, roles, claims, resource attributes, and policy decision rather than the original login factor.",
"Authentication establishes who the subject is, while authorization determines what it may do. A successful authentication and a denial together are expected behavior when the subject lacks permission; the HTTP status and policy evidence usually identify which stage failed.",
"What is the HTTP 401 versus 403 distinction? How do authorization decisions change after a role assignment? Where should policy decisions be enforced?"
]],
[`4. Identification versus authentication versus authorization`, [
"Identification is the claim that a subject is associated with a particular identifier. Authentication provides evidence that the subject owns or controls that identity. Authorization uses the authenticated subject and policy context to decide what it may access.",
"These stages establish increasing levels of trust. A displayed username is not proof of identity, and neither authentication nor authorization should be based on an identifier that has not been bound to a verified subject.",
"The subject first supplies an identifier. The system binds that identifier to a credential, factor, device, or certificate, and creates a verified subject. An enforcement point then evaluates authorization policy for the requested operation.",
"Identifier claim → factor validation → verified subject and session → policy evaluation → allow or deny; each stage generates evidence.",
"I treat user-provided identifiers as untrusted until verification succeeds. I return uniform authentication and recovery messages, protect account enumeration paths, and require step-up authentication for sensitive authorization decisions.",
"Failures include trusting a header without authentication, spoofed identifiers, enumeration through different responses, stale account identifiers, and authorization performed before a valid subject exists.",
"I determine which stage produced the result. If only a claim was received, I stop before authorization. If authentication succeeded, I inspect token or session state. If authentication is valid but access is wrong, I review claims and policy.",
"Identification is a statement, authentication is proof, and authorization is permission. I never authorize an action on identification alone, because the identifier does not establish that the current user controls the account.",
"How do uniform error messages prevent enumeration? When should an application require step-up authentication? Does a username in an audit log prove the user performed the action?"
]],
[`5. Joiner, Mover, Leaver lifecycle`, [
"The Joiner, Mover, and Leaver lifecycle connects employment or identity-state changes to controlled access actions. Joiners receive approved access, movers lose obsolete entitlements as new access is granted, and leavers lose access according to risk and service-level targets.",
"Lifecycle automation reduces manual provisioning, privilege accumulation, and delayed offboarding. Movers are especially important because adding new roles without removing old roles creates ongoing privilege creep.",
"An HR or authoritative-source event changes the identity record. The IGA platform correlates or creates the identity, evaluates lifecycle and birthright policy, generates provisioning actions, and reconciles the result with directories and applications. Leavers are also disabled at identity-provider and active-session layers where required.",
"Authoritative HR event → identity platform and policy → joiner, mover, or leaver workflow → provisioning and disable operations → target systems, sessions, and token revocation → reconciliation.",
"I define explicit joiner, transfer, leave-of-absence, return, termination, rehire, and contractor rules. I grant birthright access from validated attributes, revoke mover access through the old-role policy, and split immediate disablement from complete deprovisioning to meet the business risk.",
"Common failures are movers that only receive access, contractors without lifecycle sources, reused identifiers, delayed HR events, partial connector coverage, sessions that remain active, and systems with local accounts outside identity-provider control.",
"For a leaver issue, I follow the termination event through HR, correlation, lifecycle workflow, disable operation, connector execution, target state, and session or token revocation. I compare timestamps and operation identifiers at each boundary.",
"I anchor lifecycle decisions to authoritative events. Joiners need timely, least-privilege access; movers require symmetric additions and removals; and leavers require immediate disablement followed by complete target cleanup, measured against defined service levels.",
"How do you prevent mover privilege creep? What lifecycle differences apply to contractors and service accounts? How do you prove a leaver has lost access everywhere?"
]],
[`6. Identity source of truth and authoritative sources`, [
"An authoritative source is the system responsible for a particular identity attribute or life-cycle state. A source-of-truth model is usually defined per attribute rather than as one system that owns every piece of identity information.",
"Incorrect or delayed source data directly affects role assignment and lifecycle decisions. Attribute ownership also prevents target applications from becoming informal masters that overwrite trusted identity information.",
"The platform aggregates attributes from designated sources, applies approved precedence when systems conflict, correlates accounts, and publishes a managed identity record. Provisioning and policy consume that record, not untrusted values entered directly by applications.",
"HR and people systems → attribute sources → identity platform with precedence and correlation → managed identity record → roles, provisioning, and application consumption.",
"I document the owner and data quality requirements for each attribute. I use a stable immutable identifier for correlation, define conflict precedence, and require non-authoritative systems to consume managed values unless a governed write-back is required.",
"Risks include mutable identifiers such as email addresses, two systems claiming the same attribute, missing business approval, delayed feeds, and informal write-back that bypasses ownership and precedence rules.",
"When a target value is incorrect, I trace it to the managed identity and then to the authoritative source. I correct the source or mapping, allow synchronization to update the target, and verify that the correction persists through reconciliation.",
"I do not treat source of truth as a single master system. For example, HR commonly owns employment and start state, while a directory may own technical memberships. The critical control is clearly defined ownership and immutable correlation for each identity.",
"What makes an identifier suitable for correlation? How do you resolve conflicting source values? Which system owns contractor and service-account lifecycle data?"
]],
[`7. HR-driven identity provisioning`, [
"HR-driven provisioning uses authoritative employment data to create and modify identities automatically. Changes such as hiring, transfer, leave, or termination can trigger the IAM platform without a manual service request.",
"It improves scale and consistency, because workforce events are delivered to the system that evaluates lifecycle policy and fulfils access. It also reduces delays caused by incomplete or late ticket-based offboarding.",
"HR publishes an event or the IAM platform reads HR data, creates or correlates the identity, maps validated attributes, evaluates birthright roles, and provisions access through connectors. Scheduled reconciliation detects records missed by the event stream.",
"HR system → event or scheduled aggregation → identity platform → lifecycle and birthright policy → provisioning connectors → target systems → reconciliation.",
"I map only the HR attributes needed for identity and access decisions, agree on their meaning, and test pre-hire, future-dated, leave, return, transfer, termination, and rehire cases. I also run reconciliation as a completeness control.",
"Failures include dirty HR values, job-code changes without access mapping, delayed feed events, invalid start dates, leave-of-absence handling, service-account dependencies, and target connector or rate-limit errors.",
"If access is missing on an expected start date, I check whether HR generated the event, whether the identity platform processed it, whether the role resolved, and whether the connector fulfilled it. These are separate checkpoints with different logs.",
"I treat the HR system as the lifecycle trigger, not simply a user data dump. Clean ownership, stable identifiers, explicit business rules, connector monitoring, and reconciliation are what make HR-driven provisioning dependable.",
"How do you handle a delayed hire record? Which values drive birthright roles? How do you reconcile an event missed by the feed?"
]],
[`8. Identity correlation and account aggregation`, [
"Aggregation collects accounts and entitlements from target systems. Correlation links those accounts to managed identities using stable attributes. Together, these processes establish what access exists and who currently owns it.",
"Governance depends on a reliable inventory. Without accurate correlation, certifications can show access for the wrong person and orphaned accounts can remain outside remediation and ownership.",
"The platform authenticates to each target, reads account and entitlement data, normalizes it, and applies correlation rules in a defined order. Strong matches are linked, weak or ambiguous matches enter review, and accounts with no owner are classified for investigation.",
"Target systems → aggregation → normalized accounts and entitlements → correlation rules → linked identity, review queue, or orphan classification.",
"I correlate primarily on a stable unique identifier and use lower-confidence attributes only as ordered fallback rules. I exclude weak values such as display name from automatic matching and require manual review for ambiguity or conflicting matches.",
"Risk areas include mutable or duplicated identifiers, overly permissive fuzzy matching, missing service-account ownership, stale aggregation, connector pagination errors, and schema changes at the target.",
"For an uncorrelated account, I compare the target identifier, mail value, source identifiers, ownership data, and recent lifecycle state. I determine whether there is a matching identity, a data-quality issue, or a true orphan before updating the rule.",
"Aggregation gives me the current account inventory, and correlation associates that inventory with identities. I prefer precise stable keys and explicit review over guessed matches, because incorrect correlation can place one person's access onto another identity.",
"Which attribute is authoritative, and how are conflicts handled? How do you match service and shared accounts? What becomes of accounts that cannot be correlated?"
]],
[`9. Entitlement management`, [
"An entitlement is a specific unit of access, such as a group membership, application role, permission, license, or resource assignment. Entitlement management discovers these units, adds business context, assigns ownership, and controls how they are requested and reviewed.",
"Raw entitlement names are often meaningless to managers. Clear descriptions, risk ratings, and owners allow approvers to understand what they are granting and whether the access is appropriate.",
"The platform aggregates entitlements from target systems, enriches them with metadata, groups related access into roles or access profiles, and presents approved catalog items through a request workflow. Fulfillment then creates the underlying target grants.",
"Target entitlement → aggregation → catalog metadata and ownership → role or profile → request and approval → provisioning → target state and audit evidence.",
"I prioritize high-risk and frequently requested entitlements, define plain-language descriptions, assign an accountable owner, set risk and approval policy, and consolidate common technical grants into understandable access profiles.",
"Problems include undocumented entitlements, orphan owners, certification fatigue, excessive direct grants, overlapping roles, role explosion, and metadata that is not maintained when a target changes.",
"When a certification decision lacks context, I review the entitlement description, owner, risk level, downstream grants, and recent changes. If target access is still unclear, I trace the entitlement to the resources and actions it controls before updating the review content.",
"Entitlement management translates technical permissions into governed business access. I give each high-risk entitlement an owner, description, and risk rating so request and review decisions are based on actual business need rather than an opaque group name.",
"How do you prevent role explosion? Who owns an entitlement? What makes certification information meaningful?"
]],
[`10. Role-Based Access Control (RBAC)`, [
"RBAC grants access through roles instead of assigning every entitlement directly to each user. A role represents a collection of permissions associated with a job function, organization, or technical responsibility.",
"RBAC simplifies assignment, provisioning, and review. However, poorly governed roles can multiply quickly and make it difficult to understand effective access or separate temporary exceptions from standard business needs.",
"HR or identity attributes assign a person to a business role. Policy maps that role to technical roles or access profiles, and fulfillment sends entitlements to target systems. The managed target state is then reconciled and reviewed.",
"Identity attributes → role assignment → technical access profiles → entitlements → target provisioning → review and reconciliation.",
"I use separate business and technical role layers. Business roles represent understandable job needs; technical roles contain platform-specific entitlements. I mine roles from actual patterns, apply ownership and approval, and review membership and role contents separately.",
"Common failures include creating a role for every exception, overlapping roles, unclear role ownership, stale technical entitlements, and direct grants that bypass the managed role model.",
"I determine whether the unexpected access came from role membership or a direct grant. For role access, I review the membership, role mapping, and entitlements. For a direct grant, I identify the bypass and bring the access into the governance process or remove it if it is no longer required.",
"RBAC reduces the number of assignments by managing collections of entitlements through roles. I keep business roles understandable, keep technical roles connected to targets, avoid exception-driven role creation, and combine RBAC with context-aware policy when needed.",
"How do you prevent role explosion? When does ABAC add value? How do you maintain roles as jobs and applications change?"
]],
[`11. Attribute-Based Access Control (ABAC)`, [
"ABAC evaluates authorization using attributes from the subject, resource, action, and environment. The policy engine evaluates these values at request time instead of relying only on a static role assignment.",
"It supports context-sensitive, fine-grained decisions that would otherwise require many roles. It is commonly used for classification restrictions, geographic or device policy, time-bound access, and resource ownership.",
"The policy enforcement point sends attributes and the requested action to a policy decision point. The policy engine matches trusted attributes against policy and returns allow or deny with context. The enforcement point applies the decision and records it.",
"Subject and resource attributes → policy enforcement point → policy decision point → allow or deny decision → enforcement and audit logs.",
"I use RBAC for stable coarse access and ABAC for dynamic conditions. Attributes come from trusted identity, device, resource, and environment services, and policy is version controlled, peer reviewed, and covered by positive, negative, and edge-case tests.",
"ABAC can fail when attributes are stale, missing, inconsistently sourced, or evaluated on different trust boundaries. Policy complexity and performance can also make decisions difficult to understand or reproduce.",
"I capture the exact attribute values received at decision time, the policy version, and the evaluation input. I compare those values with authoritative sources and inspect the specific rule that matched or failed before correcting the policy or attribute source.",
"ABAC gives me fine-grained control based on current context. The trade-off is operational complexity, so I combine it with RBAC, protect attribute quality, and ensure decisions remain explainable, testable, and auditable.",
"How do you prove who can access a resource under dynamic policy? How fresh must policy attributes be? How do you test and version authorization policy?"
]],
[`12. Segregation of Duties (SoD)`, [
"Segregation of Duties prevents one person from holding a combination of access that could enable fraud or a serious processing error. The control is based on conflicting sets of entitlements, not one entitlement alone.",
"SoD supports financial and operational integrity and is frequently assessed under SOX and internal control frameworks. Preventive checks stop risky combinations, while detective reviews identify violations already present.",
"The organization defines conflicting roles or entitlements. At request time, policy checks the proposed combined access and blocks or routes it for additional approval. Certification and recurring scans identify existing conflicts and exceptions.",
"Rule and risk owner → request-time SoD check → violation handling or approval → periodic scan and certification → remediation or documented mitigation.",
"I work with process owners and compliance to define rules and business impact. I enforce clear conflicts at request time, perform recurring detective scans, and manage approved exceptions with an owner, conditions, expiry, and evidence of monitoring.",
"Poorly defined rules create missed conflicts or alert fatigue. Violations can also enter through direct grants, emergency access, role inheritance, or permanent mitigating controls that are never reviewed.",
"I determine whether access was added outside the request workflow, whether role inheritance introduced the conflict, and whether the rule covers the actual entitlement combination. I then remediate the access or apply a formally approved and monitored exception.",
"SoD is not about banning individual permissions. I prevent or review toxic combinations, and when a business exception is unavoidable, I document compensating controls, assign an owner and expiry, and verify that the control operates.",
"When should SoD run preventively rather than detectively? How are unavoidable conflicts controlled? How do you keep SoD rules accurate?"
]],
[`13. Least privilege and Zero Trust`, [
"Least privilege means granting an identity only the permissions and access duration required for its approved task. Zero Trust requires explicit verification and removes network location as an implicit trust boundary.",
"These principles limit the impact of compromised accounts and reduce privilege accumulation. They also require architecture and operations to enforce access at each relevant transaction or session.",
"Access is based on strong identity, device and context signals, resource sensitivity, and policy. Just-in-time elevation replaces standing privilege where possible, and time-bound grants and regular certification remove access that is no longer required.",
"Identity and device verification → contextual policy → resource enforcement point → least-privilege session or token → activity logging and continuous monitoring.",
"I reduce standing privileged roles, implement approval-gated elevation, restrict grants by resource and time, improve role quality, and add MFA and device-based policy. For sensitive systems, I test enforcement and monitor access continuously.",
"Problems include privilege creep, roles that are too broad, unmanaged standing accounts, overly complex conditional policies, and Zero Trust programs that only add MFA while leaving implicit network trust elsewhere.",
"I trace how the excess access was assigned, whether through a role, direct grant, stale membership, exception, or standing privilege. I compare the required operation with effective permissions and remove or time-box the access through the owning workflow.",
"Least privilege controls the amount of access, while Zero Trust controls whether every request is trusted and verified. I implement both through just-in-time elevation, short-lived access, contextual authorization, segmentation, and complete activity evidence.",
"Which signals determine a Zero Trust decision? How do you measure least privilege? How do you migrate a standing privileged role to just-in-time access?"
]],
[`14. Identity federation`, [
"Identity federation allows one identity provider to authenticate users and securely establish a trusted identity or session at another organization or application. It provides centralized authentication across trust boundaries.",
"Federation reduces duplicate accounts and passwords, applies consistent MFA, and gives the identity provider centralized lifecycle control. It is commonly used for SaaS, partner access, and multi-domain organizations.",
"The user signs in at the home IdP. The IdP returns a signed SAML assertion or OIDC token containing identity and policy claims. The service provider validates trust, signature, issuer, audience, and timing before creating its session.",
"Browser or application → service provider → home identity provider → authentication and MFA → signed assertion or token → service-provider validation → local session.",
"I define entity IDs or client IDs, exact endpoints, certificates, attributes or claims, and redirect URLs. I minimize released attributes, use secure signing, validate clock and lifetime constraints, and automate and test certificate rotation.",
"Typical issues include expired certificates, entity ID or audience mismatches, incorrect ACS URLs, clock skew, attribute gaps, metadata errors, and trust-policy changes that are not synchronized on both sides.",
"I capture the assertion or token and compare Issuer, Audience, Recipient, Destination, signature, response IDs, and timestamps with the service-provider configuration. I use the first mismatch and the adjacent IdP log entry to locate the root cause.",
"Federation lets a trusted IdP authenticate the user while the service provider independently validates the signed result and creates an appropriate session. Certificate lifecycle and exact trust configuration are operational controls, not small configuration details.",
"When do you choose SAML versus OIDC? What is validated in a federation response? How do you rotate certificates without an outage?"
]],
[`15. Hybrid IAM architecture`, [
"Hybrid IAM is the coexistence of on-premises identity services and cloud identity platforms. Active Directory, legacy applications, cloud directories, SaaS, and cloud IdPs must operate from consistent identity and lifecycle state.",
"Organizations often migrate gradually, while legacy applications remain operational for years. Hybrid architecture must therefore avoid creating separate lifecycle and policy decisions in each environment.",
"An on-prem directory is synchronized to the cloud according to defined scope and authority. Authentication may use password hash synchronization, pass-through authentication, federation, or a combination by application. IGA applies policy across both planes.",
"On-prem AD and apps ↔ synchronization and authentication services ↔ cloud IdP and SaaS ↔ IGA governance and lifecycle policy.",
"I choose the authentication method based on security and availability requirements, deploy redundant synchronization components, define authoritative direction for each attribute, and ensure lifecycle actions reach both environments with reconciliation.",
"Common failures are sync-agent availability, identity collisions, split authority, replication delay, incorrect filters, cloud-only accounts after a leaver event, and authentication paths that depend on an unavailable on-prem service.",
"For inconsistent on-prem and cloud state, I verify the authoritative source, synchronization scope, agent health, object mapping, replication, authentication method, and timestamp of the change. I trace the difference to the first plane that did not receive the state change.",
"A hybrid environment needs one governed identity lifecycle, even when the services exist on different platforms. I keep source and write-back authority clear, use resilient synchronization, and measure whether an employee is disabled in every relevant plane.",
"How do you choose password hash sync, pass-through authentication, and federation? What components require redundancy? How do you prove lifecycle consistency across both planes?"
]],
[`16. High availability, disaster recovery and scalability`, [
"High availability keeps IAM working when individual components fail. Disaster recovery restores service after a broader site or region event. Scalability maintains response time and capacity as user and workload demand changes.",
"IAM availability is critical because authentication and access decisions can affect every application. Recovery objectives, monitoring, and tested failover are therefore part of the IAM architecture rather than an operational afterthought.",
"Redundant IAM nodes sit behind load balancers, directories and state stores are replicated, and health checks remove unhealthy components. Disaster recovery uses an active, standby, or secondary site with data replication, automation, and tested recovery procedures.",
"Users → load balancer → redundant IAM nodes → replicated directories and databases → secondary region or site; monitoring covers each component.",
"I define RTO and RPO, deploy redundant nodes and directory replicas, configure safe session and policy-state handling, plan capacity for peak events, and test failover and restoration regularly. DNS, certificates, network dependencies, and signing keys must be included.",
"Risks include a single directory, database, signing-key service, load balancer, or synchronization component; untested DR; replication lag; expired certificates; capacity exhaustion; and session behavior that breaks during failover.",
"I separate availability symptoms from authentication failures. I check load-balancer health, node saturation, connection pools, directory latency, replication status, certificate validity, signing-key availability, and recent infrastructure changes before assigning root cause.",
"I treat IAM as business-critical infrastructure. The architecture uses redundancy and tested recovery, while operational metrics and failover exercises show whether the service actually meets its RTO, RPO, and authentication capacity requirements.",
"What availability and recovery targets are appropriate? How do you test failover without disrupting users? Which components limit IAM capacity?"
]],
[`17. Identity governance and access certifications`, [
"Access certification is the periodic review of existing user access by managers, application owners, or entitlement owners. Reviewers confirm that access remains appropriate and approve remediation for access that should be removed.",
"Certification provides detective evidence of access control and reverses drift from direct grants, role changes, and exceptions. Large or poorly described campaigns can become routine approval activity, so reviewer context and risk-based scope are essential.",
"The IGA platform selects accounts and entitlements, assigns them to accountable reviewers, captures decisions, fulfils approved revocations, and retains evidence of the campaign and completion status.",
"Campaign scope → identity and entitlement data → reviewer assignment → approve or revoke decision → provisioning and remediation → target state and audit evidence.",
"I describe entitlements in business language, assign application and entitlement owners, risk-rank campaigns, prioritize recent changes and sensitive access, define no-response handling, and monitor completed revocations rather than decisions alone.",
"Problems include excessive campaign size, missing context, unclear ownership, stale entitlement data, review deadlines that are not enforced, failed connectors, direct grants, and revocations that are recorded but never fulfilled.",
"If revocation did not reach the target, I inspect campaign decision data, provisioning requests, connector execution, target state, retry or manual work queues, and reconciliation. A completed review has no security value until the approved change is fulfilled.",
"Certification works when reviewers understand the access and the organization verifies the result. I use risk-based scope, clear entitlement descriptions, accountable owners, and reconciliation so reviewed changes actually reach each target.",
"How do you reduce rubber-stamping? Which access should be certified most frequently? How is a missed reviewer decision handled?"
]],
[`18. Service accounts and non-human identities`, [
"Non-human identities include service accounts, API credentials, application keys, certificates, tokens, workload identities, and machine identities. These identities perform actions without an interactive user.",
"Non-human identities often have broad access and long-lived credentials, yet they can be harder to discover than user accounts. A compromised service identity can therefore provide durable and poorly monitored access.",
"Each non-human identity should have a named owner, purpose, source application, permitted actions, lifecycle, credential type, and monitoring method. Credentials can be stored and rotated in a vault or replaced with short-lived workload identity.",
"Application or workload → managed identity or vault credential → API or target authentication → authorization scope → activity logs and secret-lifecycle monitoring.",
"I inventory identities, assign owners and business justification, reduce permissions, record consumers and dependencies, automate rotation for shared credentials, and prefer managed workload identity or credential providers where supported.",
"Risk includes credentials in source code or configuration, undocumented consumers, shared passwords, missing owners, excessive privileges, stale certificates, and rotation that breaks a runtime dependency.",
"When rotation fails, I identify every consumer and configuration location, verify which credential or token is cached, compare the credential version in the vault with the target's active secret, and use controlled rollback or staged rotation to restore service.",
"I manage non-human identities as governed identities, not as unmanaged technical prerequisites. They need owners, least privilege, lifecycle controls, credential rotation or federation, inventory, monitoring, and periodic review.",
"How do you discover orphaned service identities? How do you rotate credentials used by many consumers? When should workload identity replace a static secret?"
]],
[`19. Identity reconciliation and orphan accounts`, [
"Reconciliation compares the identity or access state expected by IAM with the actual state in each target. It identifies missing, extra, modified, and orphaned accounts and entitlements.",
"Provisioning messages can fail, administrators can make changes outside IAM, and event feeds can miss transitions. Reconciliation is the control that detects these differences and provides evidence about target completeness.",
"The platform aggregates actual target state, normalizes relevant attributes, compares them with managed identity and entitlement records, classifies differences, creates remediation actions, and measures whether corrections reached the target.",
"Target aggregation → normalized actual state → expected IAM state → classification of orphan, rogue, missing, or drift → review, remediation, and audit evidence.",
"I reconcile frequently enough for the environment's risk, route clear rules to approved remediation, require review for ambiguous service or legacy accounts, and feed results into certification and leaver-completeness metrics.",
"Risks include overly aggressive remediation, stale expected state, connector omissions, local account creation, shared accounts without classification, and reconciliation that does not verify provisioning results.",
"I compare the account, entitlement, owner, source record, last change, and target creation method. If an orphan repeatedly returns, I find the out-of-band process or schedule creating it and update the integration or remediation policy.",
"Reconciliation confirms that IAM reflects actual access. It detects orphan accounts, unauthorized changes, failed provisioning, and deprovisioning gaps; the result is only complete when the remediation and target state are verified.",
"How frequently should reconciliation run? How do you classify an orphan that may belong to a service? How does reconciliation prove complete deprovisioning?"
]],
[`20. IAM audit, compliance and reporting`, [
"IAM audit and reporting provide evidence that identity controls operate, access is reviewed, privileged activity is monitored, lifecycle actions are completed, and required remediation is finished.",
"Audit evidence supports SOX, ISO 27001, SOC 2, HIPAA, and other control frameworks. Reliable data is also needed for incident response, operational ownership, and management risk reporting.",
"IAM systems log requests, approvals, policy decisions, provisioning operations, certifications, authentication, and privileged sessions. A central store retains and correlates these events, while reports and attestations demonstrate control activity.",
"IAM actions → structured logs with correlation identifiers → central log store and SIEM → reports, attestations, metrics, and retained evidence.",
"I define required events and correlation fields at design time, protect log integrity and retention, integrate all critical systems, validate log completeness, and automate standard reports for access, certifications, privileged activity, and lifecycle timeliness.",
"Control evidence can be incomplete when an integrated system bypasses IAM, actions lack correlation identifiers, log retention is too short, access records have no approver, or reports require manual assembly.",
"I identify the missing control boundary, trace a sample transaction end to end, inspect logs and target state, and verify whether the action bypassed the governed workflow. I then add the integration, log mapping, or reconciliation needed for complete evidence.",
"Auditability is built into IAM from the beginning. I record meaningful actions with trustworthy timestamps and identifiers, protect the evidence, and can show who had access, why it was granted, who approved it, and whether it was removed on time.",
"Which evidence proves effective access reviews and leaver controls? How do you preserve log integrity? Can the organization produce a complete access history quickly?"
]]
];

let result = source;
const start = result.indexOf("## 1. What is IAM and why an enterprise needs it");
const end = result.indexOf("# protocol", start);
if (start < 0 || end < 0) throw new Error("Could not locate topic range 1-20");
const rewritten = topics.map(([title, sections]) => {
  const lines = [`## ${title}`, ""];
  sections.forEach((text, index) => lines.push(`${index + 1}. ${text}`, ""));
  return lines.join("\n").trimEnd();
}).join("\n\n");
result = result.slice(0, start) + rewritten + "\n\n" + result.slice(end);
fs.writeFileSync(sourcePath, result);

const embedded = Buffer.from(result, "utf8").toString("base64");
const chunks = embedded.match(/.{1,120}/g).join("\n");
fs.writeFileSync(dataPath, `// Auto-generated from IAM_Engineer_Interview_Master_Playbook(1).md\n// Embedded copy for offline browser use.\nwindow.PLAYBOOK_MARKDOWN = (function () {\n  var b64 = ${JSON.stringify(chunks)};\n  return decodeURIComponent(Array.prototype.map.call(atob(b64.replace(/\\s/g, "")), function (byte) {\n    return '%' + ('00' + byte.charCodeAt(0).toString(16)).slice(-2);\n  }).join(''));\n})();\n`);
console.log(`Rewrote topics 1-${topics.length}; source topics: ${(result.match(/^## \d+\./gm)||[]).length}`);
