'use strict';
// Offline contract specification: server-only authority, persistent storage required in deployment.
// Deliberately no executable production authorization or database implementation.
const CONTRACT=Object.freeze({
 rolesAllowedToApprove:['principal','general'],
 serverIdentityRequired:true,
 persistentApprovalRequired:true,
 idempotencyScope:'authenticated-actor-and-operation-id',
 atomicity:'approval-and-idempotency-in-one-database-transaction',
 revocation:'persisted-revoked-state',
 contextBinding:['configurationRevision','destinationId','cartProductsAndQuantities','productDeliveryRules','associatedOriginIds'],
 expiry:'server-clock-validated',
 payment:'direct-to-courier',
 operationalStatus:'PENDIENTE_UNTIL_SERVER_VERIFIED'
});
module.exports={CONTRACT};
