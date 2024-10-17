import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { FileManagerError } from "./FileManagerErrors";

interface GoogleAPICredentials {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export const retrieveGoogleAPICredentials = (): GoogleAPICredentials => {
    const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI } = process.env;

    if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET || !GOOGLE_OAUTH_REDIRECT_URI) {
        throw new FileManagerError(500, `Missing Google OAuth credentials. 
Add the following secrets to your environment : 
* GOOGLE_OAUTH_CLIENT_ID 
* GOOGLE_OAUTH_CLIENT_SECRET 
* GOOGLE_OAUTH_REDIRECT_URI`);
    }

    return {
        clientId: GOOGLE_OAUTH_CLIENT_ID || "",
        clientSecret: GOOGLE_OAUTH_CLIENT_SECRET || "",
        redirectUri: GOOGLE_OAUTH_REDIRECT_URI || ""
    };
};

/**
 * Retrieves a user unique OAuth token to access it's Google Drive
 * @param userEmail
 */
export const getAuthToken = async (client: OAuth2Client, userEmail: string) => {
    const { clientId, clientSecret, redirectUri } = retrieveGoogleAPICredentials();
    const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    auth.setCredentials({ refresh_token: userEmail });
    const { token } = await auth.getAccessToken();

    if (!token) {
        throw new FileManagerError(500, "Failed to retrieve OAuth Access token to Google Drive");
    }

    return token;
};

/**
 * Returns an authenticated OAuth2Client instance to access the Google Drive
 * of the referenced user
 * @param userEmail The user's email
 * @param refreshToken The user's refresh token (null if not yet available)
 * @see https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest#a-complete-oauth2-example
 */
export const getOAuth2Client = async (userEmail: string, refreshToken: string | null): Promise<OAuth2Client> => {
    const { clientId, clientSecret, redirectUri } = retrieveGoogleAPICredentials();

    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    if (refreshToken) {
        // We already have a refresh token, so we can use it to get a new access token
        oAuth2Client.setCredentials({
            refresh_token: refreshToken,
        });
    } else {
        // We don't have a refresh token yet, so we need to get one
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: ["https://www.googleapis.com/auth/drive"],
            prompt: "consent",
        });

    }

    return oAuth2Client;
};