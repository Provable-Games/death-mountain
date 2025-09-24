import { useUIStore } from '@/stores/uiStore';

export function HotkeyHint({ keys, breakLine = false }: { keys: string, breakLine?: boolean }) {
  const { showHotkeys } = useUIStore();
  if (!showHotkeys) return null;
  return breakLine
    ? (<><br /><span className='hotkey-hint'>[{keys}]</span></>)
    : (<span className='hotkey-hint'>[{keys}]</span>);
}

export default HotkeyHint;


