import React, { useEffect, useRef, useState } from 'react';
import { Bot, CornerDownLeft, Send, Sparkles, User } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { cx } from '../components/ui/cn';
import { useToast } from '../components/ui/ToastProvider';

const GREETING = {
  role: 'assistant',
  content:
    'I am your AI Content Strategist. I have read your Creator Brain, your six connected accounts and the last 90 days of engagement. Tell me the outcome you want and I will map the plan.',
};

const STARTERS = [
  'Plan my next 30 days of YouTube tutorials',
  'Which pillar should I double down on?',
  'Design a repurposing loop from my longform videos',
];

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={cx('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      <span
        className={cx(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          isUser ? 'bg-brand text-white' : 'cs-gradient-brand text-white shadow-glow'
        )}
        aria-hidden="true"
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </span>
      <div
        className={cx(
          'max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-3 text-label leading-relaxed sm:max-w-[70%]',
          isUser ? 'bg-brand text-white' : 'cs-inset text-ink-2'
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

export default function AIStrategist() {
  const { toast } = useToast();
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    const history = [...messages, { role: 'user', content: question }];
    setMessages(history);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chatStrategist(history);
      setMessages([...history, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      toast({ tone: 'error', title: 'Strategist unavailable', description: err.message });
      setMessages([...history, { role: 'assistant', content: `I could not answer that: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-168px)] min-h-[520px] flex-col gap-5">
      <PageHeader
        eyebrow="AI copilot"
        title="AI strategist"
        subtitle="Autonomous growth planning calibrated to your Creator Brain."
        icon={Sparkles}
        action={<Badge tone="brand" icon={Sparkles}>{`${messages.length} turns`}</Badge>}
      />

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="cs-scroll-y flex-1 space-y-4 p-5">
          {messages.map((m, idx) => (
            <MessageBubble key={idx} message={m} />
          ))}

          {loading ? (
            <div className="flex items-center gap-2 pl-11 text-caption italic text-ink-3">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-brand" aria-hidden="true" />
              Synthesising creator roadmap…
            </div>
          ) : null}
        </div>

        <div className="border-t border-line p-4">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the strategist…"
              aria-label="Message the AI strategist"
              className="cs-input flex-1"
            />
            <Button type="submit" variant="ai" size="md" icon={Send} disabled={!input.trim()} loading={loading}>
              Send
            </Button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {STARTERS.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => setInput(starter)}
                className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface-2 px-3 py-1.5 text-caption font-medium text-ink-2 transition-colors hover:border-brand-ring hover:text-ink"
              >
                <CornerDownLeft className="h-3 w-3" aria-hidden="true" />
                {starter}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
