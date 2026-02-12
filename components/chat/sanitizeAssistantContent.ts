const TOOL_TAGS = ['tool_call', 'tool_response', 'function_call', 'tool_result'] as const;
const TOOL_METADATA_KEYS = ['tool_call_id', 'tool_calls', 'function_call', 'tool_result'] as const;

const TOOL_METADATA_KEY_PATTERN = TOOL_METADATA_KEYS.join('|');
const TOOL_METADATA_JSON_KEY_RE = new RegExp(`"(?:${TOOL_METADATA_KEY_PATTERN})"\\s*:`, 'i');
const TOOL_METADATA_LINE_RE = new RegExp(`\\b(?:${TOOL_METADATA_KEY_PATTERN})\\b`, 'i');

export interface SanitizeAssistantContentOptions {
  trim?: boolean;
}

const removeTaggedToolMetadata = (input: string) => {
  let output = input;

  for (const tag of TOOL_TAGS) {
    const closedTagPattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    const danglingTagPattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*$`, 'gi');

    output = output.replace(closedTagPattern, '').replace(danglingTagPattern, '');
  }

  return output;
};

const removeMetadataCodeFences = (input: string) => {
  return input.replace(/```(?:json)?\s*([\s\S]*?)```/gi, (block, inner: string) => {
    return TOOL_METADATA_JSON_KEY_RE.test(inner) ? '' : block;
  });
};

const removeInlineMetadataJson = (input: string) => {
  return input
    .replace(
      /\{[^\n{}]*"(?:tool_call_id|tool_calls|function_call|tool_result)"\s*:[^\n{}]*\}/gi,
      ''
    )
    .replace(/^\s*"?(?:tool_calls?|tool_call_id|function_call|tool_result)"?\s*:.*$/gim, '');
};

const removeStructuredMetadataLines = (input: string) => {
  return input
    .split('\n')
    .filter((line) => {
      if (!TOOL_METADATA_LINE_RE.test(line)) {
        return true;
      }

      // Keep plain-language mentions (e.g. docs), remove structured metadata-ish lines.
      return !/[{}\[\]":<>]/.test(line);
    })
    .join('\n');
};

export const sanitizeAssistantContent = (
  content: string,
  options: SanitizeAssistantContentOptions = {}
) => {
  const { trim = true } = options;

  if (!content) return '';

  let cleaned = content;
  cleaned = removeTaggedToolMetadata(cleaned);
  cleaned = removeMetadataCodeFences(cleaned);
  cleaned = removeInlineMetadataJson(cleaned);
  cleaned = removeStructuredMetadataLines(cleaned);
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return trim ? cleaned.trim() : cleaned;
};
