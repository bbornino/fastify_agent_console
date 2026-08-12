// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import NxWelcome from './nx-welcome';
import { Button } from '@/components/ui/button';

export function App() {
  return (
    <div>
      <div className='p-4 flex gap-2'>
        <Button>Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
      </div>
      <NxWelcome title="web" />
    </div>
  );
}

export default App;
