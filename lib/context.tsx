"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RedmineClient, RedmineProject, RedmineIssue, RedmineUser, RedmineStatus, RedminePriority, RedmineTracker } from './redmine';
import { useRouter } from 'next/navigation';

interface RedmineContextType {
  client: RedmineClient | null;
  user: RedmineUser | null;
  selectedProject: RedmineProject | null;
  selectedIssue: RedmineIssue | null;
  projects: RedmineProject[];
  issues: RedmineIssue[];
  isLoadingIssues: boolean;
  availableUsers: RedmineUser[];
  availableStatuses: RedmineStatus[];
  availablePriorities: RedminePriority[];
  availableTrackers: RedmineTracker[];
  availableCategories: { id: number; name: string }[];
  login: (url: string, apiKey: string) => Promise<void>;
  logout: () => void;
  selectProject: (project: RedmineProject) => void;
  selectIssue: (issue: RedmineIssue) => void;
  refreshIssues: () => Promise<void>;
  refreshIssueDetails: (issueId: number) => Promise<void>;
  updateIssue: (issueId: number, updates: any) => Promise<void>;
  createIssue: (issue: any) => Promise<void>;
}

const RedmineContext = createContext<RedmineContextType | undefined>(undefined);

export function RedmineProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<RedmineClient | null>(null);
  const [user, setUser] = useState<RedmineUser | null>(null);
  const [selectedProject, setSelectedProject] = useState<RedmineProject | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<RedmineIssue | null>(null);
  const [projects, setProjects] = useState<RedmineProject[]>([]);
  const [issues, setIssues] = useState<RedmineIssue[]>([]);
  
  const [availableUsers, setAvailableUsers] = useState<RedmineUser[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<RedmineStatus[]>([]);
  const [availablePriorities, setAvailablePriorities] = useState<RedminePriority[]>([]);
  const [availableTrackers, setAvailableTrackers] = useState<RedmineTracker[]>([]);
  const [availableCategories, setAvailableCategories] = useState<{ id: number; name: string }[]>([]);

  const [isLoadingIssues, setIsLoadingIssues] = useState(false);

  const router = useRouter();

  // Helper to load metadata
  const loadMetadata = async (apiClient: RedmineClient) => {
      try {
          const [s, p] = await Promise.all([
              apiClient.getStatuses(),
              apiClient.getPriorities(),
              // Trackers are now loaded per-project
          ]);
          setAvailableStatuses(s);
          setAvailablePriorities(p);
      } catch (e) {
          console.error("Failed to load metadata", e);
      }
  };

  // Check for existing session on mount
  useEffect(() => {
    const storedUrl = localStorage.getItem('redmine_url');
    const storedKey = localStorage.getItem('redmine_key');
    if (storedUrl && storedKey) {
      const newClient = new RedmineClient(storedUrl, storedKey);
      setClient(newClient);
      newClient.getCurrentUser().then(setUser).catch(console.error);
      loadMetadata(newClient);
    } else {
        router.push('/login');
    }
  }, []);

  // Load projects when client is ready
  useEffect(() => {
    if (client) {
      client.getProjects().then(setProjects).catch(console.error);
    }
  }, [client]);

  // Load issues and project details when project changes
  useEffect(() => {
    if (client && selectedProject) {
      console.log("Project changed to:", selectedProject.name, "ID:", selectedProject.id);
      setIssues([]); // Clear old issues
      setIsLoadingIssues(true);
      
      // Fetch issues
      client.getIssues(selectedProject.id)
        .then(setIssues)
        .catch(console.error)
        .finally(() => setIsLoadingIssues(false));
      
      // Fetch project details (trackers and users) from server
      console.log("Fetching project details from server for:", selectedProject.id);
      setAvailableUsers([]); // Clear users while loading
      
      client.getProjectDetailsFromServer(selectedProject.id).then(details => {
          console.log("Received project details:", details);
          setAvailableTrackers(details.trackers || []);
          setAvailableUsers(details.users || []);
      }).catch(console.error);

      // Load categories
      client.getCategories(selectedProject.id).then(setAvailableCategories).catch(console.error);
    }
  }, [client, selectedProject]);

  const login = async (url: string, apiKey: string) => {
    localStorage.setItem('redmine_url', url);
    localStorage.setItem('redmine_key', apiKey);
    const newClient = new RedmineClient(url, apiKey);
    setClient(newClient);
    
    try {
        const currentUser = await newClient.getCurrentUser();
        setUser(currentUser);
        await loadMetadata(newClient);
    } catch (e) {
        console.error("Failed to get user", e);
    }
    
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('redmine_url');
    localStorage.removeItem('redmine_key');
    setClient(null);
    setUser(null);
    router.push('/login');
  };

  const selectProject = (project: RedmineProject) => {
    setSelectedProject(project);
    setSelectedIssue(null); // Deselect issue when changing project
  };

  const selectIssue = async (issue: RedmineIssue) => {
    setSelectedIssue(issue);
    // Fetch full details (journals)
    if (client) {
        const details = await client.getIssueDetails(issue.id);
        if (details) setSelectedIssue(details);
    }
  };

  const refreshIssues = async () => {
      if (client && selectedProject) {
          setIsLoadingIssues(true);
          try {
            const newIssues = await client.getIssues(selectedProject.id);
            setIssues(newIssues);
          } catch (error) {
              console.error("Failed to refresh issues:", error);
          } finally {
              setIsLoadingIssues(false);
          }
      }
  };

  const refreshIssueDetails = async (issueId: number) => {
      if (client && selectedIssue && selectedIssue.id === issueId) {
          const details = await client.getIssueDetails(issueId);
          if (details) setSelectedIssue(details);
      }
  }

  const updateIssue = async (issueId: number, updates: any) => {
      if (client) {
          await client.updateIssue(issueId, updates);
          await refreshIssueDetails(issueId);
          await refreshIssues(); // Refresh list to show updated status/priority
      }
  };

  const createIssue = async (issue: any) => {
      if (client && selectedProject) {
          const newIssue = await client.createIssue({
              ...issue,
              project_id: selectedProject.id
          });
          await refreshIssues();
          selectIssue(newIssue);
      }
  };

  return (
    <RedmineContext.Provider value={{ 
        client, 
        user, 
        selectedProject, 
        selectedIssue, 
        projects, 
        issues, 
        isLoadingIssues,
        availableUsers,
        availableStatuses,
        availablePriorities,
        availableTrackers,
        availableCategories,
        login, 
        logout, 
        selectProject, 
        selectIssue,
        refreshIssues,
        refreshIssueDetails,
        updateIssue,
        createIssue
    }}>
      {children}
    </RedmineContext.Provider>
  );
}

export function useRedmine() {
  const context = useContext(RedmineContext);
  if (context === undefined) {
    throw new Error('useRedmine must be used within a RedmineProvider');
  }
  return context;
}
