import React from 'react';
import ApplicationsPage from '../components/ApplicationsPage';

const MainPage: React.FC = () => (
  <ApplicationsPage
    title="OpenClaw Instances"
    description={<p>Manage your OpenClaw AI agent instances</p>}
    empty
    loaded
    provideChildrenPadding
    removeChildrenTopPadding
  />
);

export default MainPage;
