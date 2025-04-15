import React from 'react';
import { Outlet } from 'react-router-dom';
import Layout from '../components/Layout';

const SetupPage: React.FC = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default SetupPage; 