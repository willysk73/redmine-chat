import { v4 as uuidv4 } from 'uuid';

// --- Types ---

export interface RedmineUser {
  id: number;
  firstname: string;
  lastname: string;
  name?: string;
  mail?: string;
  api_key?: string;
}

export interface RedmineProject {
  id: number;
  name: string;
  identifier: string;
  description?: string;
  created_on: string;
  updated_on: string;
  trackers?: RedmineTracker[];
}

export interface RedminePriority {
  id: number;
  name: string;
}

export interface RedmineStatus {
  id: number;
  name: string;
  is_closed: boolean;
}

export interface RedmineTracker {
  id: number;
  name: string;
}

export interface RedmineJournal {
  id: number;
  user: RedmineUser;
  notes: string;
  created_on: string;
  details?: Array<{
    property: string;
    name: string;
    old_value?: string;
    new_value?: string;
  }>;
}

export interface RedmineIssue {
  id: number;
  project: { id: number; name: string };
  tracker: RedmineTracker;
  status: RedmineStatus;
  priority: RedminePriority;
  author: RedmineUser;
  assigned_to?: RedmineUser;
  category?: { id: number; name: string };
  subject: string;
  description: string;
  start_date?: string;
  due_date?: string;
  done_ratio: number;
  created_on: string;
  updated_on: string;
  journals?: RedmineJournal[]; // For chat history
}

// --- Mock Data ---

const MOCK_USERS: RedmineUser[] = [
  { id: 1, firstname: 'Admin', lastname: 'User' },
  { id: 2, firstname: 'John', lastname: 'Doe' },
  { id: 3, firstname: 'Jane', lastname: 'Smith' },
];

const MOCK_PROJECTS: RedmineProject[] = [
  { id: 1, name: 'Website Redesign', identifier: 'website-redesign', description: 'Overhaul of the corporate website.', created_on: new Date().toISOString(), updated_on: new Date().toISOString() },
  { id: 2, name: 'Mobile App', identifier: 'mobile-app', description: 'iOS and Android application development.', created_on: new Date().toISOString(), updated_on: new Date().toISOString() },
  { id: 3, name: 'Internal Tools', identifier: 'internal-tools', description: 'Maintenance of internal dashboards.', created_on: new Date().toISOString(), updated_on: new Date().toISOString() },
];

const MOCK_ISSUES: RedmineIssue[] = [
  {
    id: 101,
    project: { id: 1, name: 'Website Redesign' },
    tracker: { id: 1, name: 'Bug' },
    status: { id: 1, name: 'New', is_closed: false },
    priority: { id: 4, name: 'High' },
    author: MOCK_USERS[0],
    assigned_to: MOCK_USERS[1],
    subject: 'Homepage banner is misaligned',
    description: 'The main hero banner on the homepage is shifted 20px to the right on mobile screens.',
    done_ratio: 0,
    created_on: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_on: new Date().toISOString(),
    journals: [
      { id: 1, user: MOCK_USERS[1], notes: 'I can reproduce this. Looking into it.', created_on: new Date(Date.now() - 80000000).toISOString() },
      { id: 2, user: MOCK_USERS[0], notes: 'Great, let me know if you need design assets.', created_on: new Date(Date.now() - 70000000).toISOString() },
    ]
  },
  {
    id: 102,
    project: { id: 1, name: 'Website Redesign' },
    tracker: { id: 2, name: 'Feature' },
    status: { id: 2, name: 'In Progress', is_closed: false },
    priority: { id: 2, name: 'Normal' },
    author: MOCK_USERS[2],
    assigned_to: MOCK_USERS[2],
    subject: 'Implement Dark Mode',
    description: 'Add a toggle for dark mode support across all pages.',
    done_ratio: 30,
    created_on: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_on: new Date().toISOString(),
    journals: []
  },
  {
    id: 201,
    project: { id: 2, name: 'Mobile App' },
    tracker: { id: 1, name: 'Bug' },
    status: { id: 1, name: 'New', is_closed: false },
    priority: { id: 5, name: 'Immediate' },
    author: MOCK_USERS[1],
    subject: 'Crash on login',
    description: 'App crashes immediately when clicking the login button on Android 14.',
    done_ratio: 0,
    created_on: new Date().toISOString(),
    updated_on: new Date().toISOString(),
    journals: []
  }
];

