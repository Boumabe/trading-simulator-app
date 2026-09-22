import { useLocalSearchParams } from 'expo-router';
import PlayScreen from '@/screens/PlayScreen';

export default function PlayRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PlayScreen levelId={Number(id)} />;
}
