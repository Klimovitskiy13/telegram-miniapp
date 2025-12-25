import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './components/theme/ThemeProvider'
import { LaunchScreen } from './pages/LaunchScreen'
import { OnboardingScreen1 } from './pages/onboarding/OnboardingScreen1'
import { OnboardingScreen2 } from './pages/onboarding/OnboardingScreen2'
import { OnboardingScreen3 } from './pages/onboarding/OnboardingScreen3'
import { OnboardingScreen4 } from './pages/onboarding/OnboardingScreen4'
import { OnboardingScreen5 } from './pages/onboarding/OnboardingScreen5'
import { MainScreen } from './pages/MainScreen'

const queryClient = new QueryClient()

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LaunchScreen />} />
            <Route path="/onboarding/1" element={<OnboardingScreen1 />} />
            <Route path="/onboarding/2" element={<OnboardingScreen2 />} />
            <Route path="/onboarding/3" element={<OnboardingScreen3 />} />
            <Route path="/onboarding/4" element={<OnboardingScreen4 />} />
            <Route path="/onboarding/5" element={<OnboardingScreen5 />} />
            <Route path="/main" element={<MainScreen />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App

