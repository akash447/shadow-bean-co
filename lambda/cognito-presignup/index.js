/**
 * Shadow Bean Co - Cognito Pre-Signup Trigger
 * Auto-confirms users and auto-verifies email to bypass
 * unreliable Cognito default email verification.
 */
exports.handler = async (event) => {
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;
    return event;
};
