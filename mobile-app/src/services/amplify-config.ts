/**
 * AWS Amplify Configuration for Mobile App
 * ==============================================
 * Initialize Amplify with Cognito settings.
 * Import this in the root _layout.tsx before any auth calls.
 * ==============================================
 */

import { Amplify } from 'aws-amplify';

const amplifyConfig = {
    Auth: {
        Cognito: {
            userPoolId: 'ap-south-1_jZV6770zJ',
            userPoolClientId: '42vpa5vousikig0c4ohq2vmkge',
            identityPoolId: 'ap-south-1:5dd67b93-9e3c-4de3-a74f-2df439437bbd',
            loginWith: {
                email: true,
            },
            signUpVerificationMethod: 'code' as const,
            userAttributes: {
                email: { required: true },
                name: { required: false },
            },
            passwordFormat: {
                minLength: 8,
            },
        },
    },
};

export function configureAmplify() {
    Amplify.configure(amplifyConfig);
}

export default amplifyConfig;
