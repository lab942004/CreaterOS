import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowRight, Bot, Layers, Send, User } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, SectionCard } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { cx } from '../components/ui/cn';
import { PlatformBadge } from '../components/ui/Platform';
import { EmptyState } from '../components/ui/States';
import { useToast } from '../components/ui/ToastProvider';

const GREETING = {
  role: 'assistant',
  content:
    'I have indexed access to every video you have published, its analytics and the comments underneath it. Ask me anything about how your content performs.',
};

export default function AIMyContent() {
  const { toast } = useToast();
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [referenced, setReferenced] = useState([]);
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

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chatMyContent(question);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
      setReferenced(res.referencedContent || []);
    } catch (err) {
      toast({ tone: 'error', title: 'Answer unavailable', description: err.message });
      setMessages((prev) => [...prev, { role: 'assistant', content: `Lookup failed: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="AI copilot"
        title="Ask my content"
        subtitle="Grounded answers about your own library — retention, hooks, formats and audience reaction."
        icon={Layers}
        action={<Badge tone={referenced.length ? 'brand' : 'neutral'}>{`${referenced.length} sources cited`}</Badge>}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
        <Card className="flex h-[560px] flex-col overflow-hidden lg:col-span-2">
          <div ref={scrollRef} className="cs-scroll-y flex-1 space-y-4 p-5">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div key={idx} className={cx('flex items-start gap-3', isUser && 'flex-row-reverse')}>
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
                      'max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-3 text-label leading-relaxed',
                      isUser ? 'bg-brand text-white' : 'cs-inset text-ink-2'
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}

            {loading ? (
              <div className="pl-11 text-caption italic text-ink-3">Querying your content database…</div>
            ) : null}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-line p-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Which of my videos has the highest retention?"
              aria-label="Ask a question about your content"
              className="cs-input flex-1"
            />
            <Button type="submit" variant="ai" size="md" icon={Send} disabled={!input.trim()} loading={loading}>
              Ask
            </Button>
          </form>
        </Card>

        <SectionCard
          title="Referenced channel data"
          subtitle="Assets the answer was grounded in"
          icon={Layers}
          bodyClassName="p-3"
        >
          {referenced.length ? (
            <ul className="space-y-1.5">
              {referenced.map((c) => (
                <li key={c.id}>
                  <NavLink
                    to={`/content/${c.id}`}
                    className="block rounded-lg border border-transparent p-3 transition-colors hover:border-line hover:bg-surface-2"
                  >
                    <PlatformBadge platform={c.platform} size="sm" />
                    <p className="mt-2 line-clamp-2 text-label font-semibold text-ink">{c.title}</p>
                    <p className="mt-1 text-caption text-ink-3">
                      {c.views?.toLocaleString()} views · {c.engagementRate}% engagement
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 text-caption font-semibold text-brand">
                      Open details
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No sources yet"
              description="Ask a question and the assets behind the answer are listed here."
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