// --- API Client Interface ---

export class RedmineClient {
  private baseUrl: string;
  private apiKey: string;
  private isMock: boolean;
  private userCache: Map<number, number[]> = new Map(); // projectId -> validUserIds

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.isMock = !baseUrl || baseUrl.includes('mock');
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Use local proxy to avoid CORS
    const proxyUrl = '/api/proxy';
    
    let data = null;
    if (options.body && typeof options.body === 'string') {
        try {
            data = JSON.parse(options.body);
        } catch (e) {
            console.error("Failed to parse body for proxy", e);
        }
    }

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: this.baseUrl,
        apiKey: this.apiKey,
        endpoint,
        method: options.method || 'GET',
        data
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Proxy Error: ${response.status}`);
    }

    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
  }

  async getProjects(): Promise<RedmineProject[]> {
    if (this.isMock) {
      await this.delay(500);
      return MOCK_PROJECTS;
    }
    
    try {
      const data = await this.fetch<{ projects: RedmineProject[] }>('/projects.json?limit=100');
      return data.projects;
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      throw error;
    }
  }

  async getProjectDetails(projectId: number): Promise<RedmineProject | null> {
      if (this.isMock) {
          await this.delay(200);
          return MOCK_PROJECTS.find(p => p.id === projectId) || null;
      }
      try {
          const data = await this.fetch<{ project: RedmineProject & { trackers: RedmineTracker[] } }>(`/projects/${projectId}.json?include=trackers`);
          return data.project;
      } catch (error) {
          console.error(`Failed to fetch project details for ${projectId}:`, error);
          return null;
      }
  }

  async getIssues(projectId?: number): Promise<RedmineIssue[]> {
    if (this.isMock) {
      await this.delay(600);
      if (projectId) {
        return MOCK_ISSUES.filter(i => i.project.id === projectId);
      }
      return MOCK_ISSUES;
    }

    try {
      const query = projectId ? `?project_id=${projectId}&limit=100&sort=updated_on:desc` : '?limit=100&sort=updated_on:desc';
      const data = await this.fetch<{ issues: RedmineIssue[] }>(`/issues.json${query}`);
      return data.issues;
    } catch (error) {
      console.error("Failed to fetch issues:", error);
      throw error;
    }
  }

  async getIssueDetails(issueId: number): Promise<RedmineIssue | null> {
    if (this.isMock) {
      await this.delay(400);
      return MOCK_ISSUES.find(i => i.id === issueId) || null;
    }

    try {
      const data = await this.fetch<{ issue: RedmineIssue }>(`/issues/${issueId}.json?include=journals`);
      return data.issue;
    } catch (error) {
      console.error(`Failed to fetch issue ${issueId}:`, error);
      return null;
    }
  }

  async getProjectDetailsFromServer(projectId: number): Promise<{ trackers: RedmineTracker[], users: RedmineUser[] }> {
      if (this.isMock) {
          await this.delay(500);
          return {
              trackers: await this.getTrackers(),
              users: MOCK_USERS
          };
      }

      try {
          const response = await fetch(`/api/project/${projectId}/details`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  url: this.baseUrl,
                  apiKey: this.apiKey
              })
          });

          if (!response.ok) {
              throw new Error(`Failed to fetch project details: ${response.status}`);
          }

          return response.json();
      } catch (error) {
          console.error("Error fetching project details from server:", error);
          return { trackers: [], users: [] };
      }
  }

  async getUsers(projectId?: number): Promise<RedmineUser[]> {
    if (this.isMock) {
      await this.delay(300);
      return MOCK_USERS;
    }
    try {
      // If projectId is provided, fetch project members (doesn't require admin)
      // Otherwise try to fetch all users (requires admin privileges)
      if (projectId) {
        const data = await this.fetch<{ memberships: Array<{ user: RedmineUser }> }>(`/projects/${projectId}/memberships.json?limit=100`);
        return data.memberships?.map(m => m.user).filter(u => u) || [];
      } else {
        // Try to fetch all users (requires admin privileges in many Redmine installations)
        const data = await this.fetch<{ users: RedmineUser[] }>('/users.json?limit=100');
        return data.users;
      }
    } catch (error: any) {
      // If 403, user doesn't have permission to list all users
      // This is common for non-admin users
      console.warn("Cannot fetch users (likely insufficient permissions):", error.message);
      // Return empty array - the assignee dropdown will just show current assignee
      return [];
    }
  }

  async getStatuses(): Promise<RedmineStatus[]> {
    if (this.isMock) {
      await this.delay(200);
      return [
          { id: 1, name: 'New', is_closed: false },
          { id: 2, name: 'In Progress', is_closed: false },
          { id: 3, name: 'Resolved', is_closed: false },
          { id: 4, name: 'Feedback', is_closed: false },
          { id: 5, name: 'Closed', is_closed: true },
          { id: 6, name: 'Rejected', is_closed: true },
      ];
    }
    try {
      const data = await this.fetch<{ issue_statuses: RedmineStatus[] }>('/issue_statuses.json');
      return data.issue_statuses;
    } catch (error) {
      console.error("Failed to fetch statuses:", error);
      return [];
    }
  }

  async getPriorities(): Promise<RedminePriority[]> {
    if (this.isMock) {
      await this.delay(200);
      return [
          { id: 1, name: 'Low' },
          { id: 2, name: 'Normal' },
          { id: 3, name: 'High' },
          { id: 4, name: 'Urgent' },
          { id: 5, name: 'Immediate' },
      ];
    }
    try {
      const data = await this.fetch<{ issue_priorities: RedminePriority[] }>('/enumerations/issue_priorities.json');
      return data.issue_priorities;
    } catch (error) {
      console.error("Failed to fetch priorities:", error);
      return [];
    }
  }

  async getTrackers(): Promise<RedmineTracker[]> {
    if (this.isMock) {
      await this.delay(200);
      return [
          { id: 1, name: 'Bug' },
          { id: 2, name: 'Feature' },
          { id: 3, name: 'Support' },
          { id: 4, name: 'Task' },
      ];
    }
    try {
      const data = await this.fetch<{ trackers: RedmineTracker[] }>('/trackers.json');
      return data.trackers;
    } catch (error) {
      console.error("Failed to fetch trackers:", error);
      return [];
    }
  }

  async getCategories(projectId: number): Promise<{ id: number; name: string }[]> {
    if (this.isMock) {
      await this.delay(200);
      return [
          { id: 1, name: 'Development' },
          { id: 2, name: 'Design' },
          { id: 3, name: 'Testing' },
      ];
    }
    try {
      const data = await this.fetch<{ issue_categories: { id: number; name: string }[] }>(`/projects/${projectId}/issue_categories.json`);
      return data.issue_categories;
    } catch (error) {
      console.warn("Failed to fetch categories:", error);
      return [];
    }
  }

  async updateIssue(issueId: number, updates: any): Promise<void> {
      if (this.isMock) {
          await this.delay(300);
          const issue = MOCK_ISSUES.find(i => i.id === issueId);
          if (issue) {
              if (updates.notes) {
                  const newJournal: RedmineJournal = {
                      id: Math.floor(Math.random() * 10000),
                      user: MOCK_USERS[0],
                      notes: updates.notes,
                      created_on: new Date().toISOString()
                  };
                  if (!issue.journals) issue.journals = [];
                  issue.journals.push(newJournal);
              }
              if (updates.status_id) {
                  const status = (await this.getStatuses()).find(s => s.id === Number(updates.status_id));
                  if (status) issue.status = status;
              }
              if (updates.priority_id) {
                  const priority = (await this.getPriorities()).find(p => p.id === Number(updates.priority_id));
                  if (priority) issue.priority = priority;
              }
              if (updates.assigned_to_id) {
                  const user = MOCK_USERS.find(u => u.id === Number(updates.assigned_to_id));
                  if (user) issue.assigned_to = user;
              }
          }
          return;
      }

      try {
        await this.fetch(`/issues/${issueId}.json`, {
            method: 'PUT',
            body: JSON.stringify({
                issue: updates
            })
        });
      } catch (error) {
          console.error("Failed to update issue:", error);
          throw error;
      }
  }

  async addNote(issueId: number, note: string): Promise<RedmineJournal> {
      await this.updateIssue(issueId, { notes: note });
      
      // Fetch the issue again to get the latest journal
      const updatedIssue = await this.getIssueDetails(issueId);
      if (updatedIssue && updatedIssue.journals) {
          return updatedIssue.journals[updatedIssue.journals.length - 1];
      }
      throw new Error("Failed to retrieve updated journal");
  }

  async updateJournal(journalId: number, notes: string): Promise<void> {
      if (this.isMock) {
          await this.delay(300);
          // Find and update the journal in mock data
          for (const issue of MOCK_ISSUES) {
              const journal = issue.journals?.find(j => j.id === journalId);
              if (journal) {
                  journal.notes = notes;
                  return;
              }
          }
          throw new Error("Journal not found");
      }

      try {
          // Requires Redmine 5.0+
          await this.fetch(`/journals/${journalId}.json`, {
              method: 'PUT',
              body: JSON.stringify({
                  journal: {
                      notes
                  }
              })
          });
      } catch (error) {
          console.error("Failed to update journal:", error);
          throw error;
      }
  }
  
  async createIssue(issue: Partial<RedmineIssue> & { project_id: number, subject: string }): Promise<RedmineIssue> {
      if (this.isMock) {
          await this.delay(500);
          const project = MOCK_PROJECTS.find(p => p.id === issue.project_id);
          const newIssue: RedmineIssue = {
              id: Math.floor(Math.random() * 10000) + 1000,
              project: { id: issue.project_id, name: project?.name || 'Unknown' },
              tracker: { id: Number(issue.tracker?.id) || 1, name: 'Task' },
              status: { id: Number(issue.status?.id) || 1, name: 'New', is_closed: false },
              priority: { id: Number(issue.priority?.id) || 2, name: 'Normal' },
              author: MOCK_USERS[0],
              subject: issue.subject,
              description: issue.description || '',
              done_ratio: 0,
              created_on: new Date().toISOString(),
              updated_on: new Date().toISOString(),
              journals: []
          };
          MOCK_ISSUES.push(newIssue);
          return newIssue;
      }

      try {
        // Map the input object to the format Redmine expects
        // We need to handle nested objects (like tracker: {id: 1}) vs flat IDs (tracker_id: 1)
        // The UI might send either, but usually flat IDs are easier for forms.
        // Let's assume the caller sends flat IDs or we extract them.
        
        const payload: any = {
            project_id: issue.project_id,
            subject: issue.subject,
            description: issue.description,
        };

        if (issue.tracker?.id) payload.tracker_id = issue.tracker.id;
        if (issue.status?.id) payload.status_id = issue.status.id;
        if (issue.priority?.id) payload.priority_id = issue.priority.id;
        if (issue.assigned_to?.id) payload.assigned_to_id = issue.assigned_to.id;
        if (issue.category?.id) payload.category_id = issue.category.id;
        
        // Also support direct ID properties if passed
        if ((issue as any).tracker_id) payload.tracker_id = (issue as any).tracker_id;
        if ((issue as any).status_id) payload.status_id = (issue as any).status_id;
        if ((issue as any).priority_id) payload.priority_id = (issue as any).priority_id;
        if ((issue as any).assigned_to_id) payload.assigned_to_id = (issue as any).assigned_to_id;
        if ((issue as any).category_id) payload.category_id = (issue as any).category_id;

        const data = await this.fetch<{ issue: RedmineIssue }>('/issues.json', {
            method: 'POST',
            body: JSON.stringify({
                issue: payload
            })
        });
        return data.issue;
      } catch (error) {
          console.error("Failed to create issue:", error);
          throw error;
      }
  }

  async getCurrentUser(): Promise<RedmineUser | null> {
    if (this.isMock) {
      await this.delay(200);
      return MOCK_USERS[0];
    }

    try {
      const data = await this.fetch<{ user: RedmineUser }>('/users/current.json');
      return data.user;
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      return null;
    }
  }
}
