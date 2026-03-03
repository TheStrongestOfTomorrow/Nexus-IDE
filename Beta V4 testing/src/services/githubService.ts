import axios from 'axios';

const API_BASE = '/api/github';

export const githubService = {
  getAuthUrl: async () => {
    const response = await axios.get('/api/auth/github/url');
    return response.data.url;
  },

  getUser: async (token: string) => {
    const response = await axios.get(`${API_BASE}/user`, {
      headers: { Authorization: `token ${token}` }
    });
    return response.data;
  },

  getRepos: async (token: string) => {
    const response = await axios.get(`${API_BASE}/repos`, {
      headers: { Authorization: `token ${token}` }
    });
    return response.data;
  },

  getRepoContents: async (token: string, owner: string, repo: string, path: string = '') => {
    const response = await axios.get(`${API_BASE}/repos/${owner}/${repo}/contents/${path}`, {
      headers: { Authorization: `token ${token}` }
    });
    return response.data;
  },

  createRepo: async (token: string, name: string, description: string, isPrivate: boolean, license?: string) => {
    const response = await axios.post(`${API_BASE}/repos`, {
      name,
      description,
      private: isPrivate,
      license_template: license
    }, {
      headers: { Authorization: `token ${token}` }
    });
    return response.data;
  },

  pushFiles: async (token: string, owner: string, repo: string, message: string, files: { path: string, content: string }[]) => {
    const response = await axios.post(`${API_BASE}/repos/${owner}/${repo}/push`, {
      message,
      files
    }, {
      headers: { Authorization: `token ${token}` }
    });
    return response.data;
  },

  // Helper to recursively fetch all files in a repo (simplified)
  fetchAllFiles: async (token: string, owner: string, repo: string, path: string = '') => {
    const contents = await githubService.getRepoContents(token, owner, repo, path);
    let files: { name: string, content: string, path: string }[] = [];

    for (const item of contents) {
      if (item.type === 'file') {
        const fileData = await axios.get(item.download_url);
        files.push({
          name: item.name,
          path: item.path,
          content: typeof fileData.data === 'object' ? JSON.stringify(fileData.data, null, 2) : fileData.data
        });
      } else if (item.type === 'dir') {
        const subFiles = await githubService.fetchAllFiles(token, owner, repo, item.path);
        files = [...files, ...subFiles];
      }
    }
    return files;
  }
};
