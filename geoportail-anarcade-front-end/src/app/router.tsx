import {createBrowserRouter} from 'react-router-dom';
import Layout from './Layout';
import MapPage from '../features/carte/Mapage';
import FarmersPage from '../features/exploitants/FamersPage';
import FarmerDetailPage from '../features/exploitants/FamersPageDetails';
import Data from '../features/data/Data';

export const router=createBrowserRouter([
   { element: <Layout />,
     children:[
         { path: '/', element: <MapPage /> },
        { path: '/exploitants', element: <FarmersPage /> },
        { path: '/exploitants/:id', element: <FarmerDetailPage /> },
        {path:'/data',element:<Data/>}
     ]
   }
])
