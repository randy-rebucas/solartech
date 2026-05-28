import type { KbBlock } from '@/content/knowledge-base';
import { cn } from '@/lib/utils';
import { AlertTriangle, Info, Lightbulb } from 'lucide-react';

export function ArticleBody({ blocks }: { blocks: KbBlock[] }) {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'p':
            return (
              <p key={i} className="text-muted-foreground leading-relaxed mb-4">
                {block.text}
              </p>
            );
          case 'h2':
            return (
              <h2 key={i} className="text-xl font-bold mt-8 mb-3 text-foreground">
                {block.text}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={i} className="text-lg font-semibold mt-6 mb-2 text-foreground">
                {block.text}
              </h3>
            );
          case 'ul':
            return (
              <ul key={i} className="list-disc pl-6 space-y-2 mb-4 text-muted-foreground">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i} className="list-decimal pl-6 space-y-2 mb-4 text-muted-foreground">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ol>
            );
          case 'code':
            return (
              <pre
                key={i}
                className="mb-4 p-4 rounded-lg bg-accent border border-border text-sm overflow-x-auto font-mono text-foreground/90"
              >
                <code>{block.text}</code>
              </pre>
            );
          case 'callout': {
            const Icon =
              block.variant === 'warning'
                ? AlertTriangle
                : block.variant === 'tip'
                  ? Lightbulb
                  : Info;
            return (
              <div
                key={i}
                className={cn(
                  'mb-4 p-4 rounded-xl border flex gap-3',
                  block.variant === 'warning' && 'border-amber-500/30 bg-amber-500/10',
                  block.variant === 'tip' && 'border-solar-500/30 bg-solar-500/10',
                  block.variant === 'info' && 'border-border bg-accent/50',
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0 mt-0.5',
                    block.variant === 'warning' && 'text-amber-500',
                    block.variant === 'tip' && 'text-solar-500',
                    block.variant === 'info' && 'text-muted-foreground',
                  )}
                />
                <div>
                  {block.title && <p className="font-semibold text-sm mb-1">{block.title}</p>}
                  <p className="text-sm text-muted-foreground">{block.text}</p>
                </div>
              </div>
            );
          }
          default:
            return null;
        }
      })}
    </article>
  );
}
