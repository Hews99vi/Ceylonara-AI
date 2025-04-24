import { Route, Routes, BrowserRouter } from 'react-router-dom';
import FactoryRegistration from './components/FactoryRegistration/FactoryRegistration';
import RoleSelection from './components/RoleSelection/RoleSelection'; 
import ChatPage from './components/Chat/ChatPage';
import { UserProvider } from './contexts/UserContext.jsx'; 

const App = () => {
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/select-role" element={<RoleSelection />} />
          <Route path="/register-factory" element={<FactoryRegistration />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/" element={<RoleSelection />} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  )
}

export default App