import React, { useEffect, useRef, useState } from 'react';
import { Command, CornerDownLeft, Sparkles, Terminal } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { cx } from '../components/ui/cn';

const SUGGESTIONS = ['generate ideas for local llm', 'schedule best window', 'audit retention'];

const stamp = () => new Date().toLocaleTimeString();

export default function AICommandCenter() {
  const [cmd, setCmd] = useState('');
  const [logs, setLogs] = useState([
    { tone: 'system', text: 'CreatorOS agent daemon online. Type a command or pick a suggestion.', time: '00:00:01' },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [logs, loading]);

  const runCommand = async (raw) => {
    const command = (raw || '').trim();
    if (!command || loading) return;

    setCmd('');
    setLoading(true);
    setLogs((prev) => [...prev, { tone: 'input', text: command, time: stamp() }]);

    try {
      const res = await api.runAICommand(command);
      const result = res.result || {};
      setLogs((prev) => [
        ...prev,
        { tone: 'success', text: `${result.type || 'OK'} — ${result.message || 'Command executed successfully.'}`, time: stamp() },
      ]);

      if (Array.isArray(result.data)) {
        setLogs((prev) => [
          ...prev,
          ...result.data.map((idea) => ({
            tone: 'data',
            text: `${idea.title} · ${idea.platform} · ${idea.potentialScore}% potential`,
            time: stamp(),
          })),
        ]);
      } else if (result.data && typeof result.data === 'object') {
        const pairs = Object.entries(result.data).map(([k, v]) => `${k}: ${v}`);
        setLogs((prev) => [...prev, { tone: 'data', text: pairs.join('  ·  '), time: stamp() }]);
      }
    } catch (err) {
      setLogs((prev) => [...prev, { tone: 'error', text: err.message, time: stamp() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = (e) => {
    e.preventDefault();
    runCommand(cmd);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI operations"
        title="Command centre"
        subtitle="Dispatch prompts and system actions straight into the CreatorOS agent."
        icon={Command}
        action={<Badge tone="success" dot>Agent daemon online</Badge>}
      />

      <Card className="flex min-h-[460px] flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
          <Terminal className="h-4 w-4 text-success" aria-hidden="true" />
          <span className="font-mono text-caption font-semibold text-ink">creatoros-agent · v1.0.0</span>
          <span className="ml-auto font-mono text-caption text-ink-3">{`${logs.length} events`}</span>
        </div>

        <div ref={scrollRef} className="cs-scroll-y flex-1 space-y-2 p-5 font-mono text-caption">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="shrink-0 text-ink-3">[{log.time}]</span>
              <span
                className={cx(
                  'min-w-0 break-words',
                  log.tone === 'input' && 'text-ink',
                  log.tone === 'success' && 'text-success',
                  log.tone === 'error' && 'text-error',
                  log.tone === 'data' && 'text-brand',
                  (log.tone === 'system' || !log.tone) && 'text-ink-2'
                )}
              >
                {log.tone === 'input' ? `$ ${log.text}` : log.text}
              </span>
            </div>
          ))}

          {loading ? <div className="animate-pulse text-brand">Running autonomous routine…</div> : null}
        </div>

        <form onSubmit={handleExecute} className="border-t border-line p-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-label font-bold text-brand" aria-hidden="true">
              $
            </span>
            <input
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              placeholder="Type a command…"
              aria-label="Agent command"
              className="cs-input flex-1 font-mono"
            />
            <Button type="submit" variant="ai" size="md" disabled={!cmd.trim()} loading={loading}>
              Execute
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => runCommand(s)}
                className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface-2 px-3 py-1.5 text-caption font-medium text-ink-2 transition-colors hover:border-brand-ring hover:text-ink"
              >
                <CornerDownLeft className="h-3 w-3" aria-hidden="true" />
                {s}
              </button>
            ))}
            <span className="ml-auto inline-flex items-center gap-1.5 text-caption text-ink-3">
              <Sparkles className="h-3 w-3 text-brand" aria-hidden="true" />
              Every command is logged in Autopilot history
            </span>
          </div>
        </form>
      </Card>
    </div>
  );
}
