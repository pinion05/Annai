import { describe, expect, test } from 'bun:test';
import { sanitizeAssistantContent } from './sanitizeAssistantContent';

describe('sanitizeAssistantContent', () => {
  test('removes tool tags with attributes', () => {
    const input = 'Before <tool_call id="abc">{"name":"search_notion"}</tool_call> After';
    const output = sanitizeAssistantContent(input);

    expect(output).toBe('Before  After');
    expect(output).not.toContain('tool_call');
  });

  test('removes fenced JSON blocks containing tool metadata keys', () => {
    const input = [
      'Hello',
      '```json',
      '{"tool_call_id":"call_1","name":"search_notion"}',
      '```',
      'Done',
    ].join('\n');

    const output = sanitizeAssistantContent(input);

    expect(output).toBe('Hello\n\nDone');
    expect(output).not.toContain('tool_call_id');
  });

  test('removes inline JSON metadata objects', () => {
    const input = 'Result: {"tool_call_id":"call_1","name":"search_notion"} done';
    const output = sanitizeAssistantContent(input);

    expect(output).toContain('Result:');
    expect(output).toContain('done');
    expect(output).not.toContain('tool_call_id');
  });

  test('keeps normal JSON code blocks intact', () => {
    const input = [
      '```json',
      '{"title":"hello","ok":true}',
      '```',
    ].join('\n');

    const output = sanitizeAssistantContent(input);

    expect(output).toContain('"title":"hello"');
    expect(output).toContain('```json');
  });

  test('keeps plain-language mentions', () => {
    const input = 'Please do not expose tool_call_id in the UI.';
    const output = sanitizeAssistantContent(input);

    expect(output).toBe(input);
  });
});
