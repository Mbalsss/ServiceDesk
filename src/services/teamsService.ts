// services/teamsService.ts
import { supabase } from '../lib/supabase';

export interface TeamsIntegrationConfig {
  connected: boolean;
  accessToken?: string;
  refreshToken?: string;
  tenantId?: string;
  userId?: string;
  notificationSettings: {
    ticketCreation: boolean;
    statusUpdate: boolean;
    assignment: boolean;
  };
  copilotSettings: {
    autoSuggest: boolean;
    knowledgeBase: boolean;
    smartRouting: boolean;
  };
}

class TeamsService {
  private readonly clientId = import.meta.env.VITE_TEAMS_CLIENT_ID;
  private readonly clientSecret = import.meta.env.VITE_TEAMS_CLIENT_SECRET;
  private readonly teamsAppId = import.meta.env.VITE_TEAMS_APP_ID;
  private readonly redirectUri = `${window.location.origin}/teams/callback`;
  
  private readonly scopes = [
    'openid',
    'profile',
    'email',
    'User.Read',
    'Channel.ReadBasic.All',
    'ChannelMessage.Send',
    'TeamsActivity.Send',
    'offline_access'
  ].join(' ');

  // PKCE code verifier and challenge
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(hash));
  }

  private base64UrlEncode(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  async getConfig(userId: string): Promise<TeamsIntegrationConfig> {
    try {
      const { data, error } = await supabase
        .from('teams_integrations')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        return this.getDefaultConfig();
      }

      return {
        connected: data.connected || false,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tenantId: data.tenant_id,
        userId: data.teams_user_id,
        notificationSettings: data.notification_settings || {
          ticketCreation: true,
          statusUpdate: true,
          assignment: true,
        },
        copilotSettings: data.copilot_settings || {
          autoSuggest: true,
          knowledgeBase: true,
          smartRouting: false,
        },
      };
    } catch (error) {
      console.error('Error fetching Teams config:', error);
      return this.getDefaultConfig();
    }
  }

  async saveConfig(userId: string, config: TeamsIntegrationConfig): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teams_integrations')
        .upsert({
          user_id: userId,
          connected: config.connected,
          access_token: config.accessToken,
          refresh_token: config.refreshToken,
          tenant_id: config.tenantId,
          teams_user_id: config.userId,
          notification_settings: config.notificationSettings,
          copilot_settings: config.copilotSettings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      return !error;
    } catch (error) {
      console.error('Error saving Teams config:', error);
      return false;
    }
  }

  async connectToTeams(userId: string): Promise<boolean> {
    try {
      if (!this.clientId) {
        throw new Error('Teams Client ID is not configured');
      }

      console.log('🔄 Starting PKCE flow...');
      
      // Generate PKCE code verifier and challenge
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      
      console.log('🔐 Generated PKCE parameters:', {
        codeVerifier: codeVerifier.substring(0, 10) + '...',
        codeChallenge: codeChallenge.substring(0, 10) + '...'
      });

      // Store the code verifier and user ID in session storage
      sessionStorage.setItem('teams_auth_user', userId);
      sessionStorage.setItem('teams_code_verifier', codeVerifier);
      sessionStorage.setItem('teams_redirect_uri', this.redirectUri);
      
      const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
      authUrl.searchParams.append('client_id', this.clientId);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('redirect_uri', this.redirectUri);
      authUrl.searchParams.append('scope', this.scopes);
      authUrl.searchParams.append('state', this.generateStateParameter());
      authUrl.searchParams.append('code_challenge', codeChallenge);
      authUrl.searchParams.append('code_challenge_method', 'S256');
      authUrl.searchParams.append('prompt', 'consent');

      console.log('🔗 Redirecting to Microsoft with PKCE...');
      window.location.href = authUrl.toString();
      
      return true;
    } catch (error) {
      console.error('Error initiating Teams connection:', error);
      return false;
    }
  }

  async handleCallback(code: string): Promise<boolean> {
    try {
      console.log('🔄 Handling Teams callback with PKCE...');
      
      const userId = sessionStorage.getItem('teams_auth_user');
      const codeVerifier = sessionStorage.getItem('teams_code_verifier');
      
      console.log('📋 Retrieved from session storage:', {
        userId: userId ? '✓ Present' : '✗ Missing',
        codeVerifier: codeVerifier ? '✓ Present' : '✗ Missing'
      });

      if (!userId) {
        throw new Error('No user ID found in session storage');
      }

      if (!codeVerifier) {
        throw new Error('No code verifier found in session storage. PKCE flow may have been interrupted.');
      }

      console.log('🔄 Exchanging authorization code for tokens with PKCE...');
      const tokens = await this.exchangeCodeForTokens(code, codeVerifier);
      console.log('✅ Tokens received successfully');
      
      const userInfo = await this.getUserInfo(tokens.access_token);
      
      const config: TeamsIntegrationConfig = {
        connected: true,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tenantId: userInfo.tenantId,
        userId: userInfo.id,
        notificationSettings: {
          ticketCreation: true,
          statusUpdate: true,
          assignment: true,
        },
        copilotSettings: {
          autoSuggest: true,
          knowledgeBase: true,
          smartRouting: false,
        },
      };

      const success = await this.saveConfig(userId, config);
      
      // Clean up session storage
      sessionStorage.removeItem('teams_auth_user');
      sessionStorage.removeItem('teams_code_verifier');
      sessionStorage.removeItem('teams_redirect_uri');
      
      console.log('✅ Teams connection completed successfully with PKCE!');
      return success;
    } catch (error) {
      console.error('❌ Error handling Teams callback:', error);
      // Clean up on error too
      sessionStorage.removeItem('teams_auth_user');
      sessionStorage.removeItem('teams_code_verifier');
      sessionStorage.removeItem('teams_redirect_uri');
      throw error;
    }
  }

  async disconnectFromTeams(userId: string): Promise<boolean> {
    try {
      const config = await this.getConfig(userId);
      
      if (config.accessToken) {
        await this.revokeToken(config.accessToken);
      }

      const { error } = await supabase
        .from('teams_integrations')
        .delete()
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Error disconnecting from Teams:', error);
      return false;
    }
  }

  async openInTeams(): Promise<void> {
    if (!this.teamsAppId) {
      console.warn('Teams App ID is not configured');
      return;
    }
    
    const teamsUrl = `https://teams.microsoft.com/l/app/${this.teamsAppId}?source=app-details-dialog`;
    window.open(teamsUrl, '_blank');
  }

  async sendMessage(channelId: string, message: string): Promise<boolean> {
    try {
      const config = await this.getCurrentUserConfig();
      if (!config?.accessToken || !config.tenantId) {
        throw new Error('No access token or tenant ID available');
      }

      const response = await fetch(`https://graph.microsoft.com/v1.0/teams/${config.tenantId}/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: {
            content: message,
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending Teams message:', error);
      return false;
    }
  }

  private async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<{ access_token: string; refresh_token: string }> {
    console.log('🔄 Making token exchange request with PKCE...');
    
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        scope: this.scopes,
        code: code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier, // Use code_verifier instead of client_secret
        // Note: client_secret is not used with PKCE
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Token exchange failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to exchange code for tokens: ${response.status} - ${errorText}`);
    }

    const tokenData = await response.json();
    console.log('✅ Token exchange successful');
    return tokenData;
  }

  private async getUserInfo(accessToken: string): Promise<{ id: string; tenantId: string; email: string }> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const userData = await response.json();
    return {
      id: userData.id,
      tenantId: userData.officeLocation || userData.tenantId || userData.id,
      email: userData.mail || userData.userPrincipalName,
    };
  }

  private async revokeToken(token: string): Promise<void> {
    try {
      // With PKCE, we don't have a client secret, so we can't revoke tokens
      // The token will naturally expire
      console.log('Token revocation not supported with PKCE flow');
    } catch (error) {
      console.error('Error revoking token:', error);
    }
  }

  private async getCurrentUserConfig(): Promise<TeamsIntegrationConfig | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      return this.getConfig(user.id);
    } catch (error) {
      console.error('Error getting current user config:', error);
      return null;
    }
  }

  private generateStateParameter(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private getDefaultConfig(): TeamsIntegrationConfig {
    return {
      connected: false,
      notificationSettings: {
        ticketCreation: true,
        statusUpdate: true,
        assignment: true,
      },
      copilotSettings: {
        autoSuggest: true,
        knowledgeBase: true,
        smartRouting: false,
      },
    };
  }
}

export const teamsService = new TeamsService();