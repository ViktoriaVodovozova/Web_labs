import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route, Navigate, Link } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Guard, Layout } from './components/Common';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import StudentsPage from './pages/StudentsPage';
import StudentDetail from './pages/StudentDetail';
import StudentForm from './pages/StudentForm';
import './styles.css';

const router = createBrowserRouter(createRoutesFromElements(
  <Route element={<AppProvider><Layout/></AppProvider>}>
    <Route index element={<Navigate to="/students" replace/>}/>
    <Route path="login" element={<AuthPage key="login"/>}/>
    <Route path="register" element={<AuthPage key="register" register/>}/>
    <Route element={<Guard/>}>
      <Route path="profile" element={<ProfilePage/>}/>
      <Route path="students" element={<StudentsPage/>}/>
      <Route path="students/:id" element={<StudentDetail/>}/>
      <Route element={<Guard admin/>}>
        <Route path="students/new" element={<StudentForm/>}/>
        <Route path="students/:id/edit" element={<StudentForm/>}/>
      </Route>
    </Route>
    <Route path="*" element={<section className="card"><h1>404 · Страница не найдена</h1><Link to="/students">К списку студентов</Link></section>}/>
  </Route>
));
createRoot(document.getElementById('root')).render(<StrictMode><RouterProvider router={router}/></StrictMode>);
