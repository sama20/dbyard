// src/services/copilot.ts

export const CopilotToken = async (githubToken: string): Promise<string | null> => {
    if (!githubToken) {
      throw new Error('GitHub token is required');
    }
  
    try {
      // This request now goes to our backend proxy
      const response = await fetch('http://localhost:3001/api/copilot_internal/token', {
        headers: {
          'Authorization': `token ${githubToken}`
        }
      });
  
      if (response.status === 401) {
        // The proxy will return 401 if the user doesn't have Copilot
        console.log('User does not have a Copilot subscription.');
        return null;
      }
  
      if (!response.ok) {
        throw new Error(`Failed to fetch Copilot token from proxy. Status: ${response.status}`);
      }
  
      const data = await response.json();
      return data.token;
  
    } catch (error) {
      console.error('Error fetching Copilot token:', error);
      throw error;
    }
  };
  