import { Route, Routes, BrowserRouter } from 'react-router-dom';
import FactoryRegistration from './components/FactoryRegistration/FactoryRegistration';
import RoleSelection from './components/RoleSelection/RoleSelection'; 

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/select-role" element={<RoleSelection />} />
        <Route path="/register-factory" element={<FactoryRegistration />} />
        <Route path="/" element={<RoleSelection />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App