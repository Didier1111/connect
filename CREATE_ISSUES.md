# GitHub Issue Creation Script

This document provides guidance on how to create issues for Project Connect using the GitHub API.

## Prerequisites

1. A GitHub personal access token with `repo` permissions
2. curl or another HTTP client

## How to Create Issues

### 1. Set up your personal access token

Create a personal access token at https://github.com/settings/tokens with `repo` permissions.

Set it as an environment variable:
```bash
export GITHUB_TOKEN=your_personal_access_token
```

### 2. Create issues using curl

Use the following format to create issues:

```bash
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/Didier1111/connect/issues \
  -d '{
    "title": "Issue Title",
    "body": "Issue description",
    "labels": ["good first issue", "help wanted"]
  }'
```

## Example Issues to Create

### Issue 1: Improve Documentation
```bash
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/Didier1111/connect/issues \
  -d '{
    "title": "Documentation: Add examples to VIRAL_TEAMS_FRAMEWORK.md",
    "body": "The VIRAL_TEAMS_FRAMEWORK.md document contains comprehensive information about building viral teams, but it could benefit from concrete examples to make the concepts more accessible.\n\nSteps to complete:\n- Read through VIRAL_TEAMS_FRAMEWORK.md\n- Identify sections that would benefit from examples\n- Add 2-3 concrete examples for each major concept\n- Submit a pull request with your changes\n\nHelpful Resources:\n- VIRAL_TEAMS_FRAMEWORK.md\n- Look at similar open-source projects for inspiration on documentation style",
    "labels": ["good first issue", "documentation", "help wanted"]
  }'
```

### Issue 2: Research Task
```bash
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/Didier1111/connect/issues \
  -d '{
    "title": "Research: Identify successful open-source projects",
    "body": "Research and document 5 successful open-source projects that have achieved viral growth, sustainable monetization, or equitable contributor remuneration.\n\nSteps to complete:\n- Research 5 successful open-source projects\n- For each project, document:\n  - Project name and description\n  - Key factors that contributed to their success\n  - Any unique approaches to community building, monetization, or contributor remuneration\n- Add your findings to a new file called SUCCESSFUL_PROJECTS.md\n\nHelpful Resources:\n- GitHub trending repositories\n- Open Source Survey reports\n- Case studies from organizations like TODO Group",
    "labels": ["good first issue", "research", "help wanted"]
  }'
```

### Issue 3: Social Media Content
```bash
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/Didier1111/connect/issues \
  -d '{
    "title": "Community: Create social media content",
    "body": "Create social media content to promote Project Connect on various platforms.\n\nSteps to complete:\n- Create 3 Twitter posts about Project Connect\n- Create 1 LinkedIn post introducing the project\n- Design 1 simple infographic (text-based) that explains our mission\n- Save all content in a new directory called social_content\n\nHelpful Resources:\n- PROJECT_DESC.md for key messaging\n- README.md for project details",
    "labels": ["good first issue", "community", "help wanted"]
  }'
```

### Issue 4: Framework Enhancement
```bash
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/Didier1111/connect/issues \
  -d '{
    "title": "Framework: Add case studies section",
    "body": "Add a new section to the VIRAL_TEAMS_FRAMEWORK.md document that includes case studies of successful implementations.\n\nSteps to complete:\n- Add a new \"Case Studies\" section to VIRAL_TEAMS_FRAMEWORK.md\n- Include placeholders for 3 case studies (you don't need to write the full case studies)\n- For each placeholder, include:\n  - Title format\n  - Key information to include\n  - Template structure\n- Update the table of contents if one exists\n\nHelpful Resources:\n- VIRAL_TEAMS_FRAMEWORK.md",
    "labels": ["good first issue", "framework", "help wanted"]
  }'
```

### Issue 5: Issue Templates
```bash
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/Didier1111/connect/issues \
  -d '{
    "title": "Infrastructure: Create additional issue templates",
    "body": "Create additional GitHub issue templates to standardize how different types of issues are reported.\n\nSteps to complete:\n- Create templates for:\n  - Question/Support requests\n  - Refactoring suggestions\n  - Performance improvements\n- Each template should include appropriate sections and prompts\n\nHelpful Resources:\n- GitHub documentation on issue templates\n- Look at templates from other successful open-source projects",
    "labels": ["good first issue", "infrastructure", "help wanted"]
  }'
```

Remember to replace `your_personal_access_token` with your actual GitHub personal access token.