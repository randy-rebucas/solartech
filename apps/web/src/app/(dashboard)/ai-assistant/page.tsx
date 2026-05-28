import type { Metadata } from 'next';
import { AiAssistant } from '@/components/ai/ai-assistant';
export const metadata: Metadata = { title: 'AI Assistant – SolarBot' };
export default function Page() { return <AiAssistant />; }
