import { marked } from 'marked';

export interface EmailConfig {
    to: string; // Single email address (will be converted to array for API)
    subject: string;
    from?: string;
    reply?: string;
    name?: string;
    subscribed?: boolean;
    apiToken: string;
    backlinkUrlBase?: string;
    style?: string;
}

export interface FrontmatterData {
    title?: string;
    description?: string;
    author?: string;
    date?: string;
    tags?: string[];
    campaignId?: string;
    [key: string]: any;
}

export interface EmailResult {
    success: boolean;
    message: string;
    data?: any;
}

export interface CampaignConfig {
    name: string;
    subject: string;
    body: string;
    apiToken: string;
    subscribedOnly?: boolean;
    style?: string;
    selectedClients?: string[];
    backlinkUrlBase?: string;
}

export interface UpdateCampaignConfig {
    id: string;
    subject: string;
    body: string;
    apiToken: string;
    recipients: string[];
    style?: string;
    subscribedOnly?: boolean;
    selectedClients?: string[];
    backlinkUrlBase?: string;
}

export interface CampaignResult {
    success: boolean;
    message: string;
    campaignId?: string;
    data?: any;
}

export interface Contact {
    id: string;
    subscribed?: boolean;
    [key: string]: any;
}

export class EmailService {
    private readonly PLUNK_API_URL = 'https://api.useplunk.com/v1/send';
    private readonly PLUNK_CAMPAIGN_URL = 'https://api.useplunk.com/v1/campaigns';

    constructor() {
        // Configure marked options for better HTML output
        marked.setOptions({
            gfm: true, // GitHub Flavored Markdown
            breaks: true, // Convert line breaks to <br>
        });
    }

    /**
     * Extract frontmatter from markdown content
     */
    extractFrontmatter(content: string): { frontmatter: FrontmatterData | null; body: string } {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        
        if (!match) {
            return { frontmatter: null, body: content };
        }

        const frontmatterText = match[1];
        const body = match[2] || '';

        try {
            // Parse YAML-like frontmatter
            const frontmatter: FrontmatterData = {};
            const lines = frontmatterText?.split('\n') || [];
            
            for (const line of lines) {
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex).trim();
                    let value: any = line.substring(colonIndex + 1).trim();
                    
                    // Remove quotes if present
                    if ((value.startsWith('"') && value.endsWith('"')) || 
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }
                    
                    // Handle arrays (tags, etc.)
                    if (value.startsWith('[') && value.endsWith(']')) {
                        try {
                            // Try to parse as JSON first
                            value = JSON.parse(value);
                        } catch (error) {
                            // If JSON parsing fails, try to parse as YAML-style array
                            const arrayContent = value.slice(1, -1); // Remove [ and ]
                            if (arrayContent.trim()) {
                                value = arrayContent.split(',').map((item: string) => item.trim()) as any;
                            } else {
                                value = [] as any;
                            }
                        }
                    }
                    
                    // Handle boolean values
                    if (value === 'true') {
                        value = true;
                    } else if (value === 'false') {
                        value = false;
                    }
                    
                    frontmatter[key] = value;
                }
            }
            
