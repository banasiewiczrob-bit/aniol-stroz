import { Redirect } from 'expo-router';

export default function Index() {
  // Zawsze przekierowuje do intro.tsx przy starcie
  return <Redirect href="/intro" />;
}