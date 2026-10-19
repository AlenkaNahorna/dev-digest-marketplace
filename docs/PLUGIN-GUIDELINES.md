# Plugin design guidelines

Structure, manifest fields, dependencies and the pull request checklist are in [CONTRIBUTING.md](../CONTRIBUTING.md). This page covers how to make a plugin good.

## One plugin, one purpose, one owner

A plugin groups skills that one team can maintain and release together. If two sets of skills would be released at different times or by different people, they are two plugins.

## Skills

- One skill, one job. Name it for the job (`architecture-review`, not `helper`).
- `description` is loaded into every session of every user. Write what the skill does **and when to use it**, in one or two sentences, and stay within the budget in [COST-BASELINE.md](COST-BASELINE.md).
- Keep the body focused and numbered. Move long reference material into separate files in the skill folder and link to them so it loads only when needed.
- Prefer instructions to tools: do not add a hook or an MCP server when a skill is enough.

## Compatibility

State what the plugin needs in its README under "Requires" (tool versions, DevDigest capabilities). Breaking a skill's contract is a major release.

## Output language

Write skills, descriptions and docs in English.

## Hooks, scripts and MCP servers

Use them only when a skill cannot do the job. They run code on the user's machine, so they need admin review (see [SECURITY.md](SECURITY.md)). Reference bundled files with `${CLAUDE_PLUGIN_ROOT}`, never an absolute path.
