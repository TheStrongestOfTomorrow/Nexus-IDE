/**
 * AI Tool Use System for Nexus IDE v5.5.5
 *
 * Defines all available tools that the AI assistant can invoke during
 * a conversation. Each tool has a name, description, and parameter schema.
 * Tool calls are executed locally inside the IDE and the results are
 * fed back to the AI model.
 */

// ─── Exported Types ────────────────────────────────────────────────────────────

export interface AIToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean; enum?: string[] }>;
}

export interface AIToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface AIToolResult {
  toolCallId: string;
  name: string;
  result: string;
  isError?: boolean;
}

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const FILE_TOOLS: AIToolDefinition[] = [
  {
    name: 'read_file',
    description: 'Read the content of a file from the workspace.',
    parameters: {
      path: { type: 'string', description: 'Path to the file relative to workspace root', required: true },
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file, creating it if it does not exist.',
    parameters: {
      path: { type: 'string', description: 'Path to the file relative to workspace root', required: true },
      content: { type: 'string', description: 'Content to write to the file', required: true },
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file from the workspace.',
    parameters: {
      path: { type: 'string', description: 'Path to the file to delete', required: true },
    },
  },
  {
    name: 'list_files',
    description: 'List files and directories at a given path.',
    parameters: {
      path: { type: 'string', description: 'Directory path to list (defaults to workspace root)' },
      recursive: { type: 'boolean', description: 'Whether to list recursively' },
    },
  },
  {
    name: 'search_files',
    description: 'Search for text patterns across workspace files.',
    parameters: {
      query: { type: 'string', description: 'Text or regex pattern to search for', required: true },
      path: { type: 'string', description: 'Directory to search in (defaults to workspace root)' },
      regex: { type: 'boolean', description: 'Whether the query is a regular expression' },
    },
  },
  {
    name: 'get_file_info',
    description: 'Get metadata about a file (name, size, language, last modified).',
    parameters: {
      path: { type: 'string', description: 'Path to the file', required: true },
    },
  },
  {
    name: 'create_directory',
    description: 'Create a new directory in the workspace.',
    parameters: {
      path: { type: 'string', description: 'Path of the directory to create', required: true },
    },
  },
  {
    name: 'rename_file',
    description: 'Rename or move a file in the workspace.',
    parameters: {
      old_path: { type: 'string', description: 'Current path of the file', required: true },
      new_path: { type: 'string', description: 'New path for the file', required: true },
    },
  },
];

const GIT_TOOLS: AIToolDefinition[] = [
  {
    name: 'git_status',
    description: 'Show the current git working tree status (modified, staged, untracked files).',
    parameters: {},
  },
  {
    name: 'git_diff',
    description: 'Show git diff for a specific file or all staged changes.',
    parameters: {
      file: { type: 'string', description: 'Specific file to diff (omit for all changes)' },
      staged: { type: 'boolean', description: 'Whether to show staged diff only' },
    },
  },
  {
    name: 'git_log',
    description: 'Show recent commit history.',
    parameters: {
      count: { type: 'number', description: 'Number of commits to show (default 10)' },
    },
  },
  {
    name: 'git_add',
    description: 'Stage file(s) for commit.',
    parameters: {
      paths: { type: 'string', description: 'File path(s) to stage, space-separated (use "." for all)', required: true },
    },
  },
  {
    name: 'git_commit',
    description: 'Create a git commit with the given message.',
    parameters: {
      message: { type: 'string', description: 'Commit message', required: true },
    },
  },
  {
    name: 'git_branch',
    description: 'List, create, or switch branches.',
    parameters: {
      action: { type: 'string', description: 'Action to perform', required: true, enum: ['list', 'create', 'switch'] },
      name: { type: 'string', description: 'Branch name (for create/switch actions)' },
    },
  },
  {
    name: 'git_checkout',
    description: 'Checkout a branch, tag, or specific file.',
    parameters: {
      ref: { type: 'string', description: 'Branch, tag, or file reference to checkout', required: true },
    },
  },
  {
    name: 'git_pull',
    description: 'Pull latest changes from a remote repository.',
    parameters: {
      remote: { type: 'string', description: 'Remote name (default "origin")' },
      branch: { type: 'string', description: 'Branch to pull' },
    },
  },
  {
    name: 'git_push',
    description: 'Push local commits to a remote repository.',
    parameters: {
      remote: { type: 'string', description: 'Remote name (default "origin")' },
      branch: { type: 'string', description: 'Branch to push' },
    },
  },
  {
    name: 'git_stash',
    description: 'Stash current uncommitted changes.',
    parameters: {
      message: { type: 'string', description: 'Optional stash message' },
    },
  },
];

const GITHUB_TOOLS: AIToolDefinition[] = [
  {
    name: 'github_create_issue',
    description: 'Create a new GitHub issue.',
    parameters: {
      title: { type: 'string', description: 'Issue title', required: true },
      body: { type: 'string', description: 'Issue body (markdown supported)' },
    },
  },
  {
    name: 'github_list_issues',
    description: 'List GitHub issues for the current repository.',
    parameters: {
      state: { type: 'string', description: 'Filter by state', enum: ['open', 'closed', 'all'] },
      count: { type: 'number', description: 'Number of issues to return (default 10)' },
    },
  },
  {
    name: 'github_create_pr',
    description: 'Create a new pull request.',
    parameters: {
      title: { type: 'string', description: 'PR title', required: true },
      body: { type: 'string', description: 'PR description (markdown supported)' },
      head: { type: 'string', description: 'Head branch (source)', required: true },
      base: { type: 'string', description: 'Base branch (target)', required: true },
    },
  },
  {
    name: 'github_list_prs',
    description: 'List pull requests for the current repository.',
    parameters: {
      state: { type: 'string', description: 'Filter by state', enum: ['open', 'closed', 'all'] },
    },
  },
  {
    name: 'github_search_repos',
    description: 'Search GitHub repositories by query.',
    parameters: {
      query: { type: 'string', description: 'Search query', required: true },
    },
  },
  {
    name: 'github_read_file',
    description: 'Read a file from a GitHub repository (not the local workspace).',
    parameters: {
      repo: { type: 'string', description: 'Repository in "owner/repo" format', required: true },
      path: { type: 'string', description: 'File path in the repository', required: true },
    },
  },
  {
    name: 'github_create_file',
    description: 'Create or update a file on a GitHub repository.',
    parameters: {
      repo: { type: 'string', description: 'Repository in "owner/repo" format', required: true },
      path: { type: 'string', description: 'File path in the repository', required: true },
      content: { type: 'string', description: 'File content', required: true },
      message: { type: 'string', description: 'Commit message', required: true },
    },
  },
  {
    name: 'github_list_branches',
    description: 'List branches for a GitHub repository.',
    parameters: {
      repo: { type: 'string', description: 'Repository in "owner/repo" format', required: true },
    },
  },
];

const TERMINAL_TOOLS: AIToolDefinition[] = [
  {
    name: 'run_terminal_command',
    description: 'Execute a shell command in the integrated terminal.',
    parameters: {
      command: { type: 'string', description: 'Shell command to execute', required: true },
    },
  },
  {
    name: 'get_terminal_output',
    description: 'Get the recent output from the terminal buffer.',
    parameters: {},
  },
  {
    name: 'clear_terminal',
    description: 'Clear the terminal output buffer.',
    parameters: {},
  },
];

const CODE_ANALYSIS_TOOLS: AIToolDefinition[] = [
  {
    name: 'analyze_code',
    description: 'Analyze code quality for a file, returning basic metrics like line count and complexity.',
    parameters: {
      path: { type: 'string', description: 'Path to the file to analyze', required: true },
    },
  },
  {
    name: 'find_references',
    description: 'Find all references to a symbol across workspace files.',
    parameters: {
      symbol: { type: 'string', description: 'Symbol name to search for', required: true },
      path: { type: 'string', description: 'File to search within (omit for all files)' },
    },
  },
  {
    name: 'count_lines_of_code',
    description: 'Count lines of code for a file or directory.',
    parameters: {
      path: { type: 'string', description: 'File or directory path (defaults to workspace root)' },
    },
  },
  {
    name: 'get_language_stats',
    description: 'Get language distribution statistics for the workspace.',
    parameters: {},
  },
];

const UI_TOOLS: AIToolDefinition[] = [
  {
    name: 'show_notification',
    description: 'Show a notification to the user.',
    parameters: {
      message: { type: 'string', description: 'Notification message', required: true },
      type: { type: 'string', description: 'Notification type', enum: ['info', 'success', 'warning', 'error'] },
    },
  },
  {
    name: 'open_file',
    description: 'Open a file in the editor and set it as the active tab.',
    parameters: {
      path: { type: 'string', description: 'Path to the file to open', required: true },
    },
  },
  {
    name: 'set_editor_setting',
    description: 'Change an editor setting (stored in localStorage).',
    parameters: {
      key: { type: 'string', description: 'Setting key name', required: true },
      value: { type: 'string', description: 'Setting value', required: true },
    },
  },
];

// ─── New Tool Categories (v5.5.5) ───────────────────────────────────────────

const WEB_TOOLS: AIToolDefinition[] = [
  {
    name: 'web_search',
    description: 'Search the web for information using a query string.',
    parameters: {
      query: { type: 'string', description: 'Search query to look up on the web', required: true },
      num_results: { type: 'number', description: 'Number of results to return (default 5)' },
    },
  },
  {
    name: 'web_scrape',
    description: 'Scrape and extract text content from a web page URL.',
    parameters: {
      url: { type: 'string', description: 'URL of the web page to scrape', required: true },
      selector: { type: 'string', description: 'CSS selector to extract specific content (optional)' },
    },
  },
  {
    name: 'web_screenshot',
    description: 'Take a screenshot of a web page and return it as base64 image data.',
    parameters: {
      url: { type: 'string', description: 'URL of the web page to screenshot', required: true },
      full_page: { type: 'boolean', description: 'Whether to capture the full scrollable page (default false)' },
    },
  },
  {
    name: 'fetch_url',
    description: 'Fetch raw content from a URL (HTML, JSON, text, etc.).',
    parameters: {
      url: { type: 'string', description: 'URL to fetch content from', required: true },
      method: { type: 'string', description: 'HTTP method (default GET)', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
      headers: { type: 'string', description: 'JSON string of custom headers to include' },
      body: { type: 'string', description: 'Request body for POST/PUT methods' },
    },
  },
];

const EDITOR_TOOLS: AIToolDefinition[] = [
  {
    name: 'get_selection',
    description: 'Get the currently selected text in the editor, including its file path and line range.',
    parameters: {},
  },
  {
    name: 'replace_selection',
    description: 'Replace the currently selected text in the editor with new content.',
    parameters: {
      content: { type: 'string', description: 'New text content to replace the selection with', required: true },
    },
  },
  {
    name: 'goto_line',
    description: 'Navigate the editor cursor to a specific line number in a file.',
    parameters: {
      path: { type: 'string', description: 'Path to the file', required: true },
      line: { type: 'number', description: 'Line number to navigate to (1-based)', required: true },
    },
  },
  {
    name: 'find_replace',
    description: 'Find and replace text within a file in the workspace.',
    parameters: {
      path: { type: 'string', description: 'Path to the file to search', required: true },
      find: { type: 'string', description: 'Text or regex pattern to find', required: true },
      replace: { type: 'string', description: 'Replacement text', required: true },
      regex: { type: 'boolean', description: 'Whether the find pattern is a regular expression (default false)' },
    },
  },
];

const WORKSPACE_TOOLS: AIToolDefinition[] = [
  {
    name: 'create_snippet',
    description: 'Save a code snippet with a name and description for reuse.',
    parameters: {
      name: { type: 'string', description: 'Name for the snippet', required: true },
      content: { type: 'string', description: 'Code content of the snippet', required: true },
      language: { type: 'string', description: 'Programming language of the snippet' },
      description: { type: 'string', description: 'Description of what the snippet does' },
    },
  },
  {
    name: 'list_snippets',
    description: 'List all saved code snippets with their names and languages.',
    parameters: {},
  },
  {
    name: 'apply_snippet',
    description: 'Insert a saved snippet into a file at a specific line.',
    parameters: {
      name: { type: 'string', description: 'Name of the snippet to apply', required: true },
      path: { type: 'string', description: 'Path to the file to insert into', required: true },
      line: { type: 'number', description: 'Line number to insert at (1-based, default end of file)' },
    },
  },
  {
    name: 'export_workspace',
    description: 'Export the entire workspace as a downloadable ZIP archive.',
    parameters: {
      format: { type: 'string', description: 'Export format', enum: ['zip', 'json'] },
    },
  },
];

const DEBUG_TOOLS: AIToolDefinition[] = [
  {
    name: 'toggle_breakpoint',
    description: 'Set or remove a debug breakpoint at a specific line in a file.',
    parameters: {
      path: { type: 'string', description: 'Path to the file', required: true },
      line: { type: 'number', description: 'Line number for the breakpoint (1-based)', required: true },
      action: { type: 'string', description: 'Action to perform', required: true, enum: ['add', 'remove', 'toggle'] },
    },
  },
  {
    name: 'get_call_stack',
    description: 'Get the current debug call stack with function names and line numbers.',
    parameters: {},
  },
  {
    name: 'inspect_variable',
    description: 'Inspect the value and type of a variable in the current debug context.',
    parameters: {
      name: { type: 'string', description: 'Variable name to inspect', required: true },
    },
  },
];

// ─── Aggregate Export ─────────────────────────────────────────────────────────

/** All 51 tools available to the AI assistant. */
export const AI_TOOLS: AIToolDefinition[] = [
  ...FILE_TOOLS,
  ...GIT_TOOLS,
  ...GITHUB_TOOLS,
  ...TERMINAL_TOOLS,
  ...CODE_ANALYSIS_TOOLS,
  ...UI_TOOLS,
  ...WEB_TOOLS,
  ...EDITOR_TOOLS,
  ...WORKSPACE_TOOLS,
  ...DEBUG_TOOLS,
];

/** Tool names grouped by category for display purposes. */
export const AI_TOOL_CATEGORIES = {
  'File Tools': FILE_TOOLS.map(t => t.name),
  'Git Tools': GIT_TOOLS.map(t => t.name),
  'GitHub Tools': GITHUB_TOOLS.map(t => t.name),
  'Terminal Tools': TERMINAL_TOOLS.map(t => t.name),
  'Code Analysis': CODE_ANALYSIS_TOOLS.map(t => t.name),
  'UI Tools': UI_TOOLS.map(t => t.name),
  'Web Tools': WEB_TOOLS.map(t => t.name),
  'Editor Tools': EDITOR_TOOLS.map(t => t.name),
  'Workspace Tools': WORKSPACE_TOOLS.map(t => t.name),
  'Debug Tools': DEBUG_TOOLS.map(t => t.name),
} as const;

// ─── Format Helpers for API Providers ─────────────────────────────────────────

/**
 * Convert tool definitions to OpenAI function-calling format.
 */
export function toOpenAITools(tools: AIToolDefinition[]): any[] {
  return tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(tool.parameters).map(([key, param]) => [key, { type: param.type, description: param.description, enum: param.enum }])
        ),
        required: Object.entries(tool.parameters).filter(([, p]) => p.required).map(([k]) => k),
      },
    },
  }));
}

