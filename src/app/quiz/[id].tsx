import { useLocalSearchParams } from 'expo-router';
import QuizScreen from '@/screens/QuizScreen';

export default function QuizRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <QuizScreen levelId={Number(id)} />;
}