            return { frontmatter, body };
        } catch (error) {
            console.error('Error parsing frontmatter:', error);
            return { frontmatter: null, body: content };
        }
    }

    /**
     * Convert Obsidian backlinks to URLs
     */
    private convertBacklinksToUrls(content: string, backlinkUrlBase?: string): string {
        if (!backlinkUrlBase) {
            return content;
        }

        // Regular expression to match Obsidian backlinks: [[text]] or [[text|display]]
        const backlinkRegex = /\[\[([^\]]+)\]\]/g;
        
        return content.replace(backlinkRegex, (match, linkContent) => {
            // Split by | to handle display text
            const [link, display] = linkContent.split('|');
            const displayText = display || link;
            
            // Encode the backlink for URL
            const encodedLink = encodeURIComponent(match);
            
            // Construct the URL
            const url = `${backlinkUrlBase}/backlink?query=${encodedLink}`;
            
            // Return as markdown link
            return `[${displayText}](${url})`;
        });
    }

    /**
     * Convert markdown to HTML
     */
    private markdownToHtml(markdown: string, backlinkUrlBase?: string): string {
        try {
            // First convert backlinks to URLs
            const processedMarkdown = this.convertBacklinksToUrls(markdown, backlinkUrlBase);
            
            // Then convert to HTML
            return marked(processedMarkdown);
        } catch (error) {
            console.error('Error converting markdown to HTML:', error);
            return markdown;
        }
    }

    /**
     * Send email using Plunk API
     */
    async sendEmail(content: string, config: EmailConfig): Promise<EmailResult> {
        try {
            // Extract frontmatter and body
            const { frontmatter, body } = this.extractFrontmatter(content);
            
            // Convert markdown body to HTML
            const htmlBody = this.markdownToHtml(body, config.backlinkUrlBase);
            
            // Prepare email data - Plunk API expects 'to' as an array
            const emailData = {
                to: [config.to], // Convert to array as required by Plunk API
                subject: config.subject,
                body: htmlBody,
                subscribed: config.subscribed ?? true,
                name: config.name || frontmatter?.author || 'Newsletter',
                style: config.style || 'SANS'
            };

            console.log(emailData);

            // Make API request - exactly as specified
            const response = await fetch(this.PLUNK_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiToken}`
                },
                body: JSON.stringify(emailData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                message: 'Email sent successfully!',
                data
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Email sending error:', error);
            
            return {
                success: false,
                message: `Failed to send email: ${errorMessage}`
            };
        }
    }

    /**
     * Get all contacts from Plunk API
     */
    async getAllContacts(apiToken: string, subscribedOnly: boolean = false, selectedClients?: string[]): Promise<string[]> {
        try {
            const response = await fetch('https://api.useplunk.com/v1/contacts', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiToken}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to fetch contacts: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
            }

            const data = await response.json();
            
            // Extract contact emails from the response
            console.log("Received contacts", data);
            
            // Filter contacts based on subscribed status if requested
            let contacts: Contact[] = data;
            if (subscribedOnly) {
                contacts = data.filter((contact: Contact) => contact.subscribed === true);
                console.log(`Filtered to ${contacts.length} subscribed contacts out of ${data.length} total`);
            }

            // Filter contacts based on selected clients if specified
            if (selectedClients && selectedClients.length > 0 && !selectedClients.includes('all')) {
                contacts = contacts.filter((contact: Contact) => {
                    try {
                        const contactData = contact.data ? JSON.parse(contact.data) : {};
                        return selectedClients.includes(contactData.client);
                    } catch (error) {
                        console.error('Error parsing contact data:', error);
                        return false;
                    }
                });
                console.log(`Filtered to ${contacts.length} contacts for clients: ${selectedClients.join(', ')}`);
            }

            return contacts.map((contact: Contact) => contact.id).filter(Boolean);
        } catch (error) {
            console.error('Error fetching contacts:', error);
            throw error;
        }
    }

    /**
     * Get unique client names from contacts
     */
    async getUniqueClients(apiToken: string): Promise<string[]> {
        try {
            const response = await fetch('https://api.useplunk.com/v1/contacts', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiToken}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to fetch contacts: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
            }

            const data = await response.json();
            
            // Extract unique client names
            const clients = new Set<string>();
            data.forEach((contact: Contact) => {
                console.log("Contact", contact);
                try {
                    const contactData = contact.data ? JSON.parse(contact.data) : {};
                    if (contactData.client) {
                        clients.add(contactData.client);
                    }
                } catch (error) {
                    console.error('Error parsing contact data:', error);
                }
            });

            return Array.from(clients).sort();
        } catch (error) {
            console.error('Error fetching clients:', error);
            throw error;
        }
    }

    /**
     * Create a campaign using Plunk API
     */
    async createCampaign(content: string, config: CampaignConfig): Promise<CampaignResult> {
        try {
            // Extract frontmatter and body
            const { body } = this.extractFrontmatter(content);
            
            // Convert markdown body to HTML
            const htmlBody = this.markdownToHtml(body, config.backlinkUrlBase);
            
            // Get all contacts
            const recipients = await this.getAllContacts(config.apiToken, config.subscribedOnly, config.selectedClients);
            
            if (recipients.length === 0) {
                return {
                    success: false,
                    message: 'No contacts found. Please add some contacts to your Plunk account first.'
                };
            }

            // Prepare campaign data according to Plunk API specification
            const campaignData = {
                subject: config.subject,
                body: htmlBody,
                recipients: recipients,
                style: config.style || 'SANS'
            };

            console.log('Creating campaign with data:', {
                campaignData
            });

            // Make API request to create campaign
            const response = await fetch(this.PLUNK_CAMPAIGN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiToken}`
                },
                body: JSON.stringify(campaignData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Campaign creation failed: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
            }

            const data = await response.json();
            
            let filterText = '';
            if (config.subscribedOnly) {
                filterText += 'subscribed ';
            }
            if (config.selectedClients && config.selectedClients.length > 0 && !config.selectedClients.includes('all')) {
                filterText += `from clients: ${config.selectedClients.join(', ')} `;
            }
            
            return {
                success: true,
                message: `Campaign created successfully! Will be sent to ${recipients.length} ${filterText}contacts.`,
                campaignId: data.id || data.campaign_id,
                data
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Campaign creation error:', error);
            
            return {
                success: false,
                message: `Failed to create campaign: ${errorMessage}`
            };
        }
    }

    /**
     * Update an existing campaign using Plunk API
     */
    async updateCampaign(content: string, config: UpdateCampaignConfig): Promise<CampaignResult> {
        try {
            // Extract frontmatter and body
            const { body } = this.extractFrontmatter(content);
            
            // Convert markdown body to HTML
            const htmlBody = this.markdownToHtml(body, config.backlinkUrlBase);
            
            // Prepare campaign update data according to Plunk API specification
            const campaignData = {
                id: config.id,
                subject: config.subject,
                body: htmlBody,
                recipients: config.recipients,
                style: config.style || 'SANS'
            };

            console.log('Updating campaign with data:', {
                campaignData
            });

            // Make API request to update campaign
            const response = await fetch(this.PLUNK_CAMPAIGN_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiToken}`
                },
                body: JSON.stringify(campaignData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Campaign update failed: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
            }

            const data = await response.json();
            
            let filterText = '';
            if (config.subscribedOnly) {
                filterText += 'subscribed ';
            }
            if (config.selectedClients && config.selectedClients.length > 0 && !config.selectedClients.includes('all')) {
                filterText += `from clients: ${config.selectedClients.join(', ')} `;
            }
            
            return {
                success: true,
                message: `Campaign updated successfully! Will be sent to ${config.recipients.length} ${filterText}contacts.`,
                campaignId: config.id,
                data
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Campaign update error:', error);
            
            return {
                success: false,
                message: `Failed to update campaign: ${errorMessage}`
            };
        }
    }

    /**
     * Send an existing campaign using Plunk API
     */
    async sendCampaign(content: string, apiToken: string): Promise<CampaignResult> {
        try {
            // Extract frontmatter to get campaign ID
            const { frontmatter } = this.extractFrontmatter(content);
            
            if (!frontmatter?.campaignId) {
                return {
                    success: false,
                    message: 'No campaign ID found in frontmatter. Please create a campaign first.'
                };
            }

            const campaignId = frontmatter.campaignId;
            console.log('Sending campaign with ID:', campaignId);

            // Prepare campaign send data
            const sendData = {
                id: campaignId,
                live: true,
                delay: 0 // Send immediately
            };

            // Make API request to send campaign
            const response = await fetch('https://api.useplunk.com/v1/campaigns/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiToken}`
                },
                body: JSON.stringify(sendData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Campaign sending failed: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                message: 'Campaign sent successfully!',
                campaignId: campaignId,
                data
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Campaign sending error:', error);
            
            return {
                success: false,
                message: `Failed to send campaign: ${errorMessage}`
            };
        }
    }

    /**
     * Update frontmatter with campaign ID
     */
    updateFrontmatterWithCampaignId(content: string, campaignId: string): string {
        const { frontmatter, body } = this.extractFrontmatter(content);
        
        // Update or add campaignId to frontmatter
        const updatedFrontmatter = {
            ...(frontmatter || {}),
            campaignId: campaignId
        };
        
        // Preserve existing frontmatter data
        console.log('Updating frontmatter with campaign ID:', campaignId);
        
        // Convert frontmatter back to YAML string
        const frontmatterLines = Object.entries(updatedFrontmatter).map(([key, value]) => {
            if (Array.isArray(value)) {
                return `${key}: ${JSON.stringify(value)}`;
            }
            return `${key}: ${value}`;
        });
        
        const frontmatterString = frontmatterLines.join('\n');
        
        // Reconstruct the content with updated frontmatter
        return `---\n${frontmatterString}\n---\n\n${body}`;
    }

    /**
     * Update frontmatter with selected clients
     */
    updateFrontmatterWithSelectedClients(content: string, selectedClients: string[]): string {
        const { frontmatter, body } = this.extractFrontmatter(content);
        
        // Create updated frontmatter, ensuring selectedClients overwrites any existing value
        const updatedFrontmatter = {
            ...(frontmatter || {}),
            selectedClients: selectedClients
        };
        
        // Remove any old selectedClient property if it exists
        if ('selectedClient' in updatedFrontmatter) {
            delete (updatedFrontmatter as any).selectedClient;
        }
        
        // Convert frontmatter back to YAML string
        const frontmatterLines = Object.entries(updatedFrontmatter).map(([key, value]) => {
            if (Array.isArray(value)) {
                return `${key}: ${JSON.stringify(value)}`;
            }
            return `${key}: ${value}`;
        });
        
        const frontmatterString = frontmatterLines.join('\n');
        
        // Reconstruct the content with updated frontmatter
        return `---\n${frontmatterString}\n---\n\n${body}`;
    }

    /**
     * Update frontmatter with multiple properties
     */
    updateFrontmatterWithProperties(content: string, properties: Record<string, any>): string {
        const { frontmatter, body } = this.extractFrontmatter(content);
        
        // Create updated frontmatter, merging with existing properties
        const updatedFrontmatter = {
            ...(frontmatter || {}),
            ...properties
        };
        
        // Remove any old selectedClient property if it exists and we're updating selectedClients
        if (properties.selectedClients && 'selectedClient' in updatedFrontmatter) {
            delete (updatedFrontmatter as any).selectedClient;
        }
        
        // Convert frontmatter back to YAML string
        const frontmatterLines = Object.entries(updatedFrontmatter).map(([key, value]) => {
            if (Array.isArray(value)) {
                return `${key}: ${JSON.stringify(value)}`;
            }
            if (typeof value === 'boolean') {
                return `${key}: ${value}`;
            }
            return `${key}: ${value}`;
        });
        
        const frontmatterString = frontmatterLines.join('\n');
        
        // Reconstruct the content with updated frontmatter
        return `---\n${frontmatterString}\n---\n\n${body}`;
    }

    /**
     * Get default subject from frontmatter or content
     */
    getDefaultSubject(content: string): string {
        const { frontmatter } = this.extractFrontmatter(content);
        
        if (frontmatter?.subject) {
            return frontmatter.subject;
        }
        
        // Extract first heading if no title in frontmatter
        const headingMatch = content.match(/^#\s+(.+)$/m);
        if (headingMatch && headingMatch[1]) {
            return headingMatch[1];
        }
        
        return 'Newsletter';
    }

    /**
     * Get default recipient from frontmatter
     */
    getDefaultRecipient(content: string): string {
        const { frontmatter } = this.extractFrontmatter(content);
        return frontmatter?.email || '';
    }


}