/**
 * Convert tool definitions to Anthropic tool-use format.
 */
export function toAnthropicTools(tools: AIToolDefinition[]): any[] {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object' as const,
      properties: Object.fromEntries(
        Object.entries(tool.parameters).map(([key, param]) => [key, { type: param.type, description: param.description, enum: param.enum }])
      ),
      required: Object.entries(tool.parameters).filter(([, p]) => p.required).map(([k]) => k),
    },
  }));
}

/**
 * Convert tool definitions to Gemini function_declarations format.
 */
export function toGeminiTools(tools: AIToolDefinition[]): any[] {
  return [{
    functionDeclarations: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'OBJECT',
        properties: Object.fromEntries(
          Object.entries(tool.parameters).map(([key, param]) => [key, { type: param.type.toUpperCase() as any, description: param.description, enum: param.enum }])
        ),
        required: Object.entries(tool.parameters).filter(([, p]) => p.required).map(([k]) => k),
      },
    })),
  }];
}

/**
 * Convert tool definitions to Ollama tools format.
 */
export function toOllamaTools(tools: AIToolDefinition[]): any[] {
  return tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(tool.parameters).map(([key, param]) => [key, { type: param.type, description: param.description, enum: param.enum }])
        ),
        required: Object.entries(tool.parameters).filter(([, p]) => p.required).map(([k]) => k),
      },
    },
  }));
}

/**
 * Generate a unique tool call ID.
 */
export function generateToolCallId(): string {
  return `call_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
